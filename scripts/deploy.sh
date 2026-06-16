#!/usr/bin/env bash
# Deploy AXIOM to Cloudflare Pages or Vercel
set -euo pipefail

echo "→ Building AXIOM..."
npm run build

if command -v vercel &>/dev/null && [[ "${1:-}" == "--vercel" ]]; then
  echo "→ Deploying to Vercel..."
  vercel --prod
  exit 0
fi

echo "→ Deploying to Cloudflare Pages..."
npx wrangler pages deploy out --project-name=axiom-stem --branch=main

echo "✓ Done. Configure axiom.radhikachain.xyz in CF Pages → Custom domains"