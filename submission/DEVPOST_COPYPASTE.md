# DSH Hacks V1 — COPY-PASTE FOR DEVPOST (1 hour deadline)

**Submit at:** https://dsh-hacks-v1.devpost.com/project-submissions/new

---

## Project Name
```
AXIOM — Adaptive eXplanatory Intelligence via Orthogonal Modeling
```

## Tagline / Short Description
```
Compute first. Explain second. A dual-engine STEM tutor that computes exact math in TypeScript, then uses AI only to explain — never to guess.
```

## About the Project (paste into description)
```
## Inspiration
AI tutors sound confident but get STEM math wrong — wrong Punnett probabilities, wrong combinatorics, hallucinated electron configs. Students deserve truth before storytelling.

## What it does
AXIOM separates computation from communication:
• Layer 1 — Combinatorial Decomposer: pure TypeScript engines for genetics (Punnett grids), math (P/C), chemistry (Aufbau), physics (harmonics). Instant, exact, offline-capable.
• Layer 2 — Narrative Adapter: Anthropic Claude transforms the verified JSON into vivid explanations for ages 13–18 — hooks, analogies, Socratic questions, micro-experiments.

Integrated with RadhikaChain ecosystem: XP, badges, streaks, wallet Bhakti scores.

## How we built it
Next.js 14, TypeScript, Tailwind, Framer Motion. @anthropic-ai/sdk (edge fetch) for narratives. Demo fallback works without API keys. Deployed on Cloudflare Pages. agent-core fallback via RadhikaChain Workers.

## Challenges
Making Layer 2 never recalculate — only narrate injected JSON. Edge deployment with API routes on Cloudflare.

## Accomplishments
4 working STEM domains, 3-tier narrative fallback (Anthropic → agent-core → demo), gamification, production UI in one sprint.

## What we learned
AI excels at explanation when truth is pre-computed. Separating orthogonal concerns beats monolithic LLM tutoring.

## What's next
Phenotype mapping, PDF export, voice narration, 5th domain (population genetics), LoRA fine-tuning on student profiles.
```

## Built With (tags)
```
Next.js, TypeScript, Tailwind CSS, Anthropic Claude, Cloudflare Pages, Framer Motion, RadhikaChain
```

## Links to fill in AFTER deploy
| Field | Value |
|-------|-------|
| **Project Website** | **https://axiom-stem.pages.dev** ✅ LIVE |
| **GitHub** | `https://github.com/radhikatmosphere/axiom-stem` (push if not done) |

**Verified working:** Homepage 200 OK · `/api/narrative` returns demo narratives (no API key needed for judges)

## Demo Video (required, 2–3 min)
Record screen showing:
1. Open live URL
2. Genetics: Aa × aa → Decompose → narrative appears
3. Math: C(5,3) = 10
4. Show XP bar + badges
5. Say: "Compute first. Explain second."

Script: `submission/DEMO_VIDEO_SCRIPT.md`

## One-Page PDF (required)
1. Open `submission/PROJECT_DESCRIPTION.md`
2. Print to PDF or paste into Google Docs → Export PDF
3. Upload to Devpost

## Code PDF (alternative to GitHub)
If repo not public yet: `git archive` or print key files from `lib/decomposers.ts` + `app/api/narrative/route.ts`

---

## Judging angles (mention in video)
- **Idea:** Fixes AI tutor inaccuracy via dual-engine architecture
- **Implementation:** 4 domains, deterministic Layer 1, 3 narrative providers
- **Design:** Cosmic UI, responsive, auto-narrative UX
- **Presentation:** Live demo all 4 domains in under 3 min