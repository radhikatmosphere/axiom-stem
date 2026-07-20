import type {
  AxiomResult,
  NarrativeResult,
  VerificationStatus,
} from "@/types";

/**
 * Adapter that renders AXIOM's deterministic + verified narrative output
 * into a chat-friendly Markdown shape used by the web chat UI.
 *
 * It never mutates the underlying AxiomResult. It only reads it and produces
 * a serializable view that preserves:
 *   - the exact numeric values from the deterministic engine,
 *   - every citation id (so the chat UI can render evidence links), and
 *   - the honest verification status from the claim verifier.
 */

export interface ChatEvidence {
  id: string;
  label: string;
  statement: string;
}

export interface ChatCitedSegment {
  text: string;
  citations: string[];
}

export interface ChatResult {
  /** Short headline used as the chat bubble title. */
  headline: string;
  /** Deterministic engine version copied verbatim from AxiomResult. */
  engineVersion: string;
  /** Human-readable domain name. */
  domainLabel: string;
  /** Markdown-ish display payload for the deterministic grid/formula. */
  display: ChatDisplay;
  /** Cited explanation segments (raw strings + citation ids). */
  segments: ChatCitedSegment[];
  /** Open-ended follow-up questions. */
  followUpQuestions: string[];
  /** Verification badge mirrored from the claim verifier. */
  verification: {
    status: VerificationStatus;
    warnings: string[];
    supportedClaims: number;
    unsupportedClaims: string[];
  };
  /** Distinguished summary text with its own citations. */
  summary: ChatCitedSegment;
  /** Honest provenance label. */
  provider: "openai" | "deterministic_fallback";
  fallbackReason?: string;
  /** Evidence ledger terms (facts + steps), used to render citation chips. */
  evidence: ChatEvidence[];
  /** Deterministic warnings from the engine (e.g., model limits). */
  engineWarnings: string[];
}

export type ChatDisplay =
  | { kind: "punnett"; parent1: string; parent2: string; gametes1: string[]; gametes2: string[]; grid: string[][]; probabilities: Record<string, number> }
  | { kind: "combinatorics"; type: "permutation" | "combination"; formula: string; result: number; sampleOutcomes?: string[] };

const DOMAIN_LABELS: Record<string, string> = {
  genetics: "Genetics",
  combinatorics: "Combinatorics",
};

const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  verified: "Verified",
  warnings: "Warnings",
  could_not_verify: "Could not verify",
};

export function verificationLabel(status: VerificationStatus): string {
  return VERIFICATION_LABELS[status];
}

function toChatDisplay(result: AxiomResult): ChatDisplay {
  const display = result.display;
  if (display.kind === "punnett") {
    return {
      kind: "punnett",
      parent1: display.parent1,
      parent2: display.parent2,
      gametes1: display.gametes1,
      gametes2: display.gametes2,
      grid: display.grid,
      probabilities: display.probabilities,
    };
  }
  return {
    kind: "combinatorics",
    type: display.type,
    formula: display.formula,
    result: display.result,
    sampleOutcomes: display.sampleOutcomes,
  };
}

function headlineFor(result: AxiomResult): string {
  const display = result.display;
  if (display.kind === "punnett") {
    return `${display.parent1} × ${display.parent2}`;
  }
  const prefix = display.type === "permutation" ? "P" : "C";
  return `${prefix}(${result.normalizedInput.n},${result.normalizedInput.r})`;
}

/**
 * Convert an (AxiomResult, NarrativeResult) pair into a chat-ready payload.
 * This is the only function the chat route needs; the web chat renders it
 * without touching the deterministic record.
 */
export function axiomToChat(
  result: AxiomResult,
  narrative: NarrativeResult
): ChatResult {
  const evidence: ChatEvidence[] = [
    ...result.facts.map((fact) => ({
      id: fact.id,
      label: fact.label,
      statement: fact.statement,
    })),
    ...result.steps.map((step) => ({
      id: step.id,
      label: step.label,
      statement: step.detail,
    })),
  ];

  const supportedClaims = narrative.verification.citedIds.length;

  return {
    headline: headlineFor(result),
    engineVersion: result.engineVersion,
    domainLabel: DOMAIN_LABELS[result.domain] ?? result.domain,
    display: toChatDisplay(result),
    summary: {
      text: narrative.summary,
      citations: narrative.summaryCitations,
    },
    segments: narrative.explanationSegments.map((segment) => ({
      text: segment.text,
      citations: segment.citations,
    })),
    followUpQuestions: narrative.followUpQuestions,
    verification: {
      status: narrative.verification.status,
      warnings: narrative.verification.warnings,
      supportedClaims,
      unsupportedClaims: narrative.verification.unsupportedNumericalClaims,
    },
    provider: narrative.provider,
    fallbackReason: narrative.fallbackReason,
    evidence,
    engineWarnings: result.warnings,
  };
}
