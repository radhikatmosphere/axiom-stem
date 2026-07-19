# DSH Hacks V1 — COPY-PASTE FOR DEVPOST

**Submit at:** https://dsh-hacks-v1.devpost.com/project-submissions/new

---

## Project Name
```
AXIOM AI — Dual-Engine Combinatoria
```

## Tagline / Short Description
```
Compute first. Explain second. Dual-engine STEM tutor: exact combinatorial math in TypeScript, then AI only for vivid explanations — never for guessing.
```

## About the Project (paste into the long description)

## Inspiration

Most AI tutors *guess*. They produce confident-sounding explanations of Punnett squares, combinations, electron configurations or harmonic series that are subtly (or completely) wrong. Students absorb the error and build fragile mental models.

AXIOM was born from a simple but radical inversion: **compute first, explain second**.

We looked back to the 2nd–3rd century BCE, to Piṅgala’s *Chandaḥśāstra* and the method of *prastāra* (systematic enumeration of metrical patterns). Long before modern combinatorics, Sanskrit prosodists decomposed complex structures into atomic units (*gaṇa*), marked boundaries (*yati*), and enumerated every valid possibility with absolute rigor. We asked: what if a modern STEM tutor did exactly the same?

The result is a dual-engine system that never approximates probabilities, never hallucinates electron configurations, and never invents combinatorial steps. It calculates the exact structure first, then hands a perfect JSON to a narrative layer that turns it into vivid, Socratic, age-appropriate explanations for students 13+.

Built in a high-pressure sprint for DSH Hacks V1 under the theme **AI × STEM Education**.

## What it does

AXIOM is a dual-engine STEM tutor:

**Layer 1 — Combinatorial Decomposer** (pure TypeScript, zero network calls, instant)  
Decomposes problems into atomic combinatorial units inspired by Chandas prosody and produces exact, machine-readable JSON. Supported domains:

- **Genetics** → full Punnett grid enumeration + genotype/phenotype percentages
- **Mathematics** → permutations and combinations with complete step-by-step expansion
- **Chemistry** → electron configurations via the Aufbau principle (full + noble-gas notation)
- **Physics** → harmonic series (frequencies + wavelengths from a fundamental)

**Layer 2 — Narrative Adapter** (SuperGrok / xAI or agent-core fallback)  
Takes the exact JSON and generates engaging, Socratic, story-driven explanations tailored for ages 13–18.

Additional features:
- Gamification (XP, badges, streaks)
- Google sign-in via Firebase + progress persistence in Cloudflare D1
- Optional Bhakti karma tier overlay from the RadhikaChain wallet
- Full observability (events shipped to Splunk)
- Demo mode that works even without API keys

Live demo: https://axiom-stem.pages.dev

## How we built it

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS + Framer Motion
- **Layer 1 engine**: Pure TypeScript combinatorial core (no external dependencies for the critical path)
- **Layer 2**: SuperGrok (xAI API) as primary narrative engine, with agent-core / Workers AI fallback
- **Backend & persistence**: Cloudflare Workers + D1
- **Auth**: Firebase Authentication (Google)
- **Observability**: Splunk HEC
- **Deployment**: Cloudflare Pages
- Built and deployed in a focused hackathon sprint

The architecture deliberately separates deterministic computation from probabilistic language generation so that the mathematical truth is never compromised by the LLM.

## Challenges we ran into

1. Designing a single combinatorial abstraction flexible enough for Punnett squares, C(n,r), Aufbau, and harmonic series without becoming a mess of special cases.
2. Keeping Layer 1 completely deterministic and offline-capable while still producing rich enough JSON for the narrative layer to sound natural.
3. Making the demo mode (no API keys) feel as polished as the full SuperGrok experience.
4. Balancing the philosophical depth of the Chandas / Piṅgala inspiration with a clean, modern UX that students actually want to use.
5. Shipping a production-ready dual-engine system under real time pressure.

## Accomplishments that we're proud of

- A working dual-engine system that *never* hallucinates the math — the core differentiator.
- Full end-to-end product (decompose → narrate → gamify → persist → observe).
- Clean mapping from ancient Sanskrit prosody (*prastāra*, *gaṇa*, *yati*) to modern STEM problems.
- Live production deployment on Cloudflare Pages with real Firebase auth and D1 persistence.
- Comprehensive documentation, demo video, and submission package.
- Seamless integration path into the larger RadhikaChain / A.L.I.C.E. sovereign education layer.

## What we learned

- Deterministic “compute-first” architecture is dramatically more trustworthy for STEM than pure LLM approaches.
- Ancient combinatorial methods (especially Piṅgala’s recursive enumeration / Meru-prastāra) map surprisingly cleanly onto modern educational domains.
- Students respond more strongly when they first see the exact structure and *then* receive the narrative.
- Having a high-quality demo mode is non-negotiable for reliability during judging.

## What's next for AXIOM AI — Dual-Engine Combinatoria

- Expand domain coverage (advanced genetics, stoichiometry, wave mechanics, discrete math).
- Deeper RadhikaChain integration: learning actions can generate verifiable Proof-of-Impact / Bhakti signals.
- Classroom mode + teacher dashboard.
- Multilingual narrative layer (starting with Spanish and English).
- Mobile-responsive progressive web app + offline Layer 1 capability.
- Open-source the combinatorial core as a standalone library.
- Pilot programs with schools and STEM clubs.
- Long-term vision: AXIOM becomes the education nervous system of the RadhikaChain / A.L.I.C.E. sovereign stack.

---

## Built With
```
Next.js
TypeScript
Tailwind CSS
Framer Motion
SuperGrok (xAI)
Cloudflare Pages
Cloudflare Workers
Cloudflare D1
Firebase
Splunk
RadhikaChain
Piṅgala / Meru-prastāra combinatorics
```

## Links
| Field | Value |
|-------|-------|
| **Project Website** | https://axiom-stem.pages.dev |
| **GitHub** | https://github.com/radhikatmosphere/axiom-stem |

## Demo Video
Upload: `submission/AXIOM_DEMO_VIDEO.mp4`
