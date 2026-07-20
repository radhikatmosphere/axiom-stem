export type Domain = "genetics" | "math" | "chemistry" | "physics";

export interface GeneticsInput {
  parent1: string;
  parent2: string;
}

export interface GeneticsResult {
  domain: "genetics";
  parent1: string;
  parent2: string;
  gametes1: string[];
  gametes2: string[];
  punnettGrid: string[][];
  genotypeCounts: Record<string, number>;
  genotypeProbabilities: Record<string, number>;
  totalOffspring: number;
}

export interface MathInput {
  type: "permutation" | "combination";
  n: number;
  r: number;
  repetition: boolean;
}

export interface MathResult {
  domain: "math";
  type: "permutation" | "combination";
  n: number;
  r: number;
  repetition: boolean;
  formula: string;
  result: number;
  steps: string[];
  smallExample?: { n: number; r: number; items: string[]; outcomes: string[] };
}

export interface ChemistryInput {
  element: string;
  atomicNumber?: number;
}

export interface ChemistryResult {
  domain: "chemistry";
  element: string;
  symbol: string;
  atomicNumber: number;
  fullConfig: string;
  nobleGasConfig: string;
  valenceElectrons: number;
  orbitalDiagram: string;
  aufbauSteps: string[];
}

export interface PhysicsInput {
  fundamentalFrequency: number;
  harmonics: number;
}

export interface HarmonicEntry {
  harmonic: number;
  frequency: number;
  wavelength: number;
  musicalNote?: string;
}

export interface PhysicsResult {
  domain: "physics";
  fundamentalFrequency: number;
  speedOfSound: number;
  harmonics: HarmonicEntry[];
  seriesSum: string;
}

export type DecomposeInput =
  | { domain: "genetics"; data: GeneticsInput }
  | { domain: "math"; data: MathInput }
  | { domain: "chemistry"; data: ChemistryInput }
  | { domain: "physics"; data: PhysicsInput };

export type DecomposeResult =
  | GeneticsResult
  | MathResult
  | ChemistryResult
  | PhysicsResult;

// ─── Verifiable tutoring contract ───────────────────────────────────────────

export type AxiomDomain = "genetics" | "combinatorics";

export type AxiomInput =
  | { domain: "genetics"; data: GeneticsInput }
  | { domain: "combinatorics"; data: MathInput };

export interface AxiomFact {
  /** Stable identifier used by explanatory citations. */
  id: string;
  label: string;
  statement: string;
  value: string | number | boolean | string[] | Record<string, number>;
}

export interface AxiomDerivation {
  id: string;
  rule: string;
  inputFactIds: string[];
  outputFactIds: string[];
  explanation: string;
}

export interface AxiomStep {
  id: string;
  label: string;
  detail: string;
  factIds: string[];
}

export interface GeneticsDisplay {
  kind: "punnett";
  parent1: string;
  parent2: string;
  gametes1: string[];
  gametes2: string[];
  grid: string[][];
  probabilities: Record<string, number>;
}

export interface CombinatoricsDisplay {
  kind: "combinatorics";
  type: "permutation" | "combination";
  formula: string;
  result: number;
  sampleOutcomes?: string[];
}

export interface AxiomResult {
  domain: AxiomDomain;
  normalizedInput: Record<string, string | number | boolean>;
  facts: AxiomFact[];
  derivations: AxiomDerivation[];
  steps: AxiomStep[];
  warnings: string[];
  confidence: { level: "high"; rationale: string };
  engineVersion: string;
  display: GeneticsDisplay | CombinatoricsDisplay;
}

export interface NarrativeSegment {
  id: string;
  text: string;
  citations: string[];
}

export type VerificationStatus = "verified" | "warnings" | "could_not_verify";

export interface VerificationReport {
  status: VerificationStatus;
  citedIds: string[];
  missingCitationIds: string[];
  uncitedFactualSegmentIds: string[];
  unsupportedNumericalClaims: string[];
  malformedOutput: boolean;
  warnings: string[];
}

export interface NarrativeResult {
  summary: string;
  summaryCitations: string[];
  explanationSegments: NarrativeSegment[];
  followUpQuestions: string[];
  unsupportedClaims: string[];
  verification: VerificationReport;
  provider: "openai" | "deterministic_fallback";
  fallbackReason?: "missing_configuration" | "provider_unavailable" | "invalid_model_output";
}

export interface NarrativeRequestV2 {
  domain: AxiomDomain;
  input: Record<string, unknown>;
  learner: {
    level: "middle-school" | "high-school" | "intro-college";
    language: "en" | "es";
  };
}

