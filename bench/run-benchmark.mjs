import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  REPORTS_DIR,
  bundleModule,
  environmentNotes,
  markdownReport,
  percentile,
} from "./utils.mjs";

const { decomposeGenetics, decomposeMath } = await bundleModule("benchmark-decomposers", "lib/decomposers.ts");
const cases = [];
const failures = [];

function check(name, fn) {
  try {
    fn();
    cases.push({ name, ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    cases.push({ name, ok: false, error: message });
    failures.push({ name, error: message });
  }
}

function choose(n, r) {
  if (r > n) return 0n;
  const k = Math.min(r, n - r);
  let value = 1n;
  for (let i = 1; i <= k; i += 1) value = (value * BigInt(n - k + i)) / BigInt(i);
  return value;
}

function fallingFactorial(n, r) {
  let value = 1n;
  for (let i = 0; i < r; i += 1) value *= BigInt(n - i);
  return value;
}

for (const gene of ["A", "B", "C"]) {
  const forms = [gene + gene, gene + gene.toLowerCase(), gene.toLowerCase() + gene.toLowerCase()];
  for (const parent1 of forms) {
    for (const parent2 of forms) {
      check("genetics " + parent1 + " x " + parent2, () => {
        const output = decomposeGenetics({ parent1, parent2 });
        const cells = output.punnettGrid.flat();
        if (cells.length !== 4 || output.totalOffspring !== 4) throw new Error("expected four enumerated outcomes");
        if (Object.values(output.genotypeCounts).reduce((sum, count) => sum + count, 0) !== 4) throw new Error("counts do not sum to four");
        if (Object.values(output.genotypeProbabilities).reduce((sum, value) => sum + value, 0) !== 100) throw new Error("probabilities do not sum to 100");
        for (const [genotype, count] of Object.entries(output.genotypeCounts)) {
          if (cells.filter((cell) => cell === genotype).length !== count) throw new Error("grid count mismatch for " + genotype);
        }
      });
    }
  }
}

for (let n = 0; n <= 12; n += 1) {
  for (let r = 0; r <= n; r += 1) {
    for (const type of ["combination", "permutation"]) {
      check(type + "(" + n + "," + r + ")", () => {
        const output = decomposeMath({ type, n, r, repetition: false });
        const expected = type === "combination" ? choose(n, r) : fallingFactorial(n, r);
        if (BigInt(output.result) !== expected) throw new Error("expected " + expected + ", received " + output.result);
      });
    }
  }
}

for (let n = 1; n <= 10; n += 1) {
  for (let r = 0; r <= 8; r += 1) {
    for (const type of ["combination", "permutation"]) {
      check(type + " repetition(" + n + "," + r + ")", () => {
        const output = decomposeMath({ type, n, r, repetition: true });
        const expected = type === "combination" ? choose(n + r - 1, r) : BigInt(n) ** BigInt(r);
        if (BigInt(output.result) !== expected) throw new Error("expected " + expected + ", received " + output.result);
      });
    }
  }
}

const latencyMs = [];
for (let index = 0; index < 500; index += 1) {
  const started = performance.now();
  if (index % 2 === 0) {
    decomposeGenetics({ parent1: "Aa", parent2: "aa" });
  } else {
    decomposeMath({ type: "combination", n: 12, r: 6, repetition: false });
  }
  latencyMs.push(performance.now() - started);
}

const report = {
  generatedAt: new Date().toISOString(),
  environment: environmentNotes(),
  summary: {
    caseCount: cases.length,
    passed: cases.length - failures.length,
    failed: failures.length,
  },
  deterministicLatencyMs: {
    samples: latencyMs.length,
    min: Math.min(...latencyMs),
    p50: percentile(latencyMs, 0.5),
    p95: percentile(latencyMs, 0.95),
    max: Math.max(...latencyMs),
  },
  failures,
  network: {
    status: "not measured",
    reason: "Deterministic benchmarks are intentionally network-free. Optional OpenAI evaluation is handled by npm run eval.",
  },
  limitations: [
    "Genetics checks cover the single-gene, two-allele model implemented by AXIOM; they are not a biological validation of more complex inheritance.",
    "Combinatorics reference calculations use independent BigInt arithmetic only within safe output ranges.",
    "Latency is local process timing and excludes browser rendering, cold starts, and OpenAI network time.",
  ],
};

mkdirSync(REPORTS_DIR, { recursive: true });
writeFileSync(join(REPORTS_DIR, "BENCHMARK_LATEST.json"), JSON.stringify(report, null, 2) + "\n");
writeFileSync(join(REPORTS_DIR, "BENCHMARK_LATEST.md"), markdownReport("AXIOM deterministic benchmark", report));
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exit(1);

