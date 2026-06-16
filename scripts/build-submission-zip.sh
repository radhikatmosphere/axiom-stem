#!/usr/bin/env bash
# Build AXIOM_AI_DSH_Hacks_Submission.zip for DSH Hacks upload (max ~35 MB)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAGING="$ROOT/submission/zip-staging"
OUT="$ROOT/submission/AXIOM_AI_DSH_Hacks_Submission.zip"

rm -rf "$STAGING" "$OUT"
mkdir -p "$STAGING/Screenshots"

# Core docs
cp "$ROOT/README.md" "$STAGING/"
cp "$ROOT/submission/AXIOM_AI_Hackathon_Submission_Package.md" "$STAGING/"
cp "$ROOT/submission/Project_Reflection.md" "$STAGING/"
cp "$ROOT/submission/AXIOM_AI_Pitch_Deck.md" "$STAGING/"
cp "$ROOT/submission/PROJECT_DESCRIPTION.md" "$STAGING/"
cp "$ROOT/submission/DEVPOST_COPYPASTE.md" "$STAGING/"
cp "$ROOT/submission/A2A_RADHIKACHAIN.md" "$STAGING/"
cp "$ROOT/docs/SPLUNK_DASHBOARDS.md" "$STAGING/"

# Demo video
if [ -f "$ROOT/submission/AXIOM_DEMO_VIDEO.mp4" ]; then
  cp "$ROOT/submission/AXIOM_DEMO_VIDEO.mp4" "$STAGING/AXIOM_AI_Demo_Video.mp4"
fi

# Source tree (exclude heavy dirs)
rsync -a --exclude node_modules --exclude .next --exclude .vercel \
  --exclude submission/demo-tmp --exclude submission/zip-staging \
  --exclude submission/AXIOM_AI_DSH_Hacks_Submission.zip \
  "$ROOT/" "$STAGING/axiom-stem/"

cd "$STAGING"
zip -r "$OUT" . -x "*.git*" -x "axiom-stem/submission/demo-tmp/*"
echo "✓ Created $OUT ($(du -h "$OUT" | cut -f1))"