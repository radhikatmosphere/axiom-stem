import { NextRequest, NextResponse } from "next/server";
import { getDemoNarrative } from "@/lib/demo-narratives";
import { logAxiomEvent } from "@/lib/splunk-hec";
import { chatSuperGrok } from "@/lib/supergrok";
import type { DecomposeResult, Domain, NarrativeResponse } from "@/types";

export const runtime = "edge";

const SYSTEM_PROMPT = `You are AXIOM's Narrative Adapter — Layer 2 of a dual-engine STEM tutor.
Your job: transform EXACT structured JSON from the deterministic Combinatorial Decomposer into vivid explanations for students aged 13–18.

RULES:
- NEVER recalculate or guess math — the JSON is already correct
- Use exciting hooks and real-world connections
- Simple vivid language with analogies (when helpful, compare to Chandas prosody: decompose a verse into pādas before reciting meaning)
- Include one Socratic question
- Include one "Try this yourself" micro-experiment
- Warm, empowering tone — never condescending
- Use markdown: **bold** for key terms, short paragraphs
- Keep response under 300 words`;

async function callSuperGrok(
  result: DecomposeResult,
  domain: Domain
): Promise<{ narrative: string | null; xaiError?: string; xaiStatus?: number }> {
  const key = process.env.XAI_API_KEY;
  if (!key) return { narrative: null, xaiError: "missing_api_key" };

  const grok = await chatSuperGrok(key, {
    system: SYSTEM_PROMPT,
    user: `Domain: ${domain}\n\nDecompose result (use exactly, do not recalculate):\n${JSON.stringify(result, null, 2)}`,
    maxTokens: 600,
    temperature: 0.7,
  });

  if (grok.ok) return { narrative: grok.content };
  return { narrative: null, xaiError: grok.error, xaiStatus: grok.status };
}

async function callAgentCore(result: DecomposeResult, domain: Domain): Promise<string | null> {
  const url = process.env.AGENT_CORE_URL;
  if (!url) return null;

  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/agent/educate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decomposeResult: result, domain, ageRange: "13-18" }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.narrative ?? null;
  } catch (e) {
    console.error("Agent-core error:", e);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  try {
    const body = await req.json();
    const result = body.result as DecomposeResult;
    const domain = body.domain as Domain;

    if (!result || !domain) {
      return NextResponse.json({ error: "Missing result or domain" }, { status: 400 });
    }

    let narrative: string | null = null;
    let provider: NarrativeResponse["provider"] = "demo";

    const superGrok = await callSuperGrok(result, domain);
    narrative = superGrok.narrative;
    if (narrative) {
      provider = "supergrok";
    } else {
      narrative = await callAgentCore(result, domain);
      if (narrative) provider = "agent-core";
    }

    if (!narrative) {
      narrative = getDemoNarrative(result, domain);
      provider = "demo";
    }

    logAxiomEvent({
      event: "narrative_generated",
      domain,
      severity: "info",
      metadata: {
        model: provider,
        provider,
        latency_ms: Date.now() - start,
        ...(superGrok.xaiError && provider !== "supergrok"
          ? { xai_error: superGrok.xaiError, ...(superGrok.xaiStatus ? { xai_status: superGrok.xaiStatus } : {}) }
          : {}),
      },
    });

    return NextResponse.json({ narrative, provider } satisfies NarrativeResponse);
  } catch (e) {
    console.error("Narrative route error:", e);
    logAxiomEvent({
      event: "error",
      severity: "error",
      metadata: { source: "narrative_route", message: String(e) },
    });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}