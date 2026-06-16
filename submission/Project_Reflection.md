# AXIOM & RadhikaChain — Project Reflection

*DSH Hacks V1 · June 2026 · RADHIKATMOSPHERE*

---

## What inspired us

Most AI tutors treat STEM like a guessing game: one model both computes and explains, so a single hallucination poisons the whole lesson. We were inspired by a much older pattern — **decompose structure before meaning**.

In Sanskrit **Chandas** (prosody), a verse in meter such as **Sragdharā** is not read as an opaque line of text. It is broken into **pādas** (feet), **gaṇas** (syllable-weight patterns), and enumerated via **Prastāra** — the Pingala meruprastāra that lists all $2^n$ rhythmic possibilities for $n$ syllable positions:

\[
\text{Saṅkhyā}(n) = 2^n
\]

Each row in the prastāra matrix is a binary pattern (Guru/Laghu, long/short). That is the same combinatorial spirit as Punnett grids, permutation counts, and orbital filling rules: **exact structure first, interpretation second**.

We mapped this to a dual-engine architecture:

\[
\underbrace{\text{Layer 1}}_{\text{deterministic}} \xrightarrow{\text{exact JSON}} \underbrace{\text{Layer 2}}_{\text{generative}}
\]

Layer 1 never asks an LLM to do arithmetic. Layer 2 never recalculates — it only narrates verified JSON for students aged 13–18.

The wider **RadhikaChain / A.L.I.C.E.** ecosystem added a second inspiration: **sovereign context**. Memory should belong to the user through **ContextToken** (ephemeral by design), not to a centralized model provider. Agents should coordinate through **A2A** (Agent-to-Agent) while humans and agents pay through rails that respect the same sovereignty — Stripe Issuing for cards, RadhikaChain L1 for value, Solana **O-PRANA** via the Omnivox bridge.

---

## What we learned

### 1. Orthogonal engines beat monolithic tutors

Separating compute from explanation is not just cleaner — it is **provably safer** for education. If Layer 1 outputs

\[
\text{Punnett}(A/a \times A/a) \Rightarrow \{AA, Aa, aa\} \text{ with ratio } 1:2:1
\]

then Layer 2's job is rhetorical, not mathematical. Narrative quality improves when the model is forbidden from "helpfully" redoing the math.

### 2. Ancient combinatorics is modern STEM

Pingala's prastāra algorithm (circa 200 BCE) is a sibling to today's enumeration problems. Implementing genetics, combinatorics, Aufbau chemistry, and harmonic series in pure TypeScript reinforced that **Vedic decomposition** and **STEM decomposition** share the same proof obligation: enumerate, then explain.

### 3. SuperGrok works when truth is pre-computed

We migrated Layer 2 from Anthropic Claude to **SuperGrok** (xAI Grok 4.3) on the edge. Grok excels at vivid, Socratic explanation when the prompt contains only verified JSON. The cascade

\[
\text{SuperGrok} \to \text{agent-core } /agent/educate \to \text{demo}
\]

keeps the app judge-safe without API keys.

### 4. Sovereign context is a protocol, not a prompt hack

**ContextToken v1.5** taught us that role + governance + technical + user contexts should serialize as a first-class artifact — hash-anchored on-chain, payload in KV, consumed by **Antigravity 2.0** (Gemini) as:

\[
\text{response} = f(\text{context\_token}, \text{system\_prompt}, \text{user\_message})
\]

**A2A** messages carry `context_token_id` so delegation stays auditable under Proof of Karma / Ahimsa governance.

### 5. Payments must distinguish humans and agents

Card issuing and payment intents need different metadata: humans get wallets and Apple Pay provisioning; agents get `agent_id`, `context_token_id`, and A2A dispatch. A single Express webhook is not enough — edge Workers with idempotent KV and multi-rail settlement (Radhika + Solana) are required.

---

## How we built it

### AXIOM (STEM tutor) — 5-hour sprint

| Phase | Deliverable |
|-------|-------------|
| Hour 1 | `lib/decomposers.ts` — 4 domains, zero network calls |
| Hour 2 | Cosmic UI, Punnett grids, orbital diagrams, harmonic tables |
| Hour 3 | `app/api/narrative/route.ts`, `lib/supergrok.ts`, demo narratives |
| Hour 4 | RadhikaChain XP/Bhakti, Firebase auth, agent-core educate |
| Hour 5 | Cloudflare Pages deploy, Splunk HEC (`axiom` index), demo video (~104s) |

**Stack:** Next.js 15, TypeScript, Tailwind, Framer Motion, xAI Grok API, Cloudflare Pages, Splunk Dashboard Studio, RadhikaChain Workers.

### Layer 1 — Combinatorial Decomposer

Four engines in `lib/decomposers.ts`:

- **Genetics** — Punnett enumeration
- **Combinatorics** — $P(n,r)$, $C(n,r)$ with steps
- **Chemistry** — Aufbau electron configurations
- **Physics** — harmonic series $f_n = n \cdot f_1$

All return typed JSON consumed by Layer 2 and visualized in `app/page.tsx`.

### Layer 2 — Narrative Adapter

```text
POST /api/narrative
  → SuperGrok (primary)
  → agent-core /agent/educate (SuperGrok → Bedrock → Workers AI)
  → demo narratives (offline)
```

Splunk events: `decompose`, `narrative_generated`, `auth_connect`, `error`.

### RadhikaChain integration

- Bhakti karma overlay via wallet API
- `axiom.worker.ts` + D1 `axiom_progress`
- A2A pattern documented in `submission/A2A_RADHIKACHAIN.md`

### Context Token + Antigravity (post-sprint)

- `agent-core/context-token.ts` — schema v1.5 (A.L.I.C.E.), compress/expand, system prompt builder
- `contracts/src/ContextToken.sol` — on-chain `payloadHash` + ownership (Foundry tests passing)
- `agent-core/antigravity.ts` — Gemini 2.5 Flash generative layer
- Endpoints: `/agent/context/serialize`, `/anchor`, `/antigravity`, `/a2a/dispatch`

### Omnivox payment rail (stellar-exoplanet integration)

- `omnivox-payment.worker.ts` — Cloudflare Worker
- Stripe Issuing: human + agent virtual cards
- Stripe webhooks → RadhikaChain `sendtoaddress`
- Solana queue → `mint_from_burn` (O-PRANA) via omnivox_bridge program

---

## Challenges we faced

### Edge deployment

Cloudflare Pages edge routes cannot use heavy Node SDKs. We replaced `@anthropic-ai/sdk` with fetch-based **SuperGrok** and fixed `nodejs_compat` in wrangler. TypeScript builds failed when `submission/zip-staging` was included — we excluded it from `tsconfig.json`.

### Never let Layer 2 recalculate

The hardest prompt-engineering rule: the narrative model must treat JSON as ground truth. We enforced this in system prompts, Splunk metadata (`xai_error` on fallback), and A2A `must_not_recalculate` constraints.

### Demo mode for judges

Hackathon demos cannot depend on secret API keys. Built-in demo narratives for all four domains let judges experience the full UX offline, with provider badge showing fallback tier.

### Cross-domain auth

Firebase Google sign-in on `axiom-stem.pages.dev` required authorized domains and verification via `radhikachain.xyz/api/auth/firebase`. CORS and cookie boundaries between Pages and Workers were non-trivial.

### Sovereign context at scale

Full JSON context tokens exceed on-chain gas limits. Solution: **hash on-chain, payload in KV** (Ephemeral by Design). Solana `mint_from_burn` requires an oracle signer — the Worker queues jobs; the oracle submits signed transactions.

### Stripe Issuing + multi-rail settlement

Express prototypes (`stripe-webhook.js`) lacked webhook signature verification and agent metadata. Production required a Hono Worker, KV idempotency, separate cardholder flows for `actor_type: human | agent`, and integration with Bridge.xyz / Solana rails from the monorepo `stripe_bridge.worker.ts`.

### Observability under pressure

Splunk HEC to index `axiom` had to be fire-and-forget from edge routes so telemetry never blocked student-facing latency.

---

## What’s next

- Fifth domain: population genetics
- Streaming narratives on Layer 2
- Live ContextToken on Polygon + classroom dashboards from Splunk
- Deploy Omnivox Solana program (replace placeholder program ID)
- Deeper Proof of Inquiry rewards for verified learning sessions ($\text{PRANA}$)

---

## Team & attribution

**RADHIKATMOSPHERE** — student hackathon project, part of the RadhikaChain conscious ecosystem.

- **Narrative provider:** SuperGrok / xAI Grok (not xAI-owned; project by [radhikatmosphere](https://github.com/radhikatmosphere))
- **Live app:** [axiom-stem.pages.dev](https://axiom-stem.pages.dev)
- **Repo:** [github.com/radhikatmosphere/axiom-stem](https://github.com/radhikatmosphere/axiom-stem) (MIT)

Built with **SuperGrok** (Grok Build sprint) · DSH Hacks V1 · June 2026