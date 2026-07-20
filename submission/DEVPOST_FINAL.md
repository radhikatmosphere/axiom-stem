# AXIOM — Devpost final copy

## Tagline

Compute first. Explain with citations. Verify every claim.

## Inspiration

Students need more than fluent answers: they need to see where an answer came from. AXIOM began with a simple question: what if an AI tutor had to show its computation before it could explain it?

## What it does

AXIOM is a verifiable STEM tutor. Its primary demo computes the genetics cross Aa × aa as an exact Punnett grid. The result is transformed into stable facts and calculation steps. OpenAI then writes an explanation for the chosen learner level and language, but only from that deterministic record.

Each explanation segment carries fact or step citations. A claim verifier checks citation IDs and flags uncited factual statements or unsupported numerical, percentage, unit, and formula claims. When OpenAI is unavailable, AXIOM returns a visibly labeled deterministic fallback instead of inventing a response.

Combinatorics is included as a second deterministic example.

## How we built it

- Next.js 15, React, TypeScript, and Tailwind CSS
- Deterministic TypeScript genetics and combinatorics engines
- Official OpenAI Node SDK with the Responses API and JSON schema output
- Manual schema validation and a provider interface for testability
- Offline-first test, benchmark, and evaluation scripts

## Why OpenAI

Deterministic code gives an exact result, but it cannot adapt an explanation to a learner’s level or language. OpenAI provides the narrative layer while the deterministic evidence contract remains the sole source of factual content.

## Verification

The checked-in local evaluation reports show 389/389 deterministic benchmark cases and 8/8 verifier adversarial fixtures passing on 2026-07-20. The reports include timestamps, environment notes, failures, and limitations. Live OpenAI evaluation is optional and skipped without credentials.

## Challenges

The main challenge was making “grounded” concrete rather than a prompt promise. AXIOM recomputes evidence on the server, validates structured model output, and exposes a claim-level verification result. Another challenge was preserving a useful experience without an API key; the app now has deterministic fallback narration with the same citation UI.

## What’s next

Add teacher-reviewed lesson templates, more deterministic domains with domain-expert fixtures, shared platform rate limiting, and an accessibility-tested classroom workflow. Sanskrit prosody remains a disabled experimental module until it has source-backed rules and expert-reviewed fixtures.

## Submission links

- Architecture: submission/ARCHITECTURE.md
- Demo script: submission/DEMO_SCRIPT_90_SECONDS.md
- Limitations: submission/LIMITATIONS.md
- Security and privacy: SECURITY.md

