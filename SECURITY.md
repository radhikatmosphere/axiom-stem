# Security and privacy

AXIOM is a learning demo, not a system for sensitive, clinical, financial, or identity-bearing decisions. It does not claim perfect security.

## Data flow

    Browser
      ├─ deterministic genetics/combinatorics calculation (local, no network)
      └─ POST /api/narrative (only when “Generate explanation” is chosen)
           ├─ server recomputes the deterministic AXIOM result
           ├─ optional OpenAI Responses API request using server-only credentials
           └─ cited narrative or deterministic fallback returned to browser

The browser does not receive OPENAI_API_KEY. AXIOM does not persist learner accounts, inputs, prompts, or narratives in application storage. Standard deployment, hosting, and OpenAI service logs may still exist under their respective providers' policies.

## Controls implemented

- OPENAI_API_KEY and OPENAI_MODEL are read only by the Node.js API route.
- The endpoint accepts only bounded genetics or combinatorics fields and recomputes the evidence server-side; it never trusts a browser-provided result.
- Request bodies are capped at 12 KB and the route applies a basic per-process 15-request/minute window.
- OpenAI calls use a 10-second SDK timeout and no retries. If unavailable, AXIOM returns a deterministic cited fallback.
- Structured model output is manually schema-validated before use.
- The verifier checks cited fact/step IDs, uncited factual segments, and practical numerical/formula/unit token allowlists.
- React renders all narrative text as text; no raw HTML injection API is used.
- The app avoids logging request bodies, provider errors, credentials, or full learner input.
- Unrelated third-party integration paths were removed from the submission app.

## Remaining risks and limits

- The in-memory request limiter is best-effort and resets across serverless instances; production should use platform rate limiting or a shared store.
- Token matching is a practical guardrail, not a complete natural-language fact checker.
- An OpenAI response can be unavailable, delayed, or rejected; fallback mode is intentional.
- Deployments should set HTTPS, platform secret management, access logging, dependency scanning, and an appropriate data-retention policy.

## Reporting

Do not include keys or learner data in bug reports. Report a suspected security issue privately to the repository maintainer listed in package.json.

