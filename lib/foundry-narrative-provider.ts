import "server-only";

import type { AxiomResult } from "@/types";
import type { LearnerProfile, NarrativeProvider } from "@/lib/narrative-service";

/**
 * Optional Azure AI Foundry narrative provider.
 *
 * When AZURE_AI_PROJECT_ENDPOINT, AZURE_AI_AGENT_NAME, and
 * AZURE_AI_AGENT_VERSION are all configured, AXIOM can delegate the explanatory
 * narrative to a Foundry-hosted agent that has been instructed with the same
 * OUTPUT CONTRACT (cited segments + verification status) used by the OpenAI
 * Responses provider.
 *
 * Azure credentials are produced by DefaultAzureCredential — the browser never
 * sees them. If any setting is missing, this provider returns null and the
 * narrative service falls back to the deterministic narrative.
 */

interface FoundryConfig {
  endpoint: string;
  agentName: string;
  agentVersion: string;
}

function readConfig(): FoundryConfig | null {
  const endpoint = process.env.AZURE_AI_PROJECT_ENDPOINT;
  const agentName = process.env.AZURE_AI_AGENT_NAME;
  const agentVersion = process.env.AZURE_AI_AGENT_VERSION;
  if (!endpoint || !agentName || !agentVersion) return null;
  return { endpoint, agentName, agentVersion };
}

export function getFoundryNarrativeProviderFromEnv(): NarrativeProvider | null {
  const config = readConfig();
  if (!config) return null;

  return {
    async generate(
      _result: AxiomResult,
      _learner: LearnerProfile
    ): Promise<unknown> {
      // Lazy-imports keep the Azure SDK out of the deterministic-only startup
      // path and ensure users without Azure can still run AXIOM offline.
      const [{ AIProjectClient }, { DefaultAzureCredential }] = await Promise.all([
        import("@azure/ai-projects"),
        import("@azure/identity"),
      ]);
      const projectClient = new AIProjectClient(
        config.endpoint,
        new DefaultAzureCredential()
      );
      const openAIClient = projectClient.getOpenAIClient();

      const conversation = await openAIClient.conversations.create({
        items: [
          {
            type: "message",
            role: "user",
            content: buildPrompt(_result, _learner),
          },
        ],
      });

      const response = await openAIClient.responses.create(
        { conversation: conversation.id },
        {
          body: {
            agent: {
              name: config.agentName,
              version: config.agentVersion,
              type: "agent_reference",
            },
          },
        }
      );

      if (!response.output_text) throw new Error("Azure Foundry agent returned an empty response");
      return JSON.parse(response.output_text);
    },
  };
}

function buildPrompt(result: AxiomResult, learner: LearnerProfile): string {
  const allowedCitationIds = [
    ...result.facts.map((fact) => fact.id),
    ...result.steps.map((step) => step.id),
  ];
  return JSON.stringify({
    learner,
    axiomResult: result,
    allowedCitationIds,
    contract: {
      summary: "string",
      summaryCitations: "string[]",
      explanationSegments: "Array<{ id: string; text: string; citations: string[] }>",
      followUpQuestions: "string[]",
      verification: {
        status: "verified | warnings | unverified",
        supportedClaims: "number",
        unsupportedClaims: "string[]",
      },
    },
  });
}
