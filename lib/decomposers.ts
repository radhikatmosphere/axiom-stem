import type {
  ChemistryInput,
  ChemistryResult,
  DecomposeInput,
  DecomposeResult,
  GeneticsInput,
  GeneticsResult,
  MathInput,
  MathResult,
  PhysicsInput,
  PhysicsResult,
} from "@/types";

// ─── GENETICS: Punnett square decomposition ─────────────────────────────────

function parseGenotype(genotype: string): [string, string] {
  const g = genotype.trim().toUpperCase();
  if (g.length !== 2) throw new Error("Genotype must be 2 alleles (e.g. Aa, BB)");
  return [g[0], g[1]];
}

function getGametes(genotype: string): string[] {
  const [a1, a2] = parseGenotype(genotype);
  return Array.from(new Set([a1, a2])).sort();
}

export function decomposeGenetics(input: GeneticsInput): GeneticsResult {
  const p1 = input.parent1.trim();
  const p2 = input.parent2.trim();
  const gametes1 = getGametes(p1);
  const gametes2 = getGametes(p2);

  const grid: string[][] = [];
  const genotypeCounts: Record<string, number> = {};

  for (const g1 of gametes1) {
    const row: string[] = [];
    for (const g2 of gametes2) {
      const offspring = [g1, g2].sort().join("");
      row.push(offspring);
      genotypeCounts[offspring] = (genotypeCounts[offspring] || 0) + 1;
    }
    grid.push(row);
  }

  const total = Object.values(genotypeCounts).reduce((a, b) => a + b, 0);
  const genotypeProbabilities: Record<string, number> = {};
  for (const [gt, count] of Object.entries(genotypeCounts)) {
    genotypeProbabilities[gt] = Math.round((count / total) * 10000) / 100;
  }

  return {
    domain: "genetics",
    parent1: p1,
    parent2: p2,
    gametes1,
    gametes2,
    punnettGrid: grid,
    genotypeCounts,
    genotypeProbabilities,
    totalOffspring: total,
  };
}

// ─── MATH: Permutations & combinations ──────────────────────────────────────

function factorial(n: number): number {
  if (n < 0) throw new Error("n must be non-negative");
  if (n <= 1) return 1;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function perm(n: number, r: number): number {
  if (r > n) return 0;
  return factorial(n) / factorial(n - r);
}

function comb(n: number, r: number): number {
  if (r > n) return 0;
  return factorial(n) / (factorial(r) * factorial(n - r));
}

function generatePermutations<T>(arr: T[], r: number): T[][] {
  if (r === 0) return [[]];
  if (arr.length === 0) return [];
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const p of generatePermutations(rest, r - 1)) {
      result.push([arr[i], ...p]);
    }
  }
  return result;
}

function generateCombinations<T>(arr: T[], r: number): T[][] {
  if (r === 0) return [[]];
  if (arr.length < r) return [];
  const result: T[][] = [];
  for (let i = 0; i <= arr.length - r; i++) {
    for (const c of generateCombinations(arr.slice(i + 1), r - 1)) {
      result.push([arr[i], ...c]);
    }
  }
  return result;
}

export function decomposeMath(input: MathInput): MathResult {
  const { type, n, r, repetition } = input;
  if (n < 0 || r < 0) throw new Error("n and r must be non-negative");
  if (!Number.isInteger(n) || !Number.isInteger(r)) throw new Error("n and r must be integers");

  const steps: string[] = [];
  let result: number;
  let formula: string;

  if (type === "permutation") {
    if (repetition) {
      result = Math.pow(n, r);
      formula = `P(n,r) with repetition = n^r = ${n}^${r}`;
      steps.push(`With repetition allowed: each of ${r} positions has ${n} choices`);
      steps.push(`${n} × ${n} × ... (${r} times) = ${n}^${r} = ${result}`);
    } else {
      result = perm(n, r);
      formula = `P(n,r) = n!/(n-r)! = ${n}!/(${n}-${r})!`;
      steps.push(`n! = ${n}! = ${factorial(n)}`);
      steps.push(`(n-r)! = (${n}-${r})! = ${factorial(n - r)}`);
      steps.push(`P(${n},${r}) = ${factorial(n)} / ${factorial(n - r)} = ${result}`);
    }
  } else {
    if (repetition) {
      result = comb(n + r - 1, r);
      formula = `C(n+r-1,r) with repetition = C(${n}+${r}-1,${r})`;
      steps.push(`Stars-and-bars: C(n+r-1, r) = C(${n + r - 1}, ${r})`);
      steps.push(`= ${factorial(n + r - 1)} / (${factorial(r)} × ${factorial(n - 1)}) = ${result}`);
    } else {
      result = comb(n, r);
      formula = `C(n,r) = n!/(r!(n-r)!) = ${n}!/(${r}!×${n - r}!)`;
      steps.push(`C(${n},${r}) = ${factorial(n)} / (${factorial(r)} × ${factorial(n - r)})`);
      steps.push(`= ${result}`);
    }
  }

  let smallExample: MathResult["smallExample"];
  if (n <= 6 && r <= 3 && !repetition && result <= 20) {
    const items = Array.from({ length: n }, (_, i) => String.fromCharCode(65 + i));
    const outcomes =
      type === "permutation"
        ? generatePermutations(items, r).map((o) => o.join(""))
        : generateCombinations(items, r).map((o) => o.join(""));
    smallExample = { n, r, items, outcomes };
  }

  return { domain: "math", type, n, r, repetition, formula, result, steps, smallExample };
}

// ─── CHEMISTRY: Aufbau electron configuration ───────────────────────────────

const ELEMENTS: Record<string, { symbol: string; Z: number }> = {
  H: { symbol: "H", Z: 1 }, He: { symbol: "He", Z: 2 }, Li: { symbol: "Li", Z: 3 },
  Be: { symbol: "Be", Z: 4 }, B: { symbol: "B", Z: 5 }, C: { symbol: "C", Z: 6 },
  N: { symbol: "N", Z: 7 }, O: { symbol: "O", Z: 8 }, F: { symbol: "F", Z: 9 },
  Ne: { symbol: "Ne", Z: 10 }, Na: { symbol: "Na", Z: 11 }, Mg: { symbol: "Mg", Z: 12 },
  Al: { symbol: "Al", Z: 13 }, Si: { symbol: "Si", Z: 14 }, P: { symbol: "P", Z: 15 },
  S: { symbol: "S", Z: 16 }, Cl: { symbol: "Cl", Z: 17 }, Ar: { symbol: "Ar", Z: 18 },
  K: { symbol: "K", Z: 19 }, Ca: { symbol: "Ca", Z: 20 }, Fe: { symbol: "Fe", Z: 26 },
  Cu: { symbol: "Cu", Z: 29 }, Zn: { symbol: "Zn", Z: 30 }, Br: { symbol: "Br", Z: 35 },
  Kr: { symbol: "Kr", Z: 36 },
};

const ORBITAL_ORDER = [
  "1s", "2s", "2p", "3s", "3p", "4s", "3d", "4p", "5s", "4d", "5p",
  "6s", "4f", "5d", "6p", "7s", "5f", "6d", "7p",
];

const ORBITAL_CAPACITY: Record<string, number> = {
  s: 2, p: 6, d: 10, f: 14,
};

const NOBLE_GASES = [
  { Z: 0, symbol: "", config: "" },
  { Z: 2, symbol: "He", config: "1s²" },
  { Z: 10, symbol: "Ne", config: "[He] 2s² 2p⁶" },
  { Z: 18, symbol: "Ar", config: "[Ne] 3s² 3p⁶" },
  { Z: 36, symbol: "Kr", config: "[Ar] 4s² 3d¹⁰ 4p⁶" },
];

function superscript(n: number): string {
  const map: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
  return String(n).split("").map((d) => map[d] || d).join("");
}

function buildElectronConfig(Z: number): { full: string; steps: string[]; orbitals: Record<string, number> } {
  let remaining = Z;
  const orbitals: Record<string, number> = {};
  const steps: string[] = [];

  for (const orbital of ORBITAL_ORDER) {
    if (remaining <= 0) break;
    const type = orbital.slice(-1);
    const cap = ORBITAL_CAPACITY[type];
    const fill = Math.min(remaining, cap);
    orbitals[orbital] = fill;
    remaining -= fill;
    steps.push(`Fill ${orbital}: ${fill} electron${fill !== 1 ? "s" : ""} (max ${cap})`);
  }

  const full = Object.entries(orbitals)
    .map(([orb, count]) => `${orb}${superscript(count)}`)
    .join(" ");

  return { full, steps, orbitals };
}

function toNobleGasConfig(Z: number, full: string, orbitals: Record<string, number>): string {
  let noble = NOBLE_GASES[0];
  for (const ng of NOBLE_GASES) {
    if (ng.Z < Z && ng.Z > noble.Z) noble = ng;
  }
  if (noble.Z === 0) return full;

  const remaining = Object.entries(orbitals)
    .filter(([orb]) => {
      const orbZ = ORBITAL_ORDER.indexOf(orb) + 1;
      return orbZ > noble.Z;
    })
    .map(([orb, count]) => `${orb}${superscript(count)}`)
    .join(" ");

  return `[${noble.symbol}] ${remaining}`.trim();
}

function buildOrbitalDiagram(orbitals: Record<string, number>): string {
  const lines: string[] = [];
  for (const [orb, count] of Object.entries(orbitals)) {
    const type = orb.slice(-1);
    const boxes = type === "s" ? 1 : type === "p" ? 3 : type === "d" ? 5 : 7;
    let diagram = `${orb}: `;
    let placed = 0;
    for (let b = 0; b < boxes; b++) {
      const up = placed < count ? "↑" : " ";
      placed++;
      const down = placed < count ? "↓" : " ";
      placed++;
      diagram += `[${up}${down}] `;
    }
    lines.push(diagram.trim());
  }
  return lines.join("\n");
}

function countValenceElectrons(orbitals: Record<string, number>, Z: number): number {
  const maxShell = Math.ceil(Z / 8) || 1;
  let valence = 0;
  for (const [orb, count] of Object.entries(orbitals)) {
    const shell = parseInt(orb[0]);
    if (shell === maxShell || (shell === maxShell - 1 && orb.endsWith("d"))) {
      valence += count;
    }
  }
  return valence || orbitals[Object.keys(orbitals).pop()!] || 0;
}

export function decomposeChemistry(input: ChemistryInput): ChemistryResult {
  const key = input.element.trim().replace(/^[a-z]/, (c) => c.toUpperCase());
  const el = ELEMENTS[key];
  if (!el) throw new Error(`Unknown element: ${input.element}. Try H, C, O, Fe, etc.`);

  const Z = input.atomicNumber ?? el.Z;
  const { full, steps, orbitals } = buildElectronConfig(Z);
  const nobleGasConfig = toNobleGasConfig(Z, full, orbitals);
  const valenceElectrons = countValenceElectrons(orbitals, Z);
  const orbitalDiagram = buildOrbitalDiagram(orbitals);

  return {
    domain: "chemistry",
    element: key,
    symbol: el.symbol,
    atomicNumber: Z,
    fullConfig: full,
    nobleGasConfig,
    valenceElectrons,
    orbitalDiagram,
    aufbauSteps: steps,
  };
}

// ─── PHYSICS: Harmonic series ───────────────────────────────────────────────

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function freqToNote(freq: number): string {
  const A4 = 440;
  const semitones = Math.round(12 * Math.log2(freq / A4));
  const noteIndex = ((semitones % 12) + 12 + 9) % 12;
  const octave = 4 + Math.floor((semitones + 9) / 12);
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

export function decomposePhysics(input: PhysicsInput): PhysicsResult {
  const { fundamentalFrequency: f0, harmonics: n } = input;
  if (f0 <= 0) throw new Error("Fundamental frequency must be positive");
  if (n < 1 || n > 20) throw new Error("Harmonics count must be 1–20");

  const speedOfSound = 343;
  const harmonicEntries = Array.from({ length: n }, (_, i) => {
    const harmonic = i + 1;
    const frequency = f0 * harmonic;
    const wavelength = speedOfSound / frequency;
    return {
      harmonic,
      frequency: Math.round(frequency * 100) / 100,
      wavelength: Math.round(wavelength * 10000) / 10000,
      musicalNote: freqToNote(frequency),
    };
  });

  const seriesSum = harmonicEntries
    .map((h) => `${h.harmonic}×${f0}Hz = ${h.frequency}Hz (λ=${h.wavelength}m)`)
    .join("; ");

  return {
    domain: "physics",
    fundamentalFrequency: f0,
    speedOfSound,
    harmonics: harmonicEntries,
    seriesSum,
  };
}

// ─── ROUTER ─────────────────────────────────────────────────────────────────

export function decompose(input: DecomposeInput): DecomposeResult {
  switch (input.domain) {
    case "genetics":
      return decomposeGenetics(input.data);
    case "math":
      return decomposeMath(input.data);
    case "chemistry":
      return decomposeChemistry(input.data);
    case "physics":
      return decomposePhysics(input.data);
    default:
      throw new Error("Unknown domain");
  }
}