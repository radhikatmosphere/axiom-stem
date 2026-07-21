# AXIOM — Visual UI Demo Interaction Instructions

End-to-end script for driving the live chat UI at `http://localhost:3000/chat` for a judge-facing recording or live walkthrough. Each step lists the exact input, what the UI should render, and what the verifier badge should say. Pair with `submission/VOICEOVER_ENGLISH.md` for narration.

---

## Setup

1. In a terminal at the repo root:

   ```bash
   npm install
   npm run dev
   ```

2. Open `http://localhost:3000/chat` in Chrome at **1280×720** (OBS canvas target).
3. Optional: set `OPENAI_API_KEY` and `OPENAI_MODEL=gpt-5.6-sol` in `.env.local` to show the OpenAI narrative path. Without it, AXIOM shows the deterministic fallback — which is still a valid demo (green Verified badge, citations, evidence ledger).
4. Optional notebook verification: open `bench/axiom-ui-test.ipynb` in Jupyter and run top to bottom. It posts the same questions through the API and asserts the badge + result match the deterministic engine.

---

## Chat behavior matrix (what judges should see)

| Question | Expected `mode` | Badge | Bubble color |
|----------|-----------------|-------|--------------|
| `Aa × aa` | `deterministic_fallback` / `openai` | Verified | green |
| `C(10,3)` | `deterministic_fallback` / `openai` | Verified | green |
| free-text follow-up about last result | `interpretation` | Interpretation | amber (BookOpen) |
| off-topic #1 (same session) | `warning` | ShieldAlert | amber |
| off-topic #2 (same session) | `silent` | (no badge) | grey italic |
| forbidden medical / financial | `warning` | ShieldAlert | amber hard-refuse |
| STEM question after silent | `deterministic_fallback` / `openai` | Verified | green (resumes) |

---

## Step-by-step recording script (~90 s)

### Take 1 — Deterministic genetics (0:00–0:15)

- Click the `Aa × aa` example chip under the input bar (or type it).
- Press **Send**.
- **What to capture:** green `Verified` badge, Punnett grid (A×a header, a×a row), 4 genotype cells `Aa aa Aa aa`, probability chips `Aa: 50%` `aa: 50%`, citation chips `genetics.parents` / `genetics.grid` / `genetics.probability.Aa` after the summary sentence.
- Expand the **Evidence ledger** `<details>` — show the article cards with `id`, `label`, `statement`.

### Take 2 — Deterministic combinatorics (0:15–0:30)

- Type `C(10,3)` and send.
- **What to capture:** big cyan `120`, the formula box `10! / (3! · 7!)`, sample outcomes line, green `Verified` badge. This proves the engine handles two domains, not just genetics.

### Take 3 — Educational follow-up / Interpretation path (0:30–0:45)

- Type: `why is C(10,3) the same as C(10,7)?`
- **What to capture:** amber `Interpretation` badge with the BookOpen icon, header reads "Interpretation of last result". The summary and segments still carry citation chips, but the badge never becomes green Verified — this is the honest-tagging guarantee.
- If `OPENAI_API_KEY` is set, the footer line should read "OpenAI-generated narrative. Deterministic evidence remains the source of truth." Without the key it reads "Deterministic fallback — no OpenAI response was used."

### Take 4 — Off-topic guardrail, first warning (0:45–0:55)

- Type: `what is the price of bitcoin today?`
- **What to capture:** amber ShieldAlert bubble titled "Off-topic guardrail", body explains AXIOM only answers deterministic STEM + verifiable follow-ups. Footer note: "A second off-topic message is left unanswered. This interpretation is recorded in the audit trail for transparency."

### Take 5 — Off-topic guardrail, second offense goes silent (0:55–1:05)

- Type: `tell me a joke about cats`
- **What to capture:** grey italic bubble reading "AXIOM stayed on STEM and did not answer. Send `Aa × aa` or `C(10,3)` to resume." No badge, no evidence ledger. This is the state machine warning → silent transition.

### Take 6 — Forbidden topic hard-refusal (1:05–1:15)

- Open a **new incognito window** (fresh session).
- Type: `should I take ibuprofen for my chest pain?`
- **What to capture:** amber ShieldAlert bubble — AXIOM hard-refuses medical/financial/religious advice per the `FORBIDDEN_TOPICS` regex. Do **not** show the silent state here; a fresh session should always warn on a forbidden topic.

### Take 7 — Resume answering after silent (1:15–1:25)

- Back in the original session, type `P(5,2)`.
- **What to capture:** green `Verified` badge, result `20`, formula `5! / 3!`. This proves the guardrail is not a permanent lockout — a STEM question resets the session and AXIOM answers again.

### Take 8 — Audit trail (1:25–1:30)

- Click the footer link **/api/audit/recent** (or paste `http://localhost:3000/api/audit/recent?limit=20`).
- **What to capture:** JSON list of entries with `timestamp`, `mode` (`deterministic` / `warning` / `silent` / `interpretation`), and `questionHash` (FNV-1a hash by default — no raw PII). This is the verifiable-trail artifact judges care about.

---

## Screenshots to capture (static, for Devpost)

Save into `submission/Screenshots/` at PNG 1280×720:

1. `01-chat-genetics.png` — Take 1 Punnett bubble fully visible with evidence ledger open.
2. `02-chat-combinatorics.png` — Take 2 result `120` bubble.
3. `03-chat-interpretation.png` — Take 3 amber Interpretation bubble.
4. `04-chat-guardrail.png` — Take 4 + 5 side by side (warning stacked above silent).
5. `05-chat-audit.png` — Take 8 JSON audit viewer.
6. `06-chat-resume.png` — Take 7 resumed `P(5,2)` Verified bubble after the silent state.

---

## Verification checklist for judges

- [ ] No user login / account — session id is client-random (`Math.random`).
- [ ] Deterministic answers match `lib/decomposers.ts` (C(10,3) = 120, P(5,2) = 20, Aa×aa = 50/50).
- [ ] Green `Verified` badge only appears when `supportedClaims > 0` and `unsupportedClaims = 0`.
- [ ] Amber `Interpretation` badge never becomes green, even with valid citations — follow-ups are never Verified.
- [ ] Two off-topic messages in the same session: first warns, second is silent.
- [ ] Forbidden topic (medical/financial/religious) is refused immediately, not via the state machine.
- [ ] Audit JSONL at `logs/chat-trace.jsonl` (gitignored) records every decision; `/api/audit/recent` returns the last 200.
- [ ] Removing the API key does not break the app — deterministic fallback still renders a Verified bubble with citations.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| All answers show "Deterministic fallback" footer | Set `OPENAI_API_KEY` + `OPENAI_MODEL` in `.env.local`, restart `npm run dev`. |
| Interpretation bubble never appears | The follow-up requires a prior deterministic result in the same session — send `C(10,3)` first, then the free-text question. |
| Second off-topic does not go silent | The 30-min TTL may have expired, or you changed sessions. Use the same browser tab. |
| `/api/audit/recent` returns empty | At least one chat message must have been sent in the running server process. |
| Bubble footer shows a numeric warning | Engine warnings (e.g. invalid input normalization) surface in amber under the provider line — that is intentional, not a bug. |

For automated verification of every step above, run `bench/axiom-ui-test.ipynb` against the live dev server.
