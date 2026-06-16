# AXIOM — Adaptive eXplanatory Intelligence via Orthogonal Modeling

**Compute First. Explain Second.**

[![RadhikaChain](https://img.shields.io/badge/ecosystem-RadhikaChain-00F5D4)](https://radhikachain.xyz)
[![DSH Hacks V1](https://img.shields.io/badge/hackathon-DSH%20Hacks%20V1-F7B731)](https://dsh-hacks-v1.devpost.com/)
[![Anthropic](https://img.shields.io/badge/narrative-Anthropic%20Claude-7c3aed)](https://anthropic.com)

> Part of the **RADHIKATMOSPHERE** ecosystem · [`radhikatmosphere/axiom-stem`](https://github.com/radhikatmosphere/axiom-stem)

## The Problem

Most AI tutors **guess** their way through STEM math. Students get confident-sounding explanations that are subtly wrong — especially in genetics probabilities, combinatorics, electron configurations, and physics harmonics.

## The Solution: Dual-Engine Architecture

```
Layer 1 — Combinatorial Decomposer (TypeScript, zero network, instant)
    ↓ exact JSON
Layer 2 — Narrative Adapter (Anthropic Claude / agent-core / demo)
    ↓ vivid explanation for ages 13–18
Student understands structure FIRST, then meaning
```

Inspired by the Jyotish **Sragdharā** meter — decomposing complex forms into fundamental combinatorial building blocks.

## Domains

| Domain | Engine | Example |
|--------|--------|---------|
| Genetics | Punnett grid enumeration | `Aa × aa` → exact genotype % |
| Math | P(n,r) / C(n,r) with steps | `C(5,3) = 10` |
| Chemistry | Aufbau principle | `Fe` → full + noble-gas config |
| Physics | Harmonic series | `440 Hz` → frequencies + wavelengths |

## RadhikaChain Integration

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
# Optional: add ANTHROPIC_API_KEY (works without it via demo narratives)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | No | Layer 2 primary (Claude 3.5 Sonnet) |
| `AGENT_CORE_URL` | No | RadhikaChain agent-core fallback |
| `WALLET_API_URL` | No | Bhakti API (default: wallet.radhikachain.xyz) |

## Deploy

```bash
# Vercel (fastest for hackathon demo)
npm run build && npx vercel --prod

# Cloudflare Pages
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

Set `ANTHROPIC_API_KEY` in your hosting dashboard.

## Anthropic Attribution

Narrative Adapter powered by [**Anthropic Claude**](https://anthropic.com) via `@anthropic-ai/sdk`. This repository is owned by [**radhikatmosphere**](https://github.com/radhikatmosphere) — not Anthropic.

## Related Repos

- [radhika-chain](https://github.com/radhikatmosphere/radhika-chain) — L1 blockchain + Workers
- [radhikachain.xyz](https://radhikachain.xyz) — Ecosystem landing

## License

MIT · Built for DSH Hacks V1 with SuperGrok assistance