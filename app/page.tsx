"use client";

import { useState } from "react";
import { Calculator, CheckCircle2, ChevronRight, Dna, Sparkles } from "lucide-react";
import NarrativePanel from "@/components/NarrativePanel";
import { computeAxiom } from "@/lib/axiom-result";
import type {
  AxiomDomain,
  AxiomInput,
  AxiomResult,
  NarrativeResult,
} from "@/types";

const examples = {
  genetics: { parent1: "Aa", parent2: "aa" },
  combinatorics: { type: "combination" as const, n: 5, r: 3, repetition: false },
};

export default function Home() {
  const [domain, setDomain] = useState<AxiomDomain>("genetics");
  const [parent1, setParent1] = useState("Aa");
  const [parent2, setParent2] = useState("aa");
  const [mathType, setMathType] = useState<"combination" | "permutation">("combination");
  const [n, setN] = useState(5);
  const [r, setR] = useState(3);
  const [repetition, setRepetition] = useState(false);
  const [level, setLevel] = useState<"middle-school" | "high-school" | "intro-college">("high-school");
  const [language, setLanguage] = useState<"en" | "es">("en");
  const [result, setResult] = useState<AxiomResult | null>(null);
  const [narrative, setNarrative] = useState<NarrativeResult | null>(null);
  const [computeError, setComputeError] = useState<string | null>(null);
  const [narrativeError, setNarrativeError] = useState<string | null>(null);
  const [narrativeLoading, setNarrativeLoading] = useState(false);

  function currentInput(): AxiomInput {
    return domain === "genetics"
      ? { domain, data: { parent1, parent2 } }
      : { domain, data: { type: mathType, n, r, repetition } };
  }

  function chooseDomain(nextDomain: AxiomDomain) {
    setDomain(nextDomain);
    setResult(null);
    setNarrative(null);
    setComputeError(null);
    setNarrativeError(null);
  }

  function loadExample() {
    if (domain === "genetics") {
      setParent1(examples.genetics.parent1);
      setParent2(examples.genetics.parent2);
    } else {
      setMathType(examples.combinatorics.type);
      setN(examples.combinatorics.n);
      setR(examples.combinatorics.r);
      setRepetition(examples.combinatorics.repetition);
    }
    setResult(null);
    setNarrative(null);
    setComputeError(null);
  }

  function compute() {
    setComputeError(null);
    setNarrativeError(null);
    setNarrative(null);
    try {
      setResult(computeAxiom(currentInput()));
    } catch {
      setResult(null);
      setComputeError("AXIOM could not compute this input. Genetics accepts two alleles for the same gene, such as Aa and aa.");
    }
  }

  async function generateExplanation() {
    if (!result) return;
    setNarrativeLoading(true);
    setNarrativeError(null);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 14_000);
    try {
      const response = await fetch("/api/narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain,
          input: currentInput().data,
          learner: { level, language },
        }),
        signal: controller.signal,
      });
      const payload = await response.json() as {
        error?: string;
        axiomResult?: AxiomResult;
        narrative?: NarrativeResult;
      };
      if (!response.ok || !payload.axiomResult || !payload.narrative) {
        throw new Error(payload.error || "Could not generate the explanation.");
      }
      setResult(payload.axiomResult);
      setNarrative(payload.narrative);
    } catch (error) {
      setNarrativeError(
        error instanceof Error && error.name === "AbortError"
          ? "Explanation request timed out. Your deterministic result is still available."
          : error instanceof Error ? error.message : "Could not generate the explanation."
      );
    } finally {
      window.clearTimeout(timeout);
      setNarrativeLoading(false);
    }
  }

  return (
    <div className="relative z-10 min-h-screen">
      <header className="border-b border-white/10 bg-panel/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-cyan focus:px-3 focus:py-2 focus:text-void">
            Skip to main content
          </a>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan font-bold text-void">A</div>
            <div>
              <h1 className="text-lg font-bold gradient-text">AXIOM</h1>
              <p className="text-xs text-white/60">Compute → Explain → Verify</p>
            </div>
          </div>
          <span className="rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 text-xs font-semibold text-cyan">
            Deterministic STEM tutor
          </span>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-6xl px-4 py-8">
        <section className="mb-8 max-w-3xl">
          <p className="mb-2 flex items-center gap-2 text-sm text-cyan"><Sparkles size={15} /> Verifiable explanations, not generated answers</p>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            AXIOM computes STEM answers with deterministic code, then uses OpenAI to explain the verified result.
          </h2>
          <p className="mt-3 max-w-2xl text-white/65">
            Start with the Aa × aa genetics cross. The model is allowed to explain only the citable facts and calculation steps below.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <aside className="space-y-4 lg:sticky lg:top-5 lg:self-start">
            <section className="axiom-card" aria-labelledby="problem-heading">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan">1. Compute</p>
              <h2 id="problem-heading" className="mt-1 text-lg font-semibold">Choose a deterministic problem</h2>

              <div className="mt-4 grid grid-cols-2 gap-2" role="group" aria-label="STEM domain">
                <button
                  type="button"
                  onClick={() => chooseDomain("genetics")}
                  aria-pressed={domain === "genetics"}
                  className={`axiom-card p-3 text-left ${domain === "genetics" ? "active" : ""}`}
                >
                  <Dna size={19} className="mb-2 text-emerald-300" />
                  <span className="block text-sm font-semibold">Genetics</span>
                  <span className="text-xs text-white/50">Aa × aa</span>
                </button>
                <button
                  type="button"
                  onClick={() => chooseDomain("combinatorics")}
                  aria-pressed={domain === "combinatorics"}
                  className={`axiom-card p-3 text-left ${domain === "combinatorics" ? "active" : ""}`}
                >
                  <Calculator size={19} className="mb-2 text-blue-300" />
                  <span className="block text-sm font-semibold">Combinatorics</span>
                  <span className="text-xs text-white/50">C(5,3)</span>
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {domain === "genetics" ? (
                  <>
                    <div>
                      <label htmlFor="parent1" className="axiom-label">Parent 1 genotype</label>
                      <input id="parent1" className="axiom-input" value={parent1} onChange={(event) => setParent1(event.target.value)} maxLength={24} placeholder="Aa" />
                    </div>
                    <div>
                      <label htmlFor="parent2" className="axiom-label">Parent 2 genotype</label>
                      <input id="parent2" className="axiom-input" value={parent2} onChange={(event) => setParent2(event.target.value)} maxLength={24} placeholder="aa" />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label htmlFor="count-type" className="axiom-label">Counting rule</label>
                      <select id="count-type" className="axiom-input" value={mathType} onChange={(event) => setMathType(event.target.value as "combination" | "permutation")}>
                        <option value="combination">Combination C(n,r)</option>
                        <option value="permutation">Permutation P(n,r)</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="n" className="axiom-label">n items</label>
                        <input id="n" type="number" className="axiom-input" value={n} min={0} max={170} onChange={(event) => setN(Number(event.target.value))} />
                      </div>
                      <div>
                        <label htmlFor="r" className="axiom-label">r selected</label>
                        <input id="r" type="number" className="axiom-input" value={r} min={0} max={170} onChange={(event) => setR(Number(event.target.value))} />
                      </div>
                    </div>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-white/75">
                      <input type="checkbox" checked={repetition} onChange={(event) => setRepetition(event.target.checked)} className="h-4 w-4 accent-cyan" />
                      Allow repetition
                    </label>
                  </>
                )}

                <button type="button" onClick={loadExample} className="text-sm text-cyan underline-offset-4 hover:underline">
                  Load example
                </button>
                {computeError && <p role="alert" className="rounded-lg border border-red-300/30 bg-red-400/10 p-3 text-sm text-red-100">{computeError}</p>}
                <button type="button" onClick={compute} className="axiom-btn-primary flex w-full items-center justify-center gap-2">
                  Compute deterministically <ChevronRight size={16} />
                </button>
              </div>
            </section>

            <section className="axiom-card" aria-labelledby="learner-heading">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">Explanation settings</p>
              <h2 id="learner-heading" className="mt-1 text-base font-semibold">Adapt the narration</h2>
              <label htmlFor="level" className="axiom-label mt-4">Learner level</label>
              <select id="level" className="axiom-input" value={level} onChange={(event) => setLevel(event.target.value as typeof level)}>
                <option value="middle-school">Middle school</option>
                <option value="high-school">High school</option>
                <option value="intro-college">Intro college</option>
              </select>
              <label htmlFor="language" className="axiom-label mt-4">Language</label>
              <select id="language" className="axiom-input" value={language} onChange={(event) => setLanguage(event.target.value as typeof language)}>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
              <button type="button" onClick={generateExplanation} disabled={!result || narrativeLoading} className="axiom-btn-secondary mt-4 flex w-full items-center justify-center gap-2">
                Generate explanation
              </button>
              <p className="mt-3 text-xs leading-5 text-white/50">
                Without OPENAI_API_KEY and OPENAI_MODEL, AXIOM shows a cited deterministic fallback.
              </p>
            </section>

            <section className="rounded-xl border border-dashed border-white/20 p-4 text-sm text-white/60" aria-labelledby="chandas-heading">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">Experimental</p>
              <h2 id="chandas-heading" className="mt-1 font-semibold text-white/80">Chandas / Sanskrit prosody</h2>
              <p className="mt-2">Disabled: this repository has no source-validated scansion fixtures yet. See the design note before enabling an analyzer.</p>
            </section>
          </aside>

          <div className="space-y-6">
            <DeterministicResultPanel result={result} />
            <NarrativePanel narrative={narrative} loading={narrativeLoading} error={narrativeError} />
          </div>
        </div>
      </main>

      <footer className="mt-12 border-t border-white/10 py-6 text-center text-xs text-white/45">
        AXIOM keeps computation local and deterministic. OpenAI is used only for the optional explanation layer.
      </footer>
    </div>
  );
}

function DeterministicResultPanel({ result }: { result: AxiomResult | null }) {
  if (!result) {
    return (
      <section className="axiom-card min-h-[300px]" aria-labelledby="result-heading">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan">Deterministic result</p>
        <h2 id="result-heading" className="mt-1 text-lg font-semibold">Evidence will appear here</h2>
        <p className="mt-3 text-sm text-white/55">Compute the Aa × aa example to see the exact Punnett grid, stable fact IDs, and derivation steps.</p>
      </section>
    );
  }

  return (
    <section className="axiom-card" aria-labelledby="result-heading">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan">1. Compute — deterministic engine</p>
          <h2 id="result-heading" className="mt-1 text-lg font-semibold">Exact result and evidence</h2>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-100">
          <CheckCircle2 size={14} /> Engine v{result.engineVersion}
        </span>
      </div>

      {result.display.kind === "punnett" ? <PunnettGrid result={result} /> : <CombinatoricsResult result={result} />}

      <details className="mt-6 rounded-lg border border-white/10 bg-void/30 p-4" open>
        <summary className="cursor-pointer font-semibold">Evidence ledger: facts and steps</summary>
        <div className="mt-4 space-y-3">
          {result.facts.map((fact) => (
            <article key={fact.id} id={`evidence-${fact.id}`} className="rounded-lg border border-white/10 bg-panel/70 p-3 scroll-mt-5">
              <code className="text-xs text-cyan">{fact.id}</code>
              <h3 className="mt-1 text-sm font-semibold">{fact.label}</h3>
              <p className="mt-1 text-sm text-white/70">{fact.statement}</p>
            </article>
          ))}
          {result.steps.map((step) => (
            <article key={step.id} id={`evidence-${step.id}`} className="rounded-lg border border-gold/20 bg-gold/5 p-3 scroll-mt-5">
              <code className="text-xs text-gold">{step.id}</code>
              <h3 className="mt-1 text-sm font-semibold">{step.label}</h3>
              <p className="mt-1 text-sm text-white/70">{step.detail}</p>
            </article>
          ))}
        </div>
      </details>

      <div className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/5 p-3 text-sm text-amber-50">
        <strong>Model limit:</strong> {result.warnings[0]}
      </div>
    </section>
  );
}

function PunnettGrid({ result }: { result: AxiomResult }) {
  if (result.display.kind !== "punnett") return null;
  const display = result.display;
  return (
    <div className="space-y-4">
      <p className="text-sm text-white/70">
        Cross: <strong>{display.parent1} × {display.parent2}</strong>. Each table cell is an enumerated allele pairing.
      </p>
      <div className="overflow-x-auto">
        <table className="border-collapse font-mono text-sm" aria-label="Punnett grid">
          <thead>
            <tr>
              <th scope="col" className="border border-white/10 bg-void/50 p-3"><span className="sr-only">Parent 1 / Parent 2</span></th>
              {display.gametes2.map((gamete, index) => (
                <th scope="col" key={`${gamete}-${index}`} className="border border-cyan/30 bg-cyan/10 p-3 text-cyan">{gamete}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {display.grid.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <th scope="row" className="border border-gold/30 bg-gold/10 p-3 text-gold">{display.gametes1[rowIndex]}</th>
                {row.map((genotype, columnIndex) => <td key={`${genotype}-${columnIndex}`} className="border border-white/10 p-4 text-center font-semibold">{genotype}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-2">
        {Object.entries(display.probabilities).sort(([a], [b]) => a.localeCompare(b)).map(([genotype, probability]) => (
          <span key={genotype} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm">
            <strong className="text-cyan">{genotype}</strong>: {probability}%
          </span>
        ))}
      </div>
    </div>
  );
}

function CombinatoricsResult({ result }: { result: AxiomResult }) {
  if (result.display.kind !== "combinatorics") return null;
  const display = result.display;
  return (
    <div className="space-y-3">
      <p className="text-sm text-white/70">Exact {display.type} count</p>
      <p className="font-mono text-2xl font-bold text-cyan">{display.result}</p>
      <p className="rounded-lg bg-void/40 p-3 font-mono text-sm text-white/80">{display.formula}</p>
      {display.sampleOutcomes && (
        <p className="text-sm text-white/60">Small enumerated sample: {display.sampleOutcomes.join(", ")}</p>
      )}
    </div>
  );
}
