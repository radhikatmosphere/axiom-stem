/**
 * AXIOM — chat-router + off-topic-memory + telemetry tests (network-free).
 *
 * Run with:  node tests/chat-router.test.mjs   (also part of `npm test`)
 */
import { strict as assert } from "node:assert";
import { mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, "..");
const LOG_DIR = join(ROOT, "logs");
mkdirSync(LOG_DIR, { recursive: true });

const SERVER_ONLY_STUB = join(LOG_DIR, "server-only-stub.mjs");
writeFileSync(SERVER_ONLY_STUB, "export default {};\n", "utf8");

// esbuild alias maps "@/" bare-import to the repo root so chat-router resolves
// its "@/lib/..." dependency from disk.
const rootAlias = {};
rootAlias["@"] = ROOT;
rootAlias["server-only"] = SERVER_ONLY_STUB;

async function bundle(name, entry, external = []) {
  const outfile = join(LOG_DIR, `${name}.bundled.mjs`);
  await build({
    entryPoints: [join(ROOT, entry)],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node18",
    outfile,
    logLevel: "silent",
    external,
    alias: rootAlias,
  });
  return import(outfile + `?v=${Date.now()}-${name}`);
}

const [
  axiomResult,
  chatRouter,
  offTopic,
  telemetry,
] = await Promise.all([
  bundle("axiom-result", "lib/axiom-result.ts"),
  bundle("chat-router", "lib/chat-router.ts"),
  bundle("off-topic-memory", "lib/off-topic-memory.ts"),
  bundle("telemetry", "lib/telemetry.ts"),
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

function makeGeneticsResult() {
  return axiomResult.computeAxiom({
    domain: "genetics",
    data: { parent1: "Aa", parent2: "aa" },
  });
}

console.log("AXIOM chat-router + guardrail tests:");

await record("deterministic Aa × aa wins over everything", () => {
  const d = chatRouter.classifyChat({
    question: "Aa × aa",
    sessionId: "s1",
    lastResult: null,
    warningSent: false,
  });
  assert.equal(d.route, "deterministic");
  assert.equal(d.parsedDeterministic.label, "Genetics");
});

await record("C(10,3) parses as deterministic", () => {
  const d = chatRouter.classifyChat({
    question: "How many ways for C(10,3)?",
    sessionId: "s1",
    lastResult: null,
    warningSent: false,
  });
  assert.equal(d.route, "deterministic");
  assert.equal(d.parsedDeterministic.label, "Combinatorics");
});

await record("why is Aa dominant? is an educational follow-up only after a deterministic result", () => {
  const result = makeGeneticsResult();
  const d = chatRouter.classifyChat({
    question: "why is Aa the dominant allele here?",
    sessionId: "s1",
    lastResult: result,
    warningSent: false,
  });
  assert.equal(d.route, "educational_followup");
  assert.equal(d.matchedDomain, "genetics");
});

await record("why is Aa dominant? without a prior result is off-topic-warning", () => {
  const d = chatRouter.classifyChat({
    question: "why is Aa dominant?",
    sessionId: "s2",
    lastResult: null,
    warningSent: false,
  });
  assert.equal(d.route, "off_topic_warning");
});

await record("what's the weather is off-topic-warning first, silent second", () => {
  const r1 = chatRouter.classifyChat({
    question: "what's the weather in Lisbon?",
    sessionId: "s3",
    lastResult: null,
    warningSent: false,
  });
  assert.equal(r1.route, "off_topic_warning");
  const r2 = chatRouter.classifyChat({
    question: "and tomorrow?",
    sessionId: "s3",
    lastResult: null,
    warningSent: true,
  });
  assert.equal(r2.route, "off_topic_silent");
});

await record("medical request is refused even with a stem-looking token", () => {
  const r = chatRouter.classifyChat({
    question: "diagnose my Aa symptoms",
    sessionId: "s4",
    lastResult: null,
    warningSent: false,
  });
  assert.equal(r.route, "off_topic_warning");
});

await record("financial trading request is refused", () => {
  const r = chatRouter.classifyChat({
    question: "best crypto trading strategy?",
    sessionId: "s5",
    lastResult: null,
    warningSent: false,
  });
  assert.equal(r.route, "off_topic_warning");
});

await record("empty body is invalid_input", () => {
  const r = chatRouter.classifyChat({
    question: "",
    sessionId: "s6",
    lastResult: null,
    warningSent: false,
  });
  assert.equal(r.route, "invalid_input");
});

await record("over-200-char body is invalid_input", () => {
  const r = chatRouter.classifyChat({
    question: "x".repeat(201),
    sessionId: "s6",
    lastResult: null,
    warningSent: false,
  });
  assert.equal(r.route, "invalid_input");
});

await record("on-topic deterministic question resets warned state", () => {
  offTopic._resetAllForTests();
  offTopic.markWarning("s7");
  assert.equal(offTopic.hasWarning("s7"), true);
  // A deterministic question arrives — the route layer should call resetSession.
  offTopic.resetSession("s7");
  assert.equal(offTopic.hasWarning("s7"), false);
});

await record("audit JSONL appends one line per call and hashes message by default", () => {
  telemetry._resetRingForTests();
  const tracePath = join(LOG_DIR, "chat-trace.jsonl");
  try { rmSync(tracePath); } catch {}
  telemetry.appendAudit("Aa × aa", "s8", "deterministic", { reason: "matched" }, { provider: "openai" });
  telemetry.appendAudit("what color is the sky", "s8", "off_topic_warning", { reason: "no stem" });
  assert.ok(existsSync(tracePath));
  const lines = readFileSync(tracePath, "utf8").trim().split("\n");
  assert.equal(lines.length, 2);
  const first = JSON.parse(lines[0]);
  assert.equal(first.decision, "deterministic");
  assert.equal(first.questionLength, "Aa × aa".length);
  // Default mode hashes — questionFingerprint must not equal the raw message.
  assert.notEqual(first.questionFingerprint, "Aa × aa");
  // recentAudit returns both, newest last.
  const recent = telemetry.recentAudit(10);
  assert.equal(recent.length, 2);
  assert.equal(recent[1].decision, "off_topic_warning");
});

const failed = cases.filter((entry) => !entry.ok);
console.log(`\nPassed: ${cases.length - failed.length}/${cases.length}  Failed: ${failed.length}`);
if (failed.length) process.exit(1);
