# AXIOM AI — DSH Hacks V1 Submission Package

**Compute First. Explain Second.**

| Field | Value |
|-------|-------|
| **Project** | AXIOM — Adaptive eXplanatory Intelligence via Orthogonal Modeling |
| **Type** | Educational AI / EdTech |
| **Build time** | ~5 hours (true hackathon sprint) |
| **Live demo** | https://axiom-stem.pages.dev |
| **GitHub** | https://github.com/radhikatmosphere/axiom-stem |
| **Ecosystem** | https://radhikachain.xyz |
| **License** | MIT |

---

## 1. Project Summary (for judges)

**AXIOM AI** is a dual-engine combinatorial STEM decomposer for students aged 13+.

### Core innovation

| Layer | Role | Technology |
|-------|------|------------|
| **Layer 1** | Deterministic Combinatorial Decomposer | Pure TypeScript — exact math, zero LLM guessing |
| **Layer 2** | Narrative Adapter | SuperGrok (xAI Grok 4.3) → agent-core → demo fallback |

**Philosophy:** Inspired by **Chandas** (Sanskrit prosody) and **Sragdharā** meter — decompose a majestic whole into 4 pādas of 21 syllables with gaṇa feet and Pingala *prastāra* enumeration. STEM problems get the same treatment: atomic units first, meaning second.

### Tech stack (current)

- Next.js **15** + TypeScript + Tailwind + Framer Motion
- SuperGrok via xAI API (`lib/supergrok.ts`)
- Cloudflare Pages production deploy
- Splunk HEC → index **`axiom`** + Dashboard Studio ([`docs/SPLUNK_DASHBOARDS.md`](../docs/SPLUNK_DASHBOARDS.md))
- RadhikaChain: agent-core `/agent/educate`, Bhakti API, D1 `axiom_progress`, Firebase auth

### Key strengths

- Four working STEM domains with rich visualizations
- Demo mode works **without API key**
- Correctness before engagement — opposite of most AI tutors
- Professional docs, demo video, Splunk observability
- RadhikaChain ecosystem + A2A-ready agent orchestration path

### Why it stands out

Most EdTech AI prioritizes engagement over accuracy. AXIOM **computes first**, then narrates verified JSON only. Pedagogically sound and architecturally rigorous.

---

## 2. Short version (Devpost quick paste)

**AXIOM AI** brings mathematical precision to STEM learning via a deterministic combinatorial decomposer (Vedic prosody inspiration) and a SuperGrok narrative layer for students 13+. Four domains, demo mode without keys, Splunk dashboards, RadhikaChain gamification. Built in a 5-hour sprint.

Full copy: [`DEVPOST_COPYPASTE.md`](DEVPOST_COPYPASTE.md)

---

## 3. Pitch deck

Markdown slides: [`AXIOM_AI_Pitch_Deck.md`](AXIOM_AI_Pitch_Deck.md)  
Export to PDF as `AXIOM_AI_Pitch_Deck.pdf` for upload.

---

## 4. Demo video

| Asset | Path |
|-------|------|
| **Recorded video** | `submission/AXIOM_DEMO_VIDEO.mp4` (~104s, real UI + voiceover) |
| **Script** | [`DEMO_VIDEO_SCRIPT.md`](DEMO_VIDEO_SCRIPT.md) |
| **Re-record** | `npm run demo:record` |

---

## 5. Project reflection

Full reflection: [`Project_Reflection.md`](Project_Reflection.md)

---

## 6. RadhikaChain A2A protocol

AXIOM fits the **Agent-to-Agent (A2A)** orchestration model — Layer 1 output becomes the immutable payload for Layer 2 delegation via agent-core.

Documentation: [`A2A_RADHIKACHAIN.md`](A2A_RADHIKACHAIN.md)

---

## 7. Submission ZIP contents

**Filename:** `AXIOM_AI_DSH_Hacks_Submission.zip` (max 35 MB)

| File / folder | Description | Priority |
|---------------|-------------|----------|
| `axiom-stem/` | Source (exclude `node_modules`, `.next`, `demo-tmp`) | Critical |
| `AXIOM_AI_Demo_Video.mp4` | Demo video | Critical |
| `AXIOM_AI_Pitch_Deck.pdf` | 8 slides (export from MD) | High |
| `Project_Reflection.md` | What it does / how built / challenges | High |
| `AXIOM_AI_Hackathon_Submission_Package.md` | This file | High |
| `Screenshots/` | 4 domain captures | Medium |
| `README.md` | Project README | Medium |

**Build zip:**

```bash
npm run submission:zip
```

---

## 8. Links checklist

- [x] Live URL: https://axiom-stem.pages.dev
- [x] GitHub: https://github.com/radhikatmosphere/axiom-stem
- [x] Demo video in `submission/`
- [ ] Pitch deck PDF exported
- [ ] Screenshots folder (optional)
- [ ] Devpost form submitted

---

*RADHIKATMOSPHERE · DSH Hacks V1 · June 2026*