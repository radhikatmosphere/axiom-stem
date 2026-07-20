# AXIOM architecture

## Runtime boundary

    Client component
      ├─ computeAxiom() for immediate, local deterministic feedback
      ├─ renders the Punnett grid / combinatorics result and evidence ledger
      └─ requests /api/narrative only after the learner chooses Generate explanation

    Node.js API route
      ├─ validates bounded input
      ├─ recomputes AxiomResult from input
      ├─ obtains OpenAI provider only when server env is configured
      ├─ validates structured JSON response
      ├─ verifies citations and numerical/formula tokens
      └─ returns NarrativeResult or cited deterministic fallback

## Core contracts

AxiomResult contains:

- domain and normalized input
- stable facts with IDs
- derivations and steps
- warnings and confidence rationale
- engine version
- a display payload for the exact grid or counting result

NarrativeResult contains:

- summary and summary citations
- explanation segments with citations
- follow-up questions
- unsupported claims
- a machine-readable VerificationReport
- provider and fallback reason

## Provider behavior

The OpenAI provider uses the official Node SDK and the Responses API with a strict JSON schema. It is server-only. The prompt supplies AxiomResult as the authoritative record, prohibits calculation or new facts, and requires citations.

If either required environment variable is absent, the provider is not created. The deterministic fallback is then generated from the same AxiomResult and verified before it is returned.

## Claim verifier

The verifier confirms that cited IDs are real facts or steps, identifies factual segments with no citations, and compares practical numerical, percentage, unit, and formula tokens to a deterministic allowlist. It reports verified, warnings, or could_not_verify; malformed model output is never reported as verified.

