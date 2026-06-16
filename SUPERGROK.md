# How SuperGrok Built AXIOM (CLI Sprint)

## Timeline: ~5 hours

### Hour 1 — Architecture & Layer 1
- Defined dual-engine philosophy: compute first, explain second
- Implemented `lib/decomposers.ts` with 4 pure TypeScript engines
- Typed everything in `types/index.ts`

### Hour 2 — UI & Visualizations
- Next.js 14 App Router + Tailwind cosmic theme
- Domain cards, dynamic inputs, Punnett grid, orbital diagrams, harmonic tables
- Auto-narrative trigger on decompose

### Hour 3 — Layer 2 Narrative
- `app/api/narrative/route.ts` with Anthropic SDK
- Engineered system prompt for 13–18yo audience
- Demo fallback narratives in `lib/demo-narratives.ts`

### Hour 4 — RadhikaChain Integration
- Gamification: XP, badges, streaks (`lib/gamification.ts`)
- Wallet connect + Bhakti API
- agent-core `/agent/educate` endpoint
- `axiom.worker.ts` + D1 schema

### Hour 5 — Polish & Submission
- Logo generation, README, CHECKLIST
- DSH Hacks submission package
- Ecosystem links on radhikachain.xyz

## Key Design Decisions

1. **No shadcn/radix** — pure Tailwind for speed + premium feel
2. **Demo mode is first-class** — judges experience full vision without API keys
3. **JSON injection** — Claude never recalculates; only narrates exact structure
4. **Extensibility** — adding domain #5 is ~30 lines (decompose fn + UI branch)