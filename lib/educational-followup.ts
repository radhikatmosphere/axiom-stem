import "server-only";

import OpenAI from "openai";
import type {
  AxiomResult,
  NarrativeResult,
  NarrativeSegment,
  VerificationReport,
} from "@/types";
import type { LearnerProfile } from "@/lib/narrative-service";
import { verifyNarrative } from "@/lib/claim-verifier";
import { parseNarrativeDraft } from "@/lib/narrative-service";

/**
 * Educational follow-up narrative provider.
 *
 * The model may answer one free-text educational question per turn, but ONLY
 * with the most recent deterministic AxiomResult as its sole factual source.
 * Output is parsed through the same parseNarrativeDraft + verifyNarrative
 * pipeline used for the primary narrative.
 *
 * The follow-up path is interpretation, not verification: every returned
 * NarrativeResult is tagged with an additional warning explaining that it is
 * an interpretation of the deterministic record, and it inherits the
 * VerificationReport computed by verifyNarrative. If a numerical claim slips
 * outside the deterministic allowlist, the badge becomes Warnings or Could not
 * verify — it can never be a clean Verified green.
 *
 * Provider order:
 *   1. OpenAI Responses API if OPENAI_API_KEY + OPENAI_MODEL are configured.
 *   2. Azure AI Foundry agent if AZURE_AI_* are configured.
 *   3. Deterministic study-prompt fallback (never fabricates an answer).
 */

const FOLLOWUP_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "summaryCitations", "explanationSegments", "followUpQuestions"],
  properties: {
    summary: { type: "string" },
    summaryCitations: { type: "array", items: { type: "string" } },
    explanationSegments: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "text", "citations"],
        properties: {
          id: { type: "string" },
          text: { type: "string" },
          citations: { type: "array", items: { type: "string" } },
        },
      },
    },
    followUpQuestions: { type: "array", items: { type: "string" } },
  },
} as const;

const FOLLOWUP_INSTRUCTIONS = `You are AXIOM's optional educational follow-up layer for a single STEM learner.

The most recent deterministic AxiomResult is your SOLE factual source. The learner just asked a follow-up question such as "why is Aa dominant?".

Rules:
- You may answer interpretation/explanation questions about that result only.
- Treat every segment as interpretation. Do NOT claim it is a verified fact beyond the supplied AxiomResult.
- You may NOT introduce new numbers, percentages, units, frequencies, formulas, or novel scientific facts not in the record.
- You may re-describe, reorganize, and use analogies drawn from the record. You may admit "the record does not say" if asked something it cannot answer.
- Cite one or more supplied fact or step IDs whenever you reference a piece of evidence.
- Length must stay under five short segments.
- No medical, financial, religious, or personal advice. Redirect politely if asked.
- Return JSON matching the schema only.`;

export interface FollowupResponse {
  narrative: NarrativeResult;
  provider: "openai" | "azure_foundry" | "deterministic_fallback";
}

interface ProviderCall {
  provider: "openai" | "azure_foundry";
  run: () => Promise<unknown>;
}

function buildPrompt(result: AxiomResult, learner: LearnerProfile, question: string): string {
  return JSON.stringify({
    learner,
    question,
    lastDeterministicResult: result,
    allowedCitationIds: [
      ...result.facts.map((f) => f.id),
      ...result.steps.map((s) => s.id),
    ],
  });
}

function openAiCall(result: AxiomResult, learner: LearnerProfile, question: string): ProviderCall | null {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;
  if (!apiKey || !model) return null;
  const client = new OpenAI({ apiKey, timeout: 10_000, maxRetries: 0 });
  return {
    provider: "openai",
    run: async () => {
      const response = await client.responses.create({
        model,
        store: false,
        max_output_tokens: 700,
        instructions: FOLLOWUP_INSTRUCTIONS,
        input: buildPrompt(result, learner, question),
        text: {
          format: {
            type: "json_schema",
            name: "axiom_followup",
            strict: true,
            schema: FOLLOWUP_SCHEMA,
          },
        },
      });
      if (!response.output_text) throw new Error("empty OpenAI follow-up");
      return JSON.parse(response.output_text);
    },
  };
}

function azureCall(result: AxiomResult, learner: LearnerProfile, question: string): ProviderCall | null {
  const endpoint = process.env.AZURE_AI_PROJECT_ENDPOINT;
  const agentName = process.env.AZURE_AI_AGENT_NAME;
  const agentVersion = process.env.AZURE_AI_AGENT_VERSION;
  if (!endpoint || !agentName || !agentVersion) return null;
  return {
    provider: "azure_foundry",
    run: async () => {
      const [{ AIProjectClient }, { DefaultAzureCredential }] = await Promise.all([
        import("@azure/ai-projects"),
        import("@azure/identity"),
      ]);
      const projectClient = new AIProjectClient(endpoint, new DefaultAzureCredential());
      const openAIClient = projectClient.getOpenAIClient();
      const conversation = await openAIClient.conversations.create({
        items: [{ type: "message", role: "user", content: buildPrompt(result, learner, question) }],
      });
      const response = await openAIClient.responses.create(
        { conversation: conversation.id },
        {
          body: {
            agent: { name: agentName, version: agentVersion, type: "agent_reference" },
          },
        }
      );
      if (!response.output_text) throw new Error("empty Foundry follow-up");
      return JSON.parse(response.output_text);
    },
  };
}

export async function generateEducationalFollowup(
  result: AxiomResult,
  learner: LearnerProfile,
  question: string
): Promise<FollowupResponse> {
  for (const call of [openAiCall(result, learner, question), azureCall(result, learner, question)]) {
    if (!call) continue;
    try {
      const raw = await call.run();
      const draft = parseNarrativeDraft(raw);
      if (!draft) continue;
      const verification: VerificationReport = verifyNarrative(
        result,
        { text: draft.summary, citations: draft.summaryCitations },
        draft.explanationSegments,
        { additionalWarnings: ["Educational follow-up is an interpretation of the deterministic record, not a new verified claim."] }
      );
      return {
        narrative: {
          summary: draft.summary,
          summaryCitations: draft.summaryCitations,
          explanationSegments: draft.explanationSegments,
          followUpQuestions: draft.followUpQuestions,
          unsupportedClaims: verification.unsupportedNumericalClaims,
          verification,
          provider: "openai",
        },
        provider: call.provider,
      };
    } catch {
      // Try the next provider; fall through to deterministic fallback.
    }
  }
  return {
    narrative: fallbackInterpretation(result, learner, question),
    provider: "deterministic_fallback",
  };
}

function fallbackInterpretation(
  result: AxiomResult,
  learner: LearnerProfile,
  question: string
): NarrativeResult {
  const spanish = learner.language === "es";
  const summary = spanish
    ? "Sin modelo narrativo, AXIOM no interpreta preguntas libres. Revisa el ledger y prueba otra cross determinista."
    : "Without a narrating model, AXIOM cannot answer this free-text question. Inspect the ledger and try another deterministic question.";
  const segment: NarrativeSegment = {
    id: "followup.fallback.review",
    text: spanish
      ? `${result.domain === "genetics" ? "Cruce" : "Cómputo"}: inspecciona los IDs del ledger para responder tu pregunta sobre "${question.slice(0, 80)}".`
      : `${result.domain === "genetics" ? "Cross" : "Count"}: inspect the ledger IDs to answer your question about "${question.slice(0, 80)}".`,
    citations: result.facts.length ? [result.facts[0].id] : [],
  };
  const verification = verifyNarrative(
    result,
    { text: summary, citations: [] },
    [segment],
    { additionalWarnings: ["Educational follow-up fallback: no narrating model was available."] }
  );
  return {
    summary,
    summaryCitations: [],
    explanationSegments: [segment],
    followUpQuestions: [],
    unsupportedClaims: verification.unsupportedNumericalClaims,
    verification,
    provider: "openai",
    fallbackReason: "invalid_model_output",
  };
}
