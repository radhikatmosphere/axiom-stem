# AXIOM — Verifiable STEM Tutor

> **AXIOM computes STEM answers with deterministic code, then uses OpenAI to explain the verified result at the learner’s level.**

AXIOM is a small educational tutor built around a strict separation of responsibilities:

1. **Compute** — deterministic TypeScript enumerates a STEM result.
2. **Explain** — OpenAI turns only that evidence into age- and language-adapted prose.
3. **Verify** — AXIOM checks every cited fact/step ID and flags unsupported numerical, percentage, unit, and formula claims.

The primary demo is a single-gene genetics cross: **Aa × aa**. Combinatorics is the secondary example.

## Why this matters

A fluent explanation is not evidence that a calculation is right. In a conventional AI tutor, the same generative model may both calculate and explain, which makes it hard for a learner or teacher to distinguish a correct derivation from a plausible one.

AXIOM makes that boundary visible. The Punnett grid and facts appear before the explanation, every narrative segment links back to stable evidence IDs, and the verifier can return **Verified**, **Warnings**, or **Could not verify**.

## Architecture

    Browser
      │
      ├─ Compute locally: genetics or combinatorics (no network)
      │     └─ AxiomResult: facts, derivations, steps, warnings, engine version
      │
      └─ Generate explanation (optional)
            │
            ├─ Node API recomputes AxiomResult; it does not trust browser results
            ├─ OpenAI Responses API receives that result as the sole factual source
            ├─ Manual schema validation + claim verifier
            └─ Cited NarrativeResult, or a deterministic fallback if unavailable

## Why OpenAI is necessary

Deterministic code can enumerate a Punnett grid or evaluate a counting formula, but it does not adapt wording, examples, question prompts, or language to a learner. OpenAI is used for that communication task only. It receives a bounded deterministic record and is explicitly instructed not to recalculate or add facts.

When OpenAI is not configured or unavailable, AXIOM remains usable: it shows a deterministic, cited fallback explanation.

## Primary demo flow

1. Open the app and select **Genetics**.
2. Use **Aa** and **aa**, then choose **Compute deterministically**.
3. Inspect the exact 2×2 Punnett grid, percentages, and the evidence ledger.
4. Choose a learner level and language, then select **Generate explanation**.
5. Follow any citation chip back to its fact or step.
6. Read the verification badge and fallback indicator honestly.

The Combinatorics tab provides C(5,3) as a second deterministic example.

## Web chat

AXIOM also ships a chat interface at `/chat`. It accepts short deterministic STEM questions in natural-ish form and returns the same citable, verified result the main tutor produces:

- `Aa × aa` or "For a cross Aa x aa, calculate the distribution."
- `C(10,3)` or "How many combinations of 3 from 10?"
- `P(5,2)` for permutations.

The chat route (`app/api/chat/route.ts`) reuses the deterministic engine and the narrative/verifier pipeline, so the verification badge and evidence ledger are identical to the main app. Ambiguous questions are rejected with a clear prompt instead of an invented answer.

### Chat behaviour

AXIOM chat has three honest response modes — no LLM is allowed to calculate an answer, only to interpret one that already exists.

| Turn type | Example | Result | Badge | Audit |
|---|---|---|---|---|
| **Deterministic** | `Aa × aa` or `C(10,3)` | Exact grid/formula + cited narrative, same as `/` | green Verified (or deterministic fallback) | `decision: deterministic` |
| **Educational follow-up** | "why is Aa dominant?" (after a deterministic answer) | Free-text interpretation of the most recent deterministic record only; segment must still cite evidence IDs; no new numbers allowed | amber **Interpretation** tag — never Verified | `decision: educational_followup` |
| **Off-topic** | "what's the weather?" / medical / financial / religious | One warning reply that re-points to STEM; the second consecutive off-topic message returns no answer at all (silent) — the UI shows a grey "stayed on STEM" bubble | n/a | `decision: off_topic_warning` then `off_topic_silent` |

The classifier that decides which path is purely lexical (regex + IDs from the last deterministic result) — *the guardrail itself never uses a model*, because that would make it untrustworthy.

### Audit trail (for judges)

Every chat decision is written to a server-side JSONL file (`logs/chat-trace.jsonl`, never committed, never logged with full question text by default). A read-only viewer endpoint exposes the most recent decisions so judges can verify why AXIOM answered each way:

```
GET /api/audit/recent?limit=20
```

The viewer is rate-limited and sends `X-Robots-Tag: noindex`. To include the raw user question in the audit (for debugging), start the server with `AXIOM_AUDIT_FULL=1`. By default only a short FNV-1a hash and length are stored.

## Optional Azure AI Foundry narrative provider

AXIOM’s explanatory layer can optionally call an Azure AI Foundry agent instead of (or in addition to) the OpenAI Responses provider. Set all three variables to enable it:

| Variable | Required | Purpose |
|---|---:|---|
| AZURE_AI_PROJECT_ENDPOINT | No | Azure AI Foundry project endpoint for the agent reference. |
| AZURE_AI_AGENT_NAME | No | Foundry agent name (e.g. `axiom-ai`). |
| AZURE_AI_AGENT_VERSION | No | Foundry agent version (e.g. `2`). |

Credentials come from `DefaultAzureCredential` (never the browser). If these are unset, AXIOM keeps using OpenAI when available and otherwise the deterministic fallback. The agent must honor AXIOM’s output contract (cited segments + verification status); malformed output falls back to the deterministic narrative.

## Local setup

Install dependencies with the lockfile:

    npm install

Copy the template if you want live OpenAI narration:

    cp .env.example .env.local

Run the app:

    npm run dev

Open http://localhost:3000.

### Environment variables

| Variable | Required | Purpose |
|---|---:|---|
| OPENAI_API_KEY | No | Server-only OpenAI credential for generated narration. |
| OPENAI_MODEL | No | A valid model ID available to your OpenAI account. No default model is assumed. |

Set both variables to enable OpenAI narration. Do not use NEXT_PUBLIC_ for either value and do not commit .env.local.

The API route requires a Node.js-capable Next.js deployment. Static-only hosting cannot serve the server-side OpenAI endpoint without a separate backend.

## Validation and evaluation

    npm run typecheck
    npm run lint
    npm test
    npm run benchmark
    npm run eval
    npm run build

The checked-in latest reports are [benchmark results](reports/BENCHMARK_LATEST.md) and [verification evaluation](reports/EVALUATION_LATEST.md).

Actual local run recorded on 2026-07-20:

- Deterministic benchmark: **389/389** cases passed, including exhaustive safe-range genetics invariants and independent BigInt combinatorics references.
- Verifier evaluation: **8/8** adversarial fixtures passed.
- Network evaluation: skipped because it is opt-in and requires both OpenAI variables plus OPENAI_EVAL=1.

Local latency is reported separately from network latency in the benchmark JSON. It is machine-specific and should not be treated as a production latency claim.

## Limitations

- Genetics currently models a single gene with two allele slots; it is not a substitute for genetic counseling or a representation of complex inheritance.
- The verifier is a claim-level guardrail, not a proof that all natural-language assertions are true.
- Only genetics and combinatorics are in the primary product flow. Chemistry and physics helpers remain outside this submitted demo path.
- Sanskrit prosody is disabled until source-backed rules, licensed fixtures, and expert validation exist. See [the experimental design note](docs/CHANDAS_EXPERIMENT.md).
- OpenAI output can fail or time out; AXIOM will visibly fall back rather than pretending an AI explanation was generated.

## Security and privacy

See [SECURITY.md](SECURITY.md) for data flow, controls, and remaining risks. AXIOM does not persist learner accounts or inputs in this submission app.

## Screenshots

**TODO before final Devpost upload:** capture the current 1280×720 Genetics compute, cited explanation, fallback, and Combinatorics screens. The required placeholder list is in [submission/Screenshots/README.md](submission/Screenshots/README.md).

## Submission materials

- [Devpost-ready copy](submission/DEVPOST_FINAL.md)
- [90-second demo script](submission/DEMO_SCRIPT_90_SECONDS.md)
- [Judging rubric map](submission/JUDGING_RUBRIC_MAP.md)
- [Submission architecture](submission/ARCHITECTURE.md)
- [Submission limitations](submission/LIMITATIONS.md)

## Attribution

AXIOM uses Next.js, React, TypeScript, Tailwind CSS, and the official OpenAI Node SDK listed in package.json. Deterministic computations and validation fixtures are implemented in this repository. No performance, model, or academic claims are made beyond the code and reports included here.

## License

MIT. See [LICENSE](LICENSE).

