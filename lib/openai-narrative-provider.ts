import "server-only";

import OpenAI from "openai";
import type { AxiomResult } from "@/types";
import type { LearnerProfile, NarrativeProvider } from "@/lib/narrative-service";

const narrativeSchema = {
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

const instructions = `You are AXIOM's explanatory layer for a STEM tutor.

The supplied AXIOM result is the authoritative deterministic record. Explain it for the requested learner level and language.
Rules:
- Do not recalculate, infer a missing fact, correct, extend, or contradict the record.
- Do not add numerical values, percentages, units, frequencies, formulas, scientific claims, or historical claims that are absent from the record.
- Every factual statement in the summary or an explanation segment must cite one or more supplied fact or step IDs.
- Citation IDs must be copied exactly from the record. Use facts for results and steps for procedure.
- Keep the explanation clear, short, and age-appropriate. One safe analogy is fine, but it cannot assert new facts.
- Ask one optional follow-up question. Do not provide medical, financial, religious, or personal advice.
- Return JSON matching the requested schema only.`;

export function getOpenAiNarrativeProviderFromEnv(): NarrativeProvider | null {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;
  if (!apiKey || !model) return null;

  const client = new OpenAI({ apiKey, timeout: 10_000, maxRetries: 0 });
  return {
    async generate(result: AxiomResult, learner: LearnerProfile): Promise<unknown> {
      const response = await client.responses.create({
        model,
        store: false,
        max_output_tokens: 900,
        instructions,
        input: JSON.stringify({
          learner,
          axiomResult: result,
          allowedCitationIds: [
            ...result.facts.map((entry) => entry.id),
            ...result.steps.map((entry) => entry.id),
          ],
        }),
        text: {
          format: {
            type: "json_schema",
            name: "axiom_narrative",
            strict: true,
            schema: narrativeSchema,
          },
        },
      });
      if (!response.output_text) throw new Error("OpenAI returned an empty response");
      return JSON.parse(response.output_text);
    },
  };
}

