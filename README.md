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

## License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE).

Copyright (c) 2026 [RADHIKATMOSPHERE](https://github.com/radhikatmosphere)

Built for **DSH Hacks V1** · AI × STEM Education