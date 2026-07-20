# AXIOM — judging rubric map

This map uses common hackathon judging dimensions. Confirm the event’s official rules and eligibility requirements before submitting.

| Common judging dimension | AXIOM evidence |
|---|---|
| Problem and impact | README problem statement; the product makes source-vs-explanation visible for STEM learners. |
| Technical implementation | Deterministic engines, typed AxiomResult contract, server recomputation, official OpenAI SDK integration, and structured-output validation. |
| Use of OpenAI | OpenAI handles adaptive explanation only; OPENAI_API_KEY and OPENAI_MODEL stay server-side. |
| Trustworthiness | Stable evidence IDs, clickable citations, numerical/formula allowlist checks, and explicit Verified / Warnings / Could not verify states. |
| User experience | A single Compute → Explain → Verify flow; Aa × aa primary demo; keyboard-native controls and semantic tables/labels. |
| Reproducibility | npm test, npm run benchmark, npm run eval, JSON/Markdown reports with timestamps and limitations. |
| Responsible development | Deterministic fallback, input limits, timeout, no persistence of learner inputs, no clinical or financial advice, and a documented Chandas hold. |

## Human confirmation still required

- The project owner must confirm ownership/licensing of every submitted image, video, name, and repository asset.
- The project owner must confirm that the selected OPENAI_MODEL and API account satisfy the hackathon’s current rules.
- The project owner must replace screenshot TODOs and record a current demo if the hackathon requires media.
- The project owner must verify any external deployment URL at submission time; this repository does not claim a live deployment.

