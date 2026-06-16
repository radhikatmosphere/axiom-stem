import type { DecomposeResult, Domain } from "@/types";

const DEMO: Record<Domain, (r: DecomposeResult) => string> = {
  genetics: (r) => {
    const g = r as import("@/types").GeneticsResult;
    const top = Object.entries(g.genotypeProbabilities)
      .sort((a, b) => b[1] - a[1])[0];
    return `**Imagine you're a genetic detective** — two parents (${g.parent1} × ${g.parent2}) are about to pass their allele "cards" to offspring. Each parent shuffles their gametes (${g.gametes1.join(", ")} and ${g.gametes2.join(", ")}) and deals them into a Punnett grid.

The math is exact: **${top?.[0] ?? "—"} appears ${top?.[1] ?? 0}%** of the time. No guessing — every square in the grid is a combinatorial certainty, like counting syllables in a Sragdharā verse.

**Think about it:** If ${g.parent1} is heterozygous, why do some genotypes show up twice as often?

**Try this:** Flip two coins (H=dominant, T=recessive). Tally 20 offspring. Does your ratio match ${top?.[1] ?? 50}%?`;
  },

  math: (r) => {
    const m = r as import("@/types").MathResult;
    return `**Counting isn't boring when you see the structure.** You asked: ${m.type === "permutation" ? "how many ways to *arrange*" : "how many ways to *choose*"} ${m.r} items from ${m.n}.

The formula \`${m.formula}\` gives **exactly ${m.result}** — computed in pure math, zero AI guessing.

${m.smallExample ? `For a tiny example with {${m.smallExample.items.join(", ")}}: ${m.smallExample.outcomes.slice(0, 5).join(", ")}${m.smallExample.outcomes.length > 5 ? "..." : ""}` : m.steps.join(" → ")}

**Socratic question:** Why does order matter for permutations but not combinations?

**Micro-experiment:** List all outcomes for n=3, r=2 with actual objects (3 colored pens). Count them. Does it match C(3,2)=3?`;
  },

  chemistry: (r) => {
    const c = r as import("@/types").ChemistryResult;
    return `**${c.element} is element #${c.atomicNumber}** — and its electrons follow the Aufbau principle like filling seats in a theater: lowest energy orbitals first.

Full config: **${c.fullConfig}**
Noble gas shorthand: **${c.nobleGasConfig}**
Valence electrons: **${c.valenceElectrons}** (these drive bonding!)

The orbital diagram shows exactly where each electron lives — ↑↓ pairs in each box.

**Real-world hook:** ${c.valenceElectrons <= 2 ? "Alkali/alkaline metals — eager to give away electrons!" : c.valenceElectrons >= 6 ? "Almost full shell — wants to grab electrons!" : "Ready to share electrons in covalent bonds."}

**Try this:** Build ${c.element} with cotton balls (electrons) on a paper plate (nucleus). One row per orbital.`;
  },

  physics: (r) => {
    const p = r as import("@/types").PhysicsResult;
    const h1 = p.harmonics[0];
    return `**Every musical note is a harmonic story.** Your fundamental frequency ${p.fundamentalFrequency} Hz is the "root" — like the first beat of a tabla.

The harmonic series multiplies: 1×, 2×, 3×... giving frequencies ${p.harmonics.slice(0, 3).map((h) => `${h.frequency}Hz (${h.musicalNote})`).join(", ")}.

At harmonic 1: λ = **${h1?.wavelength ?? "—"} m** (speed of sound ${p.speedOfSound} m/s ÷ frequency).

**Why it matters:** Guitar strings, organ pipes, and your voice all decompose into this exact combinatorial series.

**Try this:** Hum a note. Then hum the same note an octave higher (2× frequency). Feel the 2:1 ratio!`;
  },
};

export function getDemoNarrative(result: DecomposeResult, domain: Domain): string {
  return DEMO[domain](result);
}