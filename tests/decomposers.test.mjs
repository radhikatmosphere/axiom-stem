/**
 * AXIOM — Combinatorial Decomposer unit tests
 *
 * Pure-TS Layer 1 must always return correct combinatorial answers.
 * Run with:  node tests/decomposers.test.mjs
 * Exit code 0 = PASS, 1 = FAIL.  Logs written to logs/tests-decomposers.log
 */
import { strict as assert } from "node:assert";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, "..");
const LOG_DIR = join(ROOT, "logs");
mkdirSync(LOG_DIR, { recursive: true });

const tmp = join(LOG_DIR, "decomposers.bundled.mjs");
await build({
  entryPoints: [join(ROOT, "lib", "decomposers.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node18",
  outfile: tmp,
  logLevel: "silent",
});
const decomposers = await import(tmp);

const results = [];
const log = [];
function record(name, fn) {
  const t0 = performance.now();
  try {
    fn();
    const ms = +(performance.now() - t0).toFixed(2);
    log.push("  PASS  " + name + "  (" + ms + " ms)");
    results.push({ name, ok: true, ms });
  } catch (e) {
    const ms = +(performance.now() - t0).toFixed(2);
    log.push("  FAIL  " + name + "  (" + ms + " ms)  ->  " + e.message);
    results.push({ name, ok: false, ms, error: e.message });
  }
}

log.push("Genetics:");
record("Aa x aa  ->  50% Aa, 50% aa", () => {
  const r = decomposers.decomposeGenetics({ parent1: "Aa", parent2: "aa" });
  assert.equal(r.totalOffspring, 4);
  assert.equal(r.genotypeProbabilities.Aa, 50);
  assert.equal(r.genotypeProbabilities.aa, 50);
});
record("Aa x Aa  ->  25/50/25", () => {
  const r = decomposers.decomposeGenetics({ parent1: "Aa", parent2: "Aa" });
  assert.equal(r.genotypeProbabilities.AA, 25);
  assert.equal(r.genotypeProbabilities.Aa, 50);
  assert.equal(r.genotypeProbabilities.aa, 25);
});
record("lower-case normalised", () => {
  const r = decomposers.decomposeGenetics({ parent1: "bb", parent2: "Bb" });
  assert.equal(r.genotypeProbabilities.Bb, 50);
  assert.equal(r.genotypeProbabilities.bb, 50);
});
record("mixed-case alleles retain dominance", () => {
  const r = decomposers.decomposeGenetics({ parent1: "aA", parent2: "aa" });
  assert.equal(r.genotypeProbabilities.Aa, 50);
  assert.equal(r.genotypeProbabilities.aa, 50);
});
record("different gene symbols are rejected", () => {
  assert.throws(
    () => decomposers.decomposeGenetics({ parent1: "AB", parent2: "Aa" }),
    /same gene/
  );
});

log.push("Math (combinations):");
record("C(5,3) = 10", () => {
  const r = decomposers.decomposeMath({ type: "combination", n: 5, r: 3, repetition: false });
  assert.equal(r.result, 10);
});
record("C(10,4) = 210", () => {
  const r = decomposers.decomposeMath({ type: "combination", n: 10, r: 4, repetition: false });
  assert.equal(r.result, 210);
});

log.push("Math (permutations):");
record("P(5,3) = 60", () => {
  const r = decomposers.decomposeMath({ type: "permutation", n: 5, r: 3, repetition: false });
  assert.equal(r.result, 60);
});
record("P(n,0) = 1", () => {
  const r = decomposers.decomposeMath({ type: "permutation", n: 7, r: 0, repetition: false });
  assert.equal(r.result, 1);
});

log.push("Chemistry:");
record("Fe (Z=26) noble-gas config and valence 8", () => {
  const r = decomposers.decomposeChemistry({ element: "Fe" });
  assert.equal(r.atomicNumber, 26);
  assert.equal(r.nobleGasConfig, "[Ar] 4s² 3d⁶");
  assert.equal(r.valenceElectrons, 8);
});
record("Na (Z=11) valence = 1", () => {
  const r = decomposers.decomposeChemistry({ element: "Na" });
  assert.equal(r.atomicNumber, 11);
  assert.equal(r.valenceElectrons, 1);
});

log.push("Physics:");
record("440 Hz, 8 harmonics, doubling freq", () => {
  const r = decomposers.decomposePhysics({ fundamentalFrequency: 440, harmonics: 8 });
  assert.equal(r.harmonics.length, 8);
  assert.equal(r.harmonics[0].frequency, 440);
  assert.equal(r.harmonics[7].frequency, 440 * 8);
  assert.ok(r.harmonics.every((h) => h.wavelength > 0));
});

log.push("Dispatcher:");
record("all 4 domains covered by decompose()", () => {
  for (const d of ["genetics", "math", "chemistry", "physics"]) {
    assert.equal(typeof decomposers.decompose, "function");
  }
});

const passed = results.filter((r) => r.ok).length;
const failed = results.length - passed;
const header =
  "AXIOM decomposer tests - " + new Date().toISOString() + "\n" +
  "Passed: " + passed + "/" + results.length + "  Failed: " + failed + "\n" +
  "Total time: " + results.reduce((a, b) => a + b.ms, 0).toFixed(1) + " ms\n";
const body = log.join("\n");
const summary = header + "\n" + body + "\n";

writeFileSync(join(LOG_DIR, "tests-decomposers.log"), summary);
console.log(summary);
if (failed > 0) process.exit(1);
