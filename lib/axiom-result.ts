import { decomposeGenetics, decomposeMath } from "@/lib/decomposers";
import type {
  AxiomInput,
  AxiomResult,
  CombinatoricsDisplay,
  GeneticsDisplay,
} from "@/types";

export const AXIOM_ENGINE_VERSION = "1.0.0";

function fact(
  id: string,
  label: string,
  statement: string,
  value: string | number | boolean | string[] | Record<string, number>
) {
  return { id, label, statement, value };
}

export function computeAxiom(input: AxiomInput): AxiomResult {
  if (input.domain === "genetics") {
    const result = decomposeGenetics(input.data);
    const display: GeneticsDisplay = {
      kind: "punnett",
      parent1: result.parent1,
      parent2: result.parent2,
      gametes1: result.gametes1,
      gametes2: result.gametes2,
      grid: result.punnettGrid,
      probabilities: result.genotypeProbabilities,
    };
    const probabilityFacts = Object.entries(result.genotypeProbabilities)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([genotype, percentage]) =>
        fact(
          `genetics.probability.${genotype}`,
          `${genotype} probability`,
          `${genotype} occurs in ${percentage}% of the ${result.totalOffspring} enumerated Punnett-square outcomes.`,
          percentage
        )
      );

    return {
      domain: "genetics",
      normalizedInput: { parent1: result.parent1, parent2: result.parent2 },
      facts: [
        fact("genetics.parents", "Parent genotypes", `The modeled cross is ${result.parent1} × ${result.parent2}.`, `${result.parent1} × ${result.parent2}`),
        fact("genetics.gametes.parent1", "Parent 1 gametes", `Parent 1 contributes the allele slots ${result.gametes1.join(", ")}.`, result.gametes1),
        fact("genetics.gametes.parent2", "Parent 2 gametes", `Parent 2 contributes the allele slots ${result.gametes2.join(", ")}.`, result.gametes2),
        fact("genetics.grid", "Punnett grid", `The deterministic Punnett grid contains ${result.totalOffspring} equally weighted allele-pair outcomes.`, result.totalOffspring),
        ...probabilityFacts,
      ],
      derivations: [{
        id: "genetics.enumerate-punnett-grid",
        rule: "Cartesian product of the two parent allele slots",
        inputFactIds: ["genetics.gametes.parent1", "genetics.gametes.parent2"],
        outputFactIds: ["genetics.grid", ...probabilityFacts.map((entry) => entry.id)],
        explanation: "Pair each of Parent 1's two allele slots with each of Parent 2's two allele slots, then count the resulting genotypes.",
      }],
      steps: [
        { id: "genetics.step.list-gametes", label: "List each parent's allele slots", detail: `${result.parent1} gives ${result.gametes1.join(", ")}; ${result.parent2} gives ${result.gametes2.join(", ")}.`, factIds: ["genetics.gametes.parent1", "genetics.gametes.parent2"] },
        { id: "genetics.step.enumerate", label: "Enumerate the Punnett grid", detail: `Combine each row allele with each column allele to make ${result.totalOffspring} outcomes.`, factIds: ["genetics.grid"] },
        { id: "genetics.step.count", label: "Count each genotype", detail: "Convert each genotype count over the full grid into a percentage.", factIds: probabilityFacts.map((entry) => entry.id) },
      ],
      warnings: ["This is a single-gene Mendelian model with equally weighted allele slots; real inheritance can involve additional biological factors."],
      confidence: { level: "high", rationale: "Every allele pairing is enumerated directly from the supplied two-letter genotypes." },
      engineVersion: AXIOM_ENGINE_VERSION,
      display,
    };
  }

  const result = decomposeMath(input.data);
  const display: CombinatoricsDisplay = {
    kind: "combinatorics",
    type: result.type,
    formula: result.formula,
    result: result.result,
    sampleOutcomes: result.smallExample?.outcomes,
  };
  const mode = result.type === "combination" ? "order does not matter" : "order matters";

  return {
    domain: "combinatorics",
    normalizedInput: { type: result.type, n: result.n, r: result.r, repetition: result.repetition },
    facts: [
      fact("combinatorics.input", "Counting request", `Count ${result.type}s of ${result.r} selections from ${result.n} items; ${mode}.`, { n: result.n, r: result.r }),
      fact("combinatorics.formula", "Formula", `The engine applies ${result.formula}.`, result.formula),
      fact("combinatorics.result", "Exact result", `The exact number of outcomes is ${result.result}.`, result.result),
    ],
    derivations: [{
      id: "combinatorics.factorial-derivation",
      rule: result.type === "combination" ? "Binomial coefficient" : "Falling factorial",
      inputFactIds: ["combinatorics.input", "combinatorics.formula"],
      outputFactIds: ["combinatorics.result"],
      explanation: "Apply the selected counting rule to the normalized integer inputs.",
    }],
    steps: result.steps.map((detail, index) => ({
      id: `combinatorics.step.${index + 1}`,
      label: `Calculation step ${index + 1}`,
      detail,
      factIds: index === result.steps.length - 1 ? ["combinatorics.result"] : ["combinatorics.formula"],
    })),
    warnings: ["The result counts abstract outcomes. It does not estimate likelihoods unless an additional probability model is supplied."],
    confidence: { level: "high", rationale: "The calculation uses integer factorial arithmetic with validated non-negative integer inputs." },
    engineVersion: AXIOM_ENGINE_VERSION,
    display,
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function asFiniteInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && Number.isInteger(value) ? value : null;
}

/** Parse only the small, public input surface accepted by the narrative API. */
export function parseAxiomInput(domain: unknown, value: unknown): AxiomInput | null {
  const input = asRecord(value);
  if (!input) return null;
  if (domain === "genetics" && typeof input.parent1 === "string" && typeof input.parent2 === "string") {
    if (input.parent1.length > 24 || input.parent2.length > 24) return null;
    return { domain, data: { parent1: input.parent1, parent2: input.parent2 } };
  }
  if (domain === "combinatorics" && (input.type === "combination" || input.type === "permutation")) {
    const n = asFiniteInteger(input.n);
    const r = asFiniteInteger(input.r);
    if (n !== null && r !== null && typeof input.repetition === "boolean" &&
      n >= 0 && n <= 170 && r >= 0 && r <= 170) {
      return { domain, data: { type: input.type, n, r, repetition: input.repetition } };
    }
  }
  return null;
}

