import { NextRequest, NextResponse } from "next/server";
import { getDemoNarrative } from "@/lib/demo-narratives";
import type { DecomposeResult, Domain, NarrativeResponse } from "@/types";

export const runtime = "edge";

const SYSTEM_PROMPT = `You are AXIOM's Narrative Adapter — Layer 2 of a dual-engine STEM tutor.
Your job: transform EXACT structured JSON from the deterministic Combinatorial Decomposer into vivid explanations for students aged 13–18.

RULES:
- NEVER recalculate or guess math — the JSON is already correct
- Use exciting hooks and real-world connections
- Simple vivid language with analogies
- Include one Socratic question
- Include one "Try this yourself" micro-experiment
- Warm, empowering tone — never condescending
- Use markdown: **bold** for key terms, short paragraphs
- Keep response under 300 words`;

async function callAnthropic(result: DecomposeResult, domain: Domain): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Domain: ${domain}\n\nDecompose result (use exactly, do not recalculate):\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const block = data.content?.[0];
    if (block?.type === "text") return block.text;
    return null;
  } catch (e) {
    console.error("Anthropic error:", e);
    return null;
  }
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
  try {
    const body = await req.json();
    const result = body.result as DecomposeResult;
    const domain = body.domain as Domain;

    if (!result || !domain) {
      return NextResponse.json({ error: "Missing result or domain" }, { status: 400 });
    }

    let narrative: string | null = null;
    let provider: NarrativeResponse["provider"] = "demo";

    narrative = await callAnthropic(result, domain);
    if (narrative) {
      provider = "anthropic";
    } else {
      narrative = await callAgentCore(result, domain);
      if (narrative) provider = "agent-core";
    }

    if (!narrative) {
      narrative = getDemoNarrative(result, domain);
      provider = "demo";
    }

    return NextResponse.json({ narrative, provider } satisfies NarrativeResponse);
  } catch (e) {
    console.error("Narrative route error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}