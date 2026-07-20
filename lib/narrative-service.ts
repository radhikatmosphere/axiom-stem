import { verifyNarrative } from "@/lib/claim-verifier";
import type {
  AxiomResult,
  NarrativeResult,
  NarrativeSegment,
  VerificationReport,
} from "@/types";

export type LearnerProfile = {
  level: "middle-school" | "high-school" | "intro-college";
  language: "en" | "es";
};

export interface NarrativeProvider {
  generate(result: AxiomResult, learner: LearnerProfile): Promise<unknown>;
}

type NarrativeDraft = {
  summary: string;
  summaryCitations: string[];
  explanationSegments: NarrativeSegment[];
  followUpQuestions: string[];
};

function isStringArray(value: unknown, max: number): value is string[] {
  return Array.isArray(value) && value.length <= max && value.every((entry) => typeof entry === "string" && entry.length <= 180);
}

export function parseNarrativeDraft(value: unknown): NarrativeDraft | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const draft = value as Record<string, unknown>;
  if (typeof draft.summary !== "string" || draft.summary.length === 0 || draft.summary.length > 600) return null;
  if (!isStringArray(draft.summaryCitations, 8) || !isStringArray(draft.followUpQuestions, 3)) return null;
  if (!Array.isArray(draft.explanationSegments) || draft.explanationSegments.length < 1 || draft.explanationSegments.length > 5) return null;

  const segments: NarrativeSegment[] = [];
  for (const entry of draft.explanationSegments) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
    const segment = entry as Record<string, unknown>;
    if (
      typeof segment.id !== "string" || segment.id.length === 0 || segment.id.length > 80 ||
      typeof segment.text !== "string" || segment.text.length === 0 || segment.text.length > 900 ||
      !isStringArray(segment.citations, 8)
    ) return null;
    segments.push({ id: segment.id, text: segment.text, citations: segment.citations });
  }
  return {
    summary: draft.summary,
    summaryCitations: draft.summaryCitations,
    explanationSegments: segments,
    followUpQuestions: draft.followUpQuestions,
  };
}

function fallbackContent(result: AxiomResult, learner: LearnerProfile): Omit<NarrativeResult, "verification" | "unsupportedClaims" | "provider" | "fallbackReason"> {
  const spanish = learner.language === "es";

  if (result.domain === "genetics") {
    const display = result.display;
    if (display.kind !== "punnett") throw new Error("Invalid genetics display");
    const probabilityFacts = result.facts.filter((entry) => entry.id.startsWith("genetics.probability."));
    const probabilitySentence = probabilityFacts.map((entry) => entry.statement.replace(" of the 4 enumerated Punnett-square outcomes.", "")).join(" ");
    return {
      summary: spanish
        ? `El modelo determinista enumera el cruce ${display.parent1} × ${display.parent2} en una cuadrícula de Punnett.`
        : `The deterministic model enumerates the ${display.parent1} × ${display.parent2} cross in a Punnett grid.`,
      summaryCitations: ["genetics.parents", "genetics.grid"],
      explanationSegments: [
        {
          id: "fallback.gametes",
          text: spanish
            ? `Primero se listan las dos posiciones de alelos de cada progenitor: ${display.gametes1.join(", ")} y ${display.gametes2.join(", ")}.`
            : `First, list each parent's two allele slots: ${display.gametes1.join(", ")} and ${display.gametes2.join(", ")}.`,
          citations: ["genetics.gametes.parent1", "genetics.gametes.parent2"],
        },
        {
          id: "fallback.enumeration",
          text: spanish
            ? `La cuadrícula combina esas posiciones en ${display.grid.length * display.grid[0].length} resultados igualmente ponderados.`
            : `The grid combines those slots into ${display.grid.length * display.grid[0].length} equally weighted outcomes.`,
          citations: ["genetics.grid", "genetics.step.enumerate"],
        },
        {
          id: "fallback.probabilities",
          text: spanish
            ? probabilitySentence.replaceAll("occurs in", "aparece en").replaceAll("enumerated Punnett-square outcomes", "resultados enumerados")
            : probabilitySentence,
          citations: probabilityFacts.map((entry) => entry.id),
        },
      ],
      followUpQuestions: [spanish ? "¿Qué cambia si ambos progenitores son Aa?" : "What changes if both parents are Aa?"],
    };
  }

  const display = result.display;
  if (display.kind !== "combinatorics") throw new Error("Invalid combinatorics display");
  return {
      summary: spanish
        ? `El motor aplica una regla de conteo exacta y obtiene ${display.result}.`
        : `The engine applies an exact counting rule and gets ${display.result}.`,
      summaryCitations: ["combinatorics.formula", "combinatorics.result"],
    explanationSegments: [
      {
        id: "fallback.request",
        text: spanish
          ? `La entrada especifica ${result.normalizedInput.r} selecciones de ${result.normalizedInput.n} elementos.`
          : `The input specifies ${result.normalizedInput.r} selections from ${result.normalizedInput.n} items.`,
        citations: ["combinatorics.input"],
      },
      {
        id: "fallback.calculation",
        text: spanish
          ? `La fórmula ${display.formula} produce exactamente ${display.result}.`
          : `The formula ${display.formula} produces exactly ${display.result}.`,
        citations: ["combinatorics.formula", "combinatorics.result"],
      },
    ],
    followUpQuestions: [spanish ? "¿Importaría el orden para este problema?" : "Would changing the order matter for this problem?"],
  };
}

function fallbackResult(
  result: AxiomResult,
  learner: LearnerProfile,
  reason: NonNullable<NarrativeResult["fallbackReason"]>,
  malformedOutput = false
): NarrativeResult {
  const content = fallbackContent(result, learner);
  const additionalWarnings = malformedOutput
    ? ["The model response did not match AXIOM's narrative schema; a deterministic fallback is shown."]
    : [];
  const verification = verifyNarrative(
    result,
    { text: content.summary, citations: content.summaryCitations },
    content.explanationSegments,
    { malformedOutput, additionalWarnings }
  );
  return {
    ...content,
    unsupportedClaims: verification.unsupportedNumericalClaims,
    verification,
    provider: "deterministic_fallback",
    fallbackReason: reason,
  };
}

export async function generateNarrative(
  result: AxiomResult,
  learner: LearnerProfile,
  provider: NarrativeProvider | null,
  secondary: NarrativeProvider | null = null
): Promise<NarrativeResult> {
  if (!provider && !secondary) return fallbackResult(result, learner, "missing_configuration");

  // Try the primary first, then the secondary, mirroring the layered model in
  // the architecture doc. Either one returning invalid output triggers a
  // deterministic fallback rather than a retry on the other provider.
  for (const candidate of [provider, secondary]) {
    if (!candidate) continue;
    try {
      const raw = await candidate.generate(result, learner);
      const draft = parseNarrativeDraft(raw);
      if (!draft) return fallbackResult(result, learner, "invalid_model_output", true);

      const verification: VerificationReport = verifyNarrative(
        result,
        { text: draft.summary, citations: draft.summaryCitations },
        draft.explanationSegments
      );
      return {
        ...draft,
        unsupportedClaims: verification.unsupportedNumericalClaims,
        verification,
        provider: "openai",
      };
    } catch {
      // Try the next provider; if none remain, fall back below.
    }
  }
  return fallbackResult(result, learner, "provider_unavailable");
}

export function deterministicFallback(
  result: AxiomResult,
  learner: LearnerProfile
): NarrativeResult {
  return fallbackResult(result, learner, "missing_configuration");
}

