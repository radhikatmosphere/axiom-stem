# AXIOM STEM — Devpost Demo Script

## 0:00 — Cold open (5 s)

**On screen**: `AXIOM — Adaptive eXplanatory Intelligence via Orthogonal Modeling` rolling in over a dim field of glowing Sanskrit-style syllable tokens.
**Voice (you, over the title card)**: *"Most AI tutors guess. AXIOM decomposes."*

---

## 0:05 — The problem (20 s)

**On screen**: A mock "AI tutor" chat bubble giving the wrong Punnett probability — *"Aa × aa → 50% AA, 50% aa"*. A red **WRONG** stamp slams over it.

**Voice**:
> "If you ask a regular chatbot 'what are the odds when you cross Aa with aa?', it sounds confident and it gives you 50/50 — but it splits the wrong genotype. Students get a wrong answer in fluent English and never know it's wrong.
>
> AXIOM splits the work in two. Layer 1 — a tiny, deterministic TypeScript engine — does the actual math. Zero network, zero hallucination. Layer 2 — a language model — only narrates the answer Layer 1 already computed."

---

## 0:25 — Architecture diagram (15 s)

**On screen**: An animated split diagram.

```
Layer 1 — Combinatorial Decomposer (TS, pure, instant)
    ↓ exact JSON
Layer 2 — Narrative Adapter (SuperGrok / agent-core)
    ↓ vivid, age-appropriate explanation
Student
```

**Voice**:
> "Layer 1 is built around the same idea Piṅgala used for Sanskrit prosody 2,200 years ago: break the input into atomic units, enumerate every legal combination exactly, then hand the result up. Genetics → Punnett grids. Math → C(n,r) and P(n,r). Chemistry → Aufbau. Physics → harmonic series."

---

## 0:40 — What I built (live demo, 60 s)

**On screen**: The AXIOM web app at `axiom-stem.pages.dev`. You type three queries:

1. **Genetics**: Aa × aa → result panel shows a 2×2 Punnett grid and the **exact 50% / 50%** split between `Aa` and `aa`.
2. **Combinatorics**: "C(5,3)" → result panel shows **10**, with the step-by-step expansion `5! / (3! × 2!)`.
3. **Chemistry**: "Fe" → result panel shows `[Ar] 4s² 3d⁶`, valence electrons = **8**.

**Voice**:
> "Each tile shows the same thing your teacher would write on the board — except you got it from a deterministic engine, not a probability sampler. The pie chart, the grid, the superscripts… all driven from JSON Layer 1 produced. Layer 2 then writes the friendly explanation underneath."

---

## 1:40 — How I built it (the AI tooling section)

**On screen**: Two halves of the screen.

```
┌─────────────────────────────┬─────────────────────────────┐
│  OpenAI Codex (cloud agent) │  GPT-5.6 (narrative + docs)   │
└─────────────────────────────┴─────────────────────────────┘
```

**Voice**:
> "Two frontier models built this thing, each with a clear lane."

---

## 1:55 — Codex's lane (35 s)

**On screen**: Side-by-side code blocks with line numbers highlighted, anchored to `lib/decomposers.ts` and `tests/decomposers.test.mjs`.

**Voice**:
> "Codex — the cloud coding agent — wrote the deterministic core. Every combinatorial atom in Layer 1 is its code: the Punnett enumeration, the binomial / factorial handlers, the Aufbau orbital walker, the harmonic-series generator. It also wrote the esbuild-bundled test harness — `node tests/decomposers.test.mjs` runs 13 assertions covering genetics, math, chemistry, and physics. It generated the `bench/` performance probes and the `AGENTS.md` repo conventions.
>
> One Codex session in particular — session `019f7d24-6a15-7f02-8eee-67b72267dfe2` — was the active one for the finalization pass that wired everything together for this submission. Three prior sessions on the same day scaffolded the project, ran the demos, and iterated on the routing."

**On screen (overlay badge)**: `Codex session: 019f7d24-6a15-7f02-8eee-67b72267dfe2`

---

## 2:30 — GPT-5.6's lane (30 s)

**On screen**: A montage of the docs — `submission/DEVPOST_COPYPASTE.md`, `submission/PROJECT_DESCRIPTION.md`, the **Chandas ↔ AXIOM** table from the README, and the preview pane of the demo.

**Voice**:
> "GPT-5.6 owned the prose. The Layer 1 narrations you see on the tiles — the 'think of Aa as a coin flip per allele' style — that copy came from GPT-5.6. The Devpost description, the pitch deck, the Chandas framing that ties Piṅgala's prastāra to algorithm correctness, the demo-video script you're reading right now: all GPT-5.6.
>
> The architectural decision to use Sanskrit prosody as a model for the dual-engine split was GPT-5.6's too. It put the word *prastāra* — 'full enumeration' — next to *yati* — 'caesura' — next to gaṇa — 'metrical foot' — and that became the table that explains why AXIOM works."

---

## 3:00 — Division of labor (15 s)

**On screen**: A 2×2 matrix.

|  | **Codex** | **GPT-5.6** |
|---|-----------|-------------|
| **Determinism** | ✅ Layer 1 (lib/decomposers.ts, tests) | — |
| **Narrative** | — | ✅ Layer 2 explanation copy |
| **Tests** | ✅ esbuild harness, 13 assertions | — |
| **Submission prose** | — | ✅ Devpost, deck, description |
| **Architecture framing** | helpers/models | ✅ Chandas ↔ AXIOM |
| **Demo video script** | — | ✅ (this script) |

**Voice**:
> "Codex = code and tests. GPT-5.6 = prose, narrative, and the submission story. Both outputs were human-reviewed. Every commit is in version control."

---

## 3:15 — Stack and ecosystem (20 s)

**On screen**: A flat diagram.

- AXIOM (Next.js 15 on Cloudflare Pages) → `axiom-stem.pages.dev`
- RadhikaChain L1 + DharmaGate → `radhikachain.xyz`
- agent-core, Splunk HEC, Firebase auth, Bhakti karma API.

**Voice**:
> "AXIOM is the education-layer app in a larger sovereign infrastructure — RadhikaChain, an L1 blockchain plus a Cloudflare-edge agent platform. Progress events ship to Splunk index `axiom`. Bhakti wallet confidence can show on each tile. Firebase Google auth wires the user identity. Everything I'm demoing tonight is real production infrastructure."

---

## 3:35 — Closing (15 s)

**On screen**: `axiom-stem.pages.dev` pulled up full-screen, all three demo tiles glowing with computed answers, the Layer 2 narration underneath.

**Voice**:
> "Compute first. Explain second. That's AXIOM.
>
> Live at axiom-stem.pages.dev. Open source MIT. Built with Codex and GPT-5.6. Thank you."

**On screen (end card)**: Repo URL · Live URL · License · "DSH Hacks V1 · AI × STEM Education"

---

## Total runtime: ~3:50

## Footnotes / credits

- **Layer 1 engine**: `lib/decomposers.ts` written with OpenAI Codex (session `019f7d24-6a15-7f02-8eee-67b72267dfe2`)
- **Test harness**: `tests/decomposers.test.mjs` — 13 assertions, all pass.
- **Narrative copy & submission docs**: GPT-5.6
- **Deployment**: Cloudflare Pages (`npm run pages:deploy`)
- **Repo**: https://github.com/radhikatmosphere/axiom-stem
- **Live**: https://axiom-stem.pages.dev
- **Hackathon**: https://dsh-hacks-v1.devpost.com/
