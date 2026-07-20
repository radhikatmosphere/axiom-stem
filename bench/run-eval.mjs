import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import OpenAI from "openai";
import {
  REPORTS_DIR,
  bundleModule,
  environmentNotes,
  markdownReport,
} from "./utils.mjs";

const [{ computeAxiom }, { verifyNarrative }, { generateNarrative, parseNarrativeDraft }] = await Promise.all([
  bundleModule("eval-axiom-result", "lib/axiom-result.ts"),
  bundleModule("eval-claim-verifier", "lib/claim-verifier.ts"),
  bundleModule("eval-narrative-service", "lib/narrative-service.ts"),
]);

const result = computeAxiom({
  domain: "genetics",
  data: { parent1: "Aa", parent2: "aa" },
});
const cases = [];
const failures = [];

async function check(name, fn) {
  try {
    await fn();
    cases.push({ name, ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    cases.push({ name, ok: false, error: message });
    failures.push({ name, error: message });
  }
}

await check("valid cited explanation", () => {
  const report = verifyNarrative(
    result,
    { text: "The Aa × aa cross is enumerated in a Punnett grid.", citations: ["genetics.parents", "genetics.grid"] },
    [{ id: "valid", text: "Aa occurs in 50% of the enumerated outcomes.", citations: ["genetics.probability.Aa"] }]
  );
  if (report.status !== "verified") throw new Error("expected verified");
});

await check("nonexistent citation", () => {
  const report = verifyNarrative(result, { text: "Aa occurs in 50%.", citations: ["not.a.fact"] }, []);
  if (!report.missingCitationIds.includes("not.a.fact")) throw new Error("missing citation was not reported");
});

await check("uncited factual segment", () => {
  const report = verifyNarrative(result, { text: "Aa occurs in 50%.", citations: [] }, []);
  if (!report.uncitedFactualSegmentIds.includes("summary")) throw new Error("uncited fact was not reported");
});

await check("unsupported percentage", () => {
  const report = verifyNarrative(result, { text: "Aa occurs in 75%.", citations: ["genetics.probability.Aa"] }, []);
  if (!report.unsupportedNumericalClaims.includes("75%")) throw new Error("unsupported percentage was not reported");
});

await check("altered unit", () => {
  const withFrequency = structuredClone(result);
  withFrequency.facts.push({ id: "fixture.frequency", label: "Frequency", statement: "The reference frequency is 440 Hz.", value: "440 Hz" });
  const report = verifyNarrative(withFrequency, { text: "The reference frequency is 440 kHz.", citations: ["fixture.frequency"] }, []);
  if (!report.unsupportedNumericalClaims.includes("440khz")) throw new Error("altered unit was not reported");
});

await check("harmless pedagogical language", () => {
  const report = verifyNarrative(result, { text: "Draw the grid and describe the pattern in your own words.", citations: [] }, []);
  if (report.status !== "verified") throw new Error("harmless language should verify");
});

await check("malformed provider response", async () => {
  if (parseNarrativeDraft({ summary: "Incomplete" }) !== null) throw new Error("malformed draft parsed unexpectedly");
  const output = await generateNarrative(result, { level: "high-school", language: "en" }, { async generate() { return { summary: "Incomplete" }; } });
  if (output.verification.status !== "could_not_verify") throw new Error("malformed response was not marked unverified");
});

await check("unavailable provider fallback", async () => {
  const output = await generateNarrative(result, { level: "high-school", language: "en" }, null);
  if (output.provider !== "deterministic_fallback" || output.verification.status !== "verified") throw new Error("fallback was not safe and verified");
});

const network = {
  status: "skipped",
  reason: "Set OPENAI_EVAL=1 with OPENAI_API_KEY and OPENAI_MODEL to run the optional live structured-output check.",
};

if (process.env.OPENAI_EVAL === "1" && process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL) {
  const started = performance.now();
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 10_000, maxRetries: 0 });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL,
      store: false,
      max_output_tokens: 500,
      instructions: "Return JSON only. Explain only the supplied AXIOM result. Every factual sentence needs exact citations from the supplied IDs.",
      input: JSON.stringify({
        axiomResult: result,
        allowedCitationIds: [...result.facts.map((entry) => entry.id), ...result.steps.map((entry) => entry.id)],
      }),
      text: {
        format: {
          type: "json_schema",
          name: "axiom_eval",
          strict: true,
          schema: {
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
          },
        },
      },
    });
    const draft = parseNarrativeDraft(JSON.parse(response.output_text));
    if (!draft) throw new Error("response did not pass AXIOM narrative schema");
    const verification = verifyNarrative(result, { text: draft.summary, citations: draft.summaryCitations }, draft.explanationSegments);
    network.status = verification.status === "verified" ? "passed" : "failed";
    network.latencyMs = performance.now() - started;
    network.verification = verification;
  } catch (error) {
    network.status = "failed";
    network.latencyMs = performance.now() - started;
    network.error = error instanceof Error ? error.message : "unknown network evaluation error";
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  environment: environmentNotes(),
  summary: {
    caseCount: cases.length,
    passed: cases.length - failures.length,
    failed: failures.length,
  },
  adversarialFixtures: cases,
  failures,
  network,
  limitations: [
    "Adversarial fixtures exercise AXIOM's implemented citation and token checks; they cannot prove that every possible unsupported claim will be detected.",
    "Live OpenAI evaluation is opt-in because it uses credentials and a network request. It validates output schema and citations, not teaching quality.",
    "All offline fixtures are generated from AXIOM's own deterministic genetics engine; no external learner data is used.",
  ],
};

mkdirSync(REPORTS_DIR, { recursive: true });
writeFileSync(join(REPORTS_DIR, "EVALUATION_LATEST.json"), JSON.stringify(report, null, 2) + "\n");
writeFileSync(join(REPORTS_DIR, "EVALUATION_LATEST.md"), markdownReport("AXIOM verification evaluation", report));
console.log(JSON.stringify(report, null, 2));
if (failures.length || network.status === "failed") process.exit(1);

