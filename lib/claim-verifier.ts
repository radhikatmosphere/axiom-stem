import type { AxiomResult, NarrativeSegment, VerificationReport } from "@/types";

function normalizeToken(value: string): string {
  return value.replace(/\s+/g, "").replace(/×/g, "x").toLowerCase();
}

function collectStrings(value: unknown, output: string[]): void {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    output.push(String(value));
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry) => collectStrings(entry, output));
    return;
  }
  if (value && typeof value === "object") {
    Object.values(value).forEach((entry) => collectStrings(entry, output));
  }
}

function numericalTokens(text: string): string[] {
  const matches = text.match(
    /(?:[CP]\(\s*\d+\s*,\s*\d+\s*\))|(?:\b\d+(?:\.\d+)?\s*%(?!\w))|(?:\b\d+(?:\.\d+)?\s*(?:kHz|Hz|m\/s|m|outcomes?|ways?)\b)|(?:\b\d+(?:\.\d+)?\b)/g
  ) ?? [];
  return matches.map(normalizeToken);
}

function supportedNumericalTokens(result: AxiomResult): Set<string> {
  const source: string[] = [];
  result.facts.forEach((entry) => {
    source.push(entry.statement);
    collectStrings(entry.value, source);
  });
  result.steps.forEach((step) => source.push(step.detail));
  result.derivations.forEach((derivation) => source.push(derivation.explanation));
  return new Set(source.flatMap(numericalTokens));
}

function hasFactualSignal(text: string): boolean {
  return numericalTokens(text).length > 0 ||
    /\b(genotype|gamete|allele|punnett|probability|outcome|combination|permutation|formula|result|equals|exact|cross)\b/i.test(text);
}

function reportSegments(summary: NarrativeSegment, segments: NarrativeSegment[]): NarrativeSegment[] {
  return [summary, ...segments];
}

/**
 * Checks citation ids and practical numeric/formula claims. It intentionally
 * treats non-numeric teaching language as harmless unless it asserts a fact.
 */
export function verifyNarrative(
  result: AxiomResult,
  summary: { text: string; citations: string[] },
  segments: NarrativeSegment[],
  options: { malformedOutput?: boolean; additionalWarnings?: string[] } = {}
): VerificationReport {
  const knownIds = new Set([
    ...result.facts.map((entry) => entry.id),
    ...result.steps.map((entry) => entry.id),
  ]);
  const allowedNumbers = supportedNumericalTokens(result);
  const missingCitationIds = new Set<string>();
  const citedIds = new Set<string>();
  const uncitedFactualSegmentIds: string[] = [];
  const unsupportedNumericalClaims = new Set<string>();

  for (const segment of reportSegments({ id: "summary", ...summary }, segments)) {
    const citations = Array.isArray(segment.citations) ? segment.citations : [];
    for (const citation of citations) {
      if (knownIds.has(citation)) citedIds.add(citation);
      else missingCitationIds.add(citation);
    }
    if (hasFactualSignal(segment.text) && citations.length === 0) {
      uncitedFactualSegmentIds.push(segment.id);
    }
    for (const token of numericalTokens(segment.text)) {
      if (!allowedNumbers.has(token)) unsupportedNumericalClaims.add(token);
    }
  }

  const warnings = [
    ...(options.additionalWarnings ?? []),
    ...(missingCitationIds.size ? ["One or more citations do not point to a deterministic fact or step."] : []),
    ...(uncitedFactualSegmentIds.length ? ["One or more factual explanation segments have no citation."] : []),
    ...(unsupportedNumericalClaims.size ? ["One or more numerical, unit, percentage, or formula claims are not in the deterministic allowlist."] : []),
  ];
  const malformedOutput = options.malformedOutput ?? false;
  const status = malformedOutput
    ? "could_not_verify"
    : warnings.length > 0
      ? "warnings"
      : "verified";

  return {
    status,
    citedIds: [...citedIds].sort(),
    missingCitationIds: [...missingCitationIds].sort(),
    uncitedFactualSegmentIds,
    unsupportedNumericalClaims: [...unsupportedNumericalClaims].sort(),
    malformedOutput,
    warnings,
  };
}

