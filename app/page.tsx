"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dna, Calculator, FlaskConical, Waves, Copy, Check,
  Sparkles, ExternalLink, ChevronRight,
} from "lucide-react";
import { decompose } from "@/lib/decomposers";
import { awardXp, loadProgress, saveProgress } from "@/lib/gamification";
import NarrativePanel from "@/components/NarrativePanel";
import ProgressPanel from "@/components/ProgressPanel";
import AuthPanel, { type AuthUser } from "@/components/AuthPanel";
import { loadFirebaseSession } from "@/lib/firebase-client";
import type {
  Domain, DecomposeResult, GeneticsResult, MathResult,
  ChemistryResult, PhysicsResult, ProgressState,
} from "@/types";

const DOMAINS: { id: Domain; label: string; icon: typeof Dna; color: string; example: string }[] = [
  { id: "genetics", label: "Genetics", icon: Dna, color: "text-emerald-400", example: "Aa × Aa" },
  { id: "math", label: "Combinatorics", icon: Calculator, color: "text-blue-400", example: "P(5,3)" },
  { id: "chemistry", label: "Chemistry", icon: FlaskConical, color: "text-purple-400", example: "Fe" },
  { id: "physics", label: "Harmonics", icon: Waves, color: "text-amber-400", example: "440 Hz" },
];

export default function Home() {
  const [domain, setDomain] = useState<Domain>("genetics");
  const [result, setResult] = useState<DecomposeResult | null>(null);
  const [narrative, setNarrative] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jsonCopied, setJsonCopied] = useState(false);
  const [progress, setProgress] = useState<ProgressState>(loadProgress);
  const [authUser, setAuthUser] = useState<AuthUser | undefined>();

  useEffect(() => {
    const saved = loadProgress();
    if (saved.walletAddress) {
      setAuthUser({
        address: saved.walletAddress,
        chain: saved.authChain ?? "wallet",
        email: saved.email,
        uid: saved.firebaseUid,
      });
    } else {
      const fb = loadFirebaseSession();
      if (fb) {
        setAuthUser({ address: fb.address, chain: "firebase", email: fb.email, uid: fb.uid });
        setProgress((p) => ({
          ...p,
          walletAddress: fb.address,
          authChain: "firebase",
          firebaseUid: fb.uid,
          email: fb.email ?? undefined,
        }));
      }
    }
  }, []);

  // Inputs per domain
  const [parent1, setParent1] = useState("Aa");
  const [parent2, setParent2] = useState("Aa");
  const [mathType, setMathType] = useState<"permutation" | "combination">("combination");
  const [mathN, setMathN] = useState(5);
  const [mathR, setMathR] = useState(3);
  const [mathRep, setMathRep] = useState(false);
  const [element, setElement] = useState("Fe");
  const [frequency, setFrequency] = useState(440);
  const [harmonics, setHarmonics] = useState(5);

  const fetchNarrative = useCallback(async (res: DecomposeResult, dom: Domain) => {
    setNarrativeLoading(true);
    setNarrative(null);
    setProvider(null);
    try {
      const r = await fetch("/api/narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result: res, domain: dom }),
      });
      const data = await r.json();
      setNarrative(data.narrative);
      setProvider(data.provider);
    } catch {
      setNarrative("Could not load narrative. The decomposition result is still exact!");
    } finally {
      setNarrativeLoading(false);
    }
  }, []);

  async function handleDecompose() {
    setLoading(true);
    setError(null);
    try {
      let res: DecomposeResult;
      switch (domain) {
        case "genetics":
          res = decompose({ domain, data: { parent1, parent2 } });
          break;
        case "math":
          res = decompose({ domain, data: { type: mathType, n: mathN, r: mathR, repetition: mathRep } });
          break;
        case "chemistry":
          res = decompose({ domain, data: { element } });
          break;
        case "physics":
          res = decompose({ domain, data: { fundamentalFrequency: frequency, harmonics } });
          break;
      }
      setResult(res);

      const newProgress = awardXp(domain, progress);
      setProgress(newProgress);
      saveProgress(newProgress);

      if (progress.walletAddress) {
        fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet: progress.walletAddress, domain, xp: 10 }),
        }).catch(() => {});
      }

      fetch("/api/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "decompose", domain }),
      }).catch(() => {});

      await fetchNarrative(res, domain);
    } catch (e) {
      fetch("/api/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "error",
          domain,
          metadata: { source: "decompose", message: e instanceof Error ? e.message : "unknown" },
        }),
      }).catch(() => {});
      setError(e instanceof Error ? e.message : "Decomposition failed");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleAuthConnect(user: AuthUser) {
    setAuthUser(user);
    const updated: ProgressState = {
      ...progress,
      walletAddress: user.address,
      authChain: user.chain,
      firebaseUid: user.uid,
      email: user.email ?? undefined,
    };
    setProgress(updated);
    saveProgress(updated);

    fetch("/api/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "auth_connect",
        metadata: { chain: user.chain },
      }),
    }).catch(() => {});

    if (user.chain === "wallet") {
      try {
        const r = await fetch(`/api/progress?wallet=${user.address}`);
        const data = await r.json();
        if (data.bhakti?.bhakti) {
          const withBhakti = {
            ...updated,
            bhaktiTier: data.bhakti.bhakti.tier,
            bhaktiConfidence: data.bhakti.bhakti.total_confidence,
          };
          setProgress(withBhakti);
          saveProgress(withBhakti);
        }
      } catch { /* local mode */ }
    }
  }

  function handleAuthDisconnect() {
    setAuthUser(undefined);
    const updated: ProgressState = {
      ...progress,
      walletAddress: undefined,
      authChain: undefined,
      firebaseUid: undefined,
      email: undefined,
      bhaktiTier: undefined,
      bhaktiConfidence: undefined,
    };
    setProgress(updated);
    saveProgress(updated);
  }

  async function copyJson() {
    if (!result) return;
    await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setJsonCopied(true);
    setTimeout(() => setJsonCopied(false), 2000);
  }

  function loadExample() {
    const d = DOMAINS.find((x) => x.id === domain);
    if (!d) return;
    switch (domain) {
      case "genetics": setParent1("Aa"); setParent2("aa"); break;
      case "math": setMathType("combination"); setMathN(5); setMathR(3); setMathRep(false); break;
      case "chemistry": setElement("Fe"); break;
      case "physics": setFrequency(440); setHarmonics(5); break;
    }
  }

  return (
    <div className="relative z-10 min-h-screen">
      {/* Header */}
      <header className="border-b border-white/5 bg-panel/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan to-gold flex items-center justify-center font-bold text-void text-sm">
              A
            </div>
            <div>
              <h1 className="font-bold text-lg gradient-text">AXIOM</h1>
              <p className="text-xs text-white/40">Compute First. Explain Second.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://radhikachain.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1 text-xs text-white/40 hover:text-cyan transition-colors"
            >
              RadhikaChain <ExternalLink size={10} />
            </a>
            <AuthPanel
              user={authUser}
              onConnect={handleAuthConnect}
              onDisconnect={handleAuthDisconnect}
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
          <p className="text-sm text-cyan/80 mb-2 flex items-center justify-center gap-2">
            <Sparkles size={14} /> RADHIKATMOSPHERE · DSH Hacks V1
          </p>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            STEM problems, <span className="gradient-text">decomposed exactly</span>
          </h2>
          <p className="text-white/50 text-sm max-w-xl mx-auto">
            Layer 1 computes truth. Layer 2 explains meaning. No LLM guessing on math.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left: Input panel */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 lg:self-start space-y-4">
            {/* Domain cards */}
            <div className="grid grid-cols-2 gap-2">
              {DOMAINS.map((d) => {
                const Icon = d.icon;
                return (
                  <button
                    key={d.id}
                    onClick={() => { setDomain(d.id); setResult(null); setNarrative(null); setError(null); }}
                    className={`axiom-card text-left p-3 ${domain === d.id ? "active" : ""}`}
                  >
                    <Icon size={18} className={`${d.color} mb-1`} />
                    <div className="text-sm font-medium">{d.label}</div>
                    <div className="text-xs text-white/30">{d.example}</div>
                  </button>
                );
              })}
            </div>

            {/* Dynamic inputs */}
            <div className="axiom-card space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Input</h3>
                <button onClick={loadExample} className="text-xs text-cyan hover:underline">Load example</button>
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={domain} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {domain === "genetics" && (
                    <>
                      <label className="axiom-label">Parent 1 genotype</label>
                      <input className="axiom-input mb-2" value={parent1} onChange={(e) => setParent1(e.target.value)} placeholder="Aa" />
                      <label className="axiom-label">Parent 2 genotype</label>
                      <input className="axiom-input" value={parent2} onChange={(e) => setParent2(e.target.value)} placeholder="aa" />
                    </>
                  )}
                  {domain === "math" && (
                    <>
                      <label className="axiom-label">Type</label>
                      <select className="axiom-input mb-2" value={mathType} onChange={(e) => setMathType(e.target.value as "permutation" | "combination")}>
                        <option value="combination">Combination C(n,r)</option>
                        <option value="permutation">Permutation P(n,r)</option>
                      </select>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                          <label className="axiom-label">n</label>
                          <input type="number" className="axiom-input" value={mathN} onChange={(e) => setMathN(+e.target.value)} min={0} />
                        </div>
                        <div>
                          <label className="axiom-label">r</label>
                          <input type="number" className="axiom-input" value={mathR} onChange={(e) => setMathR(+e.target.value)} min={0} />
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-sm text-white/60">
                        <input type="checkbox" checked={mathRep} onChange={(e) => setMathRep(e.target.checked)} className="accent-cyan" />
                        Allow repetition
                      </label>
                    </>
                  )}
                  {domain === "chemistry" && (
                    <>
                      <label className="axiom-label">Element symbol</label>
                      <input className="axiom-input" value={element} onChange={(e) => setElement(e.target.value)} placeholder="Fe, O, Na…" />
                    </>
                  )}
                  {domain === "physics" && (
                    <>
                      <label className="axiom-label">Fundamental frequency (Hz)</label>
                      <input type="number" className="axiom-input mb-2" value={frequency} onChange={(e) => setFrequency(+e.target.value)} min={1} />
                      <label className="axiom-label">Number of harmonics</label>
                      <input type="number" className="axiom-input" value={harmonics} onChange={(e) => setHarmonics(+e.target.value)} min={1} max={20} />
                    </>
                  )}
                </motion.div>
              </AnimatePresence>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <button onClick={handleDecompose} disabled={loading} className="axiom-btn-primary w-full flex items-center justify-center gap-2">
                {loading ? "Computing…" : <>Decompose <ChevronRight size={16} /></>}
              </button>
            </div>

            <ProgressPanel progress={progress} />
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-8 space-y-4">
            {result && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="axiom-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-cyan">Layer 1 — Exact Decomposition</h3>
                  <button onClick={copyJson} className="axiom-btn-secondary p-2 text-xs flex items-center gap-1">
                    {jsonCopied ? <Check size={12} /> : <Copy size={12} />}
                    JSON
                  </button>
                </div>
                <ResultVisualization result={result} />
              </motion.div>
            )}

            <NarrativePanel narrative={narrative} provider={provider} loading={narrativeLoading} />
          </div>
        </div>
      </main>

      <footer className="border-t border-white/5 mt-12 py-6 text-center text-xs text-white/30">
        <p>
          AXIOM · <a href="https://github.com/radhikatmosphere/axiom-stem" className="text-cyan/60 hover:text-cyan">radhikatmosphere/axiom-stem</a>
          {" · "}Narrative by SuperGrok · Part of RadhikaChain ecosystem
        </p>
      </footer>
    </div>
  );
}

function ResultVisualization({ result }: { result: DecomposeResult }) {
  switch (result.domain) {
    case "genetics":
      return <GeneticsViz result={result} />;
    case "math":
      return <MathViz result={result} />;
    case "chemistry":
      return <ChemistryViz result={result} />;
    case "physics":
      return <PhysicsViz result={result} />;
  }
}

function GeneticsViz({ result }: { result: GeneticsResult }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-white/60">
        {result.parent1} × {result.parent2} → Gametes: ({result.gametes1.join(", ")}) × ({result.gametes2.join(", ")})
      </p>
      <div className="overflow-x-auto">
        <table className="text-sm font-mono border-collapse">
          <thead>
            <tr>
              <td className="p-2" />
              {result.gametes2.map((g) => (
                <td key={g} className="p-2 text-center text-cyan border border-white/10 bg-cyan/5">{g}</td>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.punnettGrid.map((row, i) => (
              <tr key={i}>
                <td className="p-2 text-gold border border-white/10 bg-gold/5">{result.gametes1[i]}</td>
                {row.map((cell, j) => (
                  <td key={j} className="p-3 text-center border border-white/10 font-semibold">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-2">
        {Object.entries(result.genotypeProbabilities).map(([gt, pct]) => (
          <span key={gt} className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10">
            <strong className="text-cyan">{gt}</strong>: {pct}%
          </span>
        ))}
      </div>
    </div>
  );
}

function MathViz({ result }: { result: MathResult }) {
  return (
    <div className="space-y-3 font-mono text-sm">
      <p className="text-2xl font-bold text-cyan">{result.result}</p>
      <p className="text-white/60">{result.formula}</p>
      <ul className="space-y-1 text-white/50">
        {result.steps.map((s, i) => (
          <li key={i}>→ {s}</li>
        ))}
      </ul>
      {result.smallExample && (
        <div className="mt-3 p-3 bg-void/50 rounded-lg text-xs">
          <p className="text-white/40 mb-1">Example outcomes ({result.smallExample.outcomes.length}):</p>
          <p className="text-cyan">{result.smallExample.outcomes.join(", ")}</p>
        </div>
      )}
    </div>
  );
}

function ChemistryViz({ result }: { result: ChemistryResult }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold text-gold">{result.symbol}</span>
        <span className="text-white/40">Z = {result.atomicNumber}</span>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="p-3 bg-void/50 rounded-lg">
          <p className="text-xs text-white/40 mb-1">Full configuration</p>
          <p className="font-mono text-cyan">{result.fullConfig}</p>
        </div>
        <div className="p-3 bg-void/50 rounded-lg">
          <p className="text-xs text-white/40 mb-1">Noble gas notation</p>
          <p className="font-mono text-gold">{result.nobleGasConfig}</p>
        </div>
      </div>
      <p className="text-white/60">Valence electrons: <strong className="text-cyan">{result.valenceElectrons}</strong></p>
      <pre className="text-xs font-mono bg-void/50 p-3 rounded-lg overflow-x-auto text-white/70 whitespace-pre">{result.orbitalDiagram}</pre>
    </div>
  );
}

function PhysicsViz({ result }: { result: PhysicsResult }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-white/60">f₀ = {result.fundamentalFrequency} Hz · c = {result.speedOfSound} m/s</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-white/40 text-xs uppercase">
              <th className="text-left p-2">n</th>
              <th className="text-left p-2">Frequency</th>
              <th className="text-left p-2">Wavelength</th>
              <th className="text-left p-2">Note</th>
            </tr>
          </thead>
          <tbody>
            {result.harmonics.map((h) => (
              <tr key={h.harmonic} className="border-t border-white/5">
                <td className="p-2 font-mono text-gold">{h.harmonic}</td>
                <td className="p-2 font-mono text-cyan">{h.frequency} Hz</td>
                <td className="p-2 font-mono">{h.wavelength} m</td>
                <td className="p-2">{h.musicalNote}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}