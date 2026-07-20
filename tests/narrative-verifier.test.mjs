import { strict as assert } from "node:assert";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, "..");
const LOG_DIR = join(ROOT, "logs");
mkdirSync(LOG_DIR, { recursive: true });

async function bundle(name, entry) {
  const outfile = join(LOG_DIR, `${name}.bundled.mjs`);
  await build({
    entryPoints: [join(ROOT, entry)],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node18",
    outfile,
    logLevel: "silent",
  });
  return import(outfile + `?v=${Date.now()}-${name}`);
}

const [{ computeAxiom }, { verifyNarrative }, { generateNarrative, parseNarrativeDraft }] = await Promise.all([
  bundle("axiom-result", "lib/axiom-result.ts"),
  bundle("claim-verifier", "lib/claim-verifier.ts"),
  bundle("narrative-service", "lib/narrative-service.ts"),
]);

const result = computeAxiom({
  domain: "genetics",
  data: { parent1: "Aa", parent2: "aa" },
});

const cases = [];
async function record(name, fn) {
  try {
    await fn();
    cases.push({ name, ok: true });
    console.log(`  PASS  ${name}`);
  } catch (error) {
    cases.push({ name, ok: false, error: error instanceof Error ? error.message : String(error) });
    console.log(`  FAIL  ${name} -> ${cases.at(-1).error}`);
  }
}

console.log("AXIOM narrative verifier tests:");

await record("valid cited explanation is verified", () => {
  const report = verifyNarrative(
    result,
    { text: "The Aa × aa cross is enumerated in a Punnett grid.", citations: ["genetics.parents", "genetics.grid"] },
    [{ id: "p", text: "Aa occurs in 50% of the enumerated outcomes.", citations: ["genetics.probability.Aa"] }]
  );
  assert.equal(report.status, "verified");
});

await record("nonexistent citation is flagged", () => {
  const report = verifyNarrative(
    result,
    { text: "Aa occurs in 50%.", citations: ["genetics.not-real"] },
    []
  );
  assert.deepEqual(report.missingCitationIds, ["genetics.not-real"]);
  assert.equal(report.status, "warnings");
});

await record("uncited factual explanation is flagged", () => {
  const report = verifyNarrative(
    result,
    { text: "Aa occurs in 50%.", citations: [] },
    []
  );
  assert.deepEqual(report.uncitedFactualSegmentIds, ["summary"]);
  assert.equal(report.status, "warnings");
});

await record("unsupported percentage is flagged", () => {
  const report = verifyNarrative(
    result,
    { text: "Aa occurs in 75%.", citations: ["genetics.probability.Aa"] },
    []
  );
  assert.ok(report.unsupportedNumericalClaims.includes("75%"));
});

await record("altered frequency unit is flagged", () => {
  const withFrequency = structuredClone(result);
  withFrequency.facts.push({
    id: "test.frequency",
    label: "Reference frequency",
    statement: "The reference frequency is 440 Hz.",
    value: "440 Hz",
  });
  const report = verifyNarrative(
    withFrequency,
    { text: "The reference frequency is 440 kHz.", citations: ["test.frequency"] },
    []
  );
  assert.ok(report.unsupportedNumericalClaims.includes("440khz"));
});

await record("harmless pedagogical language needs no citation", () => {
  const report = verifyNarrative(
    result,
    { text: "Try drawing the grid and describing the pattern in your own words.", citations: [] },
    []
  );
  assert.equal(report.status, "verified");
});

await record("malformed model output becomes an unverified deterministic fallback", async () => {
  assert.equal(parseNarrativeDraft({ summary: "Missing required fields" }), null);
  const output = await generateNarrative(result, { level: "high-school", language: "en" }, {
    async generate() {
      return { summary: "Missing required fields" };
    },
  });
  assert.equal(output.provider, "deterministic_fallback");
  assert.equal(output.fallbackReason, "invalid_model_output");
  assert.equal(output.verification.status, "could_not_verify");
});

await record("unavailable OpenAI provider returns a safe deterministic fallback", async () => {
  const output = await generateNarrative(result, { level: "middle-school", language: "en" }, null);
  assert.equal(output.provider, "deterministic_fallback");
  assert.equal(output.fallbackReason, "missing_configuration");
  assert.equal(output.verification.status, "verified");
});

const failed = cases.filter((entry) => !entry.ok);
console.log(`\nPassed: ${cases.length - failed.length}/${cases.length}  Failed: ${failed.length}`);
if (failed.length) process.exit(1);

