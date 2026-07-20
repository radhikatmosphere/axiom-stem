# AXIOM — Adaptive eXplanatory Intelligence via Orthogonal Modeling

**Compute First. Explain Second.**

[![Live Demo](https://img.shields.io/badge/demo-live-00F5D4)](https://axiom-stem.pages.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-F7B731.svg)](LICENSE)
[![DSH Hacks V1](https://img.shields.io/badge/hackathon-DSH%20Hacks%20V1-blue)](https://dsh-hacks-v1.devpost.com/)
[![RadhikaChain](https://img.shields.io/badge/ecosystem-RadhikaChain-00dddd)](https://radhikachain.xyz)
[![SuperGrok](https://img.shields.io/badge/narrative-SuperGrok%20Grok-7c3aed)](https://x.ai)

> Part of the **RADHIKATMOSPHERE** ecosystem · [`radhikatmosphere/axiom-stem`](https://github.com/radhikatmosphere/axiom-stem)

## The Problem

Most AI tutors **guess** their way through STEM math. Students get confident-sounding explanations that are subtly wrong — especially in genetics probabilities, combinatorics, electron configurations, and physics harmonics.

## The Solution: Dual-Engine Architecture

```
Layer 1 — Combinatorial Decomposer (TypeScript, zero network, instant)
    ↓ exact JSON
Layer 2 — Narrative Adapter (SuperGrok / agent-core / demo)
    ↓ vivid explanation for ages 13–18
Student understands structure FIRST, then meaning
```

## Chandas Inspiration

Layer 1 follows the **Chandas** (Sanskrit prosody) method — especially **Sragdharā** (4 pādas × 21 syllables, gaṇa feet, yati caesuras). Pingala's *prastāra* enumerated valid rhythmic patterns centuries before modern combinatorics; AXIOM does the same for STEM: decompose into atomic units, enumerate exactly, then narrate meaning.

| Chandas | AXIOM Layer 1 |
|---------|---------------|
| Stanza / pādas | STEM domains |
| Gaṇa (L/G syllables) | Combinatorial atoms (alleles, C(n,r) steps) |
| Yati (caesura) | Step boundaries in output |
| Prastāra | Punnett grids, formula expansion |

## Domains

| Domain | Engine | Example |
|--------|--------|---------|
| Genetics | Punnett grid enumeration | `Aa × aa` → exact genotype % |
| Math | P(n,r) / C(n,r) with steps | `C(5,3) = 10` |
| Chemistry | Aufbau principle | `Fe` → full + noble-gas config |
| Physics | Harmonic series | `440 Hz` → frequencies + wavelengths |

## Ecosystem Plan

AXIOM is the **education-layer application** in the [RadhikaChain ecosystem](https://radhikachain.xyz). Full architecture and whitepaper: [WHITEPAPER.md §9.5](../WHITEPAPER.md) (parent `radhika-chain` repo).

| Surface | URL | Role |
|---------|-----|------|
| **This app (live)** | https://axiom-stem.pages.dev | Layer 1 decompose + Layer 2 narrative |
| Custom domain (planned) | https://axiom.radhikachain.xyz | DNS alias (pending) |
| Ecosystem landing | https://radhikachain.xyz | Install, Firebase auth hub |
| Wallet / Bhakti | https://wallet.radhikachain.xyz | Karma tier overlay |
| Hello-OS | https://radhika-os.pages.dev | OS-level ecosystem entry |

**Data flow:** Decompose (Layer 1) → Narrative (Layer 2) → Award XP → Optional Bhakti lookup → Persist to D1 `axiom_progress` via `axiom.worker`.

**Auth:** Google sign-in via Firebase (`radhikatmosphere` project), token verified at `https://radhikachain.xyz/api/auth/firebase`. Setup: [`docs/FIREBASE_AUTH.md`](docs/FIREBASE_AUTH.md).

**Integration points:**
- **Bhakti scores** — wallet link shows ecosystem karma tier
- **XP / badges / streaks** — Octalysis-aligned White Hat gamification
- **agent-core** — `/agent/educate` fallback narrative routing via Bedrock/Workers AI
- **D1 `axiom_progress`** — persistent progress in `radhika-metadata` database

## Quick Start

```bash
git clone https://github.com/radhikatmosphere/axiom-stem.git
cd axiom-stem
npm install
cp .env.example .env.local
# Optional: add XAI_API_KEY (works without it via demo narratives)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `XAI_API_KEY` | No | Layer 2 primary (SuperGrok / Grok 4.3) |
| `AGENT_CORE_URL` | No | RadhikaChain agent-core fallback |
| `SPLUNK_HEC_URL` + `SPLUNK_HEC_TOKEN` | No | Splunk index `axiom` — see [`docs/SPLUNK_DASHBOARDS.md`](docs/SPLUNK_DASHBOARDS.md) |
| `WALLET_API_URL` | No | Bhakti API (default: wallet.radhikachain.xyz) |

## Deploy

```bash
# Cloudflare Pages (verified production path)
npm run pages:deploy

# Vercel (optional alternative)
npm run build && npx vercel --prod
```

Set `XAI_API_KEY` and Splunk vars in your hosting dashboard.

## Observability (Splunk)

Events (`decompose`, `narrative_generated`, `auth_connect`, `error`) ship to Splunk index **`axiom`**. Full Dashboard Studio guide with SPL panels: [**docs/SPLUNK_DASHBOARDS.md**](docs/SPLUNK_DASHBOARDS.md).

## SuperGrok Attribution

Narrative Adapter powered by [**SuperGrok (xAI Grok)**](https://x.ai) via the xAI API. Owned by [**radhikatmosphere**](https://github.com/radhikatmosphere).

## AI Tooling — How Codex & GPT-5.6 Were Used

This project was built with the active assistance of two frontier coding models, used for distinct roles:

- **OpenAI Codex (cloud coding agent)** — Used as the primary implementation agent for the deterministic Layer 1 engine and project scaffolding. Codex wrote and iterated on `lib/decomposers.ts` (Punnett-grid genetics, `P(n,r)`/`C(n,r)` combinatorics, Aufbau chemistry, harmonic-series physics), generated the `tests/decomposers.test.mjs` esbuild-bundled test harness, the `bench/` probe scripts, and this repo's `AGENTS.md` conventions. Session references (all from `~/.codex/sessions/2026/07/19/`):
  - **`019f7d24-6a15-7f02-8eee-67b72267dfe2`** — 19:29, 269 KB — finalization pass for this submission
  - `019f7cef-7eea-75f0-a8aa-272f43850578` — 18:31, 580 KB — initial scaffold + repo conventions
  - `019f7cf1-0dad-7523-bc67-1604f9be196b` — 18:33, 54 KB — first Layer 1 pass
  - `019f7cf0-44fd-7743-8c46-8c36a97cd6a6` — 18:32, 53 KB — Layer 1 stub

- **GPT-5.6** — Used for narrative-design, copywriting, and Devpost/submission packaging: the Layer 2 explanation copy, `submission/DEVPOST_COPYPASTE.md`, `PROJECT_DESCRIPTION.md`, pitch deck, the demo video script (`submission/DEMO_VIDEO_SCRIPT.md`) and Spanish *guión* (`submission/DEMO_GUION.md`), the Chandas/Pingala framing that links Sanskrit prosody to combinatorial decomposition, and the interactive Colab walkthrough notebook [`notebooks/AXIOM_Demo_Codex_GPT56.ipynb`](notebooks/AXIOM_Demo_Codex_GPT56.ipynb) — which mirrors this README section and lets you run Layer 1 live in Colab without spinning up Node.

Division of labor: **Codex = code & tests (Layer 1 determinism)**, **GPT-5.6 = prose, narrative, and submission story (Layer 2 + hackathon docs)**. Both outputs were human-reviewed and committed through version control.

A complete walkthrough — including the four Codex session IDs, the file-by-file map of who wrote what, and live Layer 1 outputs from Python — lives in the notebook above.

## Related Repos

| Repo | GitHub | Contents |
|------|--------|----------|
| **axiom-stem** | https://github.com/radhikatmosphere/axiom-stem | This app — Next.js 15 STEM tutor (MIT) |
| **radhika-chain** | https://github.com/radhikatmosphere/radhika-chain | L1 blockchain, Workers, agent-core, whitepaper |

## Hackathon Submission (DSH Hacks V1)

| Item | Link |
|------|------|
| **Live demo** | https://axiom-stem.pages.dev |
| **Demo video** | [`submission/AXIOM_DEMO_VIDEO.mp4`](submission/AXIOM_DEMO_VIDEO.mp4) — real UI + natural voiceover |
| **Re-record video** | `npm run demo:record` |
| **Devpost** | https://dsh-hacks-v1.devpost.com/ |
| **Submission docs** | [`submission/`](submission/) |
| **One-pager** | [`submission/PROJECT_DESCRIPTION.md`](submission/PROJECT_DESCRIPTION.md) |
| **Demo script** | [`submission/DEMO_VIDEO_SCRIPT.md`](submission/DEMO_VIDEO_SCRIPT.md) |
| **Demo guion (ES)** | [`submission/DEMO_GUION.md`](submission/DEMO_GUION.md) |
| **Colab walkthrough** | [`notebooks/AXIOM_Demo_Codex_GPT56.ipynb`](notebooks/AXIOM_Demo_Codex_GPT56.ipynb) |

## License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE).

Copyright (c) 2026 [RADHIKATMOSPHERE](https://github.com/radhikatmosphere)

Built for **DSH Hacks V1** · AI × STEM Education