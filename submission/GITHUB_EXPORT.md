# GitHub Export — radhikatmosphere/axiom-stem

## 1. Create Repository (GitHub UI)

1. Go to https://github.com/organizations/radhikatmosphere/repositories/new
2. **Name:** `axiom-stem`
3. **Visibility:** Public
4. **Do NOT** initialize with README, .gitignore, or license
5. Create repository

## 2. Push from Local

```bash
cd axiom-stem   # this folder

git init
git add .
git commit -m "feat: AXIOM AI — dual-engine STEM tutor (RadhikaChain ecosystem)

Built for DSH Hacks V1 + RADHIKATMOSPHERE.
Layer 1: Deterministic combinatorial engine (Punnett, combinatorics, electron config, harmonics)
Layer 2: Anthropic Claude narrative adapter + agent-core fallback
Gamification: XP, badges, Bhakti wallet integration"

git branch -M main
git remote add origin https://github.com/radhikatmosphere/axiom-stem.git
git push -u origin main
```

## 3. Repo Settings

- **Avatar:** Upload `public/axiom-logo.jpg` (square crop)
- **Topics:** `nextjs`, `typescript`, `stem-education`, `anthropic`, `edtech`, `gamification`, `radhikachain`, `hackathon`, `ai-tutor`
- **Website:** `https://axiom.radhikachain.xyz` (after deploy)
- **Description:** `Compute first. Explain second. Dual-engine STEM tutor — RadhikaChain ecosystem.`

## 4. Deploy (Vercel — fastest for hackathon)

```bash
npm i -g vercel
vercel --prod
# Add ANTHROPIC_API_KEY in Vercel dashboard → Settings → Environment Variables
```

## 5. Deploy (Cloudflare Pages)

```bash
chmod +x scripts/deploy.sh
# For static export, add output: 'export' to next.config.mjs first
./scripts/deploy.sh
```

DNS: CNAME `axiom` → `<project>.pages.dev` on radhikachain.xyz zone.