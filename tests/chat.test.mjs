/**
 * AXIOM — Web chat adapter + question parser tests (network-free).
 *
 * Run with:  node tests/chat.test.mjs   (also part of `npm test`)
 */
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

const [axiomResult, narrativeService, foundryAdapter, chatQuestion] = await Promise.all([
  bundle("axiom-result", "lib/axiom-result.ts"),
  bundle("narrative-service", "lib/narrative-service.ts"),
  bundle("foundry-adapter", "lib/foundry-adapter.ts"),
  bundle("chat-question", "lib/chat-question.ts"),
]);

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

console.log("AXIOM web chat tests:");

await record("genetics question is parsed from free text", () => {
  const parsed = chatQuestion.parseChatQuestion("For a cross Aa × aa, calculate the distribution.");
  assert.ok(parsed);
  assert.equal(parsed.domain ?? parsed.input.domain, "genetics");
  assert.deepEqual(parsed.input.data, { parent1: "Aa", parent2: "aa" });
});

await record("lowercase x variant is accepted", () => {
  const parsed = chatQuestion.parseChatQuestion("aa x Aa");
  assert.ok(parsed);
  assert.deepEqual(parsed.input.data, { parent1: "aa", parent2: "Aa" });
});

await record("combinatorics question is parsed from free text", () => {
  const parsed = chatQuestion.parseChatQuestion("How many ways are there for C(10,3)?");
  assert.ok(parsed);
  assert.equal(parsed.input.data.n, 10);
  assert.equal(parsed.input.data.r, 3);
  assert.equal(parsed.input.data.type, "combination");
});

await record("ambiguous question is rejected (no invented answer)", () => {
  assert.equal(chatQuestion.parseChatQuestion("What is the meaning of life?"), null);
  assert.equal(chatQuestion.parseChatQuestion("Cross two plants"), null);
});

await record("chat adapter preserves deterministic values and citations", async () => {
  const result = axiomResult.computeAxiom({
    domain: "genetics",
    data: { parent1: "Aa", parent2: "aa" },
  });
  const narrative = narrativeService.deterministicFallback(result, {
    level: "high-school",
    language: "en",
  });
  const chat = foundryAdapter.axiomToChat(result, narrative);
  assert.equal(chat.headline, "Aa × aa");
  assert.equal(chat.display.kind, "punnett");
  assert.equal(chat.display.probabilities.Aa, 50);
  assert.equal(chat.display.probabilities.aa, 50);
  assert.equal(chat.verification.status, "verified");
  assert.ok(chat.evidence.some((entry) => entry.id === "genetics.probability.Aa"));
  assert.equal(chat.provider, "deterministic_fallback");
});

await record("chat adapter exposes honest unsupported-claims array", async () => {
  const result = axiomResult.computeAxiom({
    domain: "combinatorics",
    data: { type: "combination", n: 5, r: 3, repetition: false },
  });
  const narrative = narrativeService.deterministicFallback(result, {
    level: "high-school",
    language: "en",
  });
  const chat = foundryAdapter.axiomToChat(result, narrative);
  assert.equal(chat.verification.unsupportedClaims.length, 0);
  assert.equal(chat.verification.supportedClaims > 0, true);
});

const failed = cases.filter((entry) => !entry.ok);
console.log(`\nPassed: ${cases.length - failed.length}/${cases.length}  Failed: ${failed.length}`);
if (failed.length) process.exit(1);
