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

export interface NarrativeRequest {
  result: DecomposeResult;
  domain: Domain;
}

export interface NarrativeResponse {
  narrative: string;
  provider: "anthropic" | "agent-core" | "demo";
}

export interface ProgressState {
  totalXp: number;
  level: number;
  streakDays: number;
  badges: string[];
  domains: Record<Domain, number>;
  walletAddress?: string;
  bhaktiTier?: number;
  bhaktiConfidence?: number;
}

export interface BhaktiResponse {
  bhakti?: {
    daily_confidence: number;
    weekly_confidence: number;
    total_confidence: number;
    tier: number;
    streak_days: number;
  };
  message?: string;
}