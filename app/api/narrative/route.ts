import { NextRequest, NextResponse } from "next/server";
import { computeAxiom, parseAxiomInput } from "@/lib/axiom-result";
import { generateNarrative, type LearnerProfile } from "@/lib/narrative-service";
import { getOpenAiNarrativeProviderFromEnv } from "@/lib/openai-narrative-provider";
import { getFoundryNarrativeProviderFromEnv } from "@/lib/foundry-narrative-provider";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 12_000;
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 15;
const requestWindows = new Map<string, { startedAt: number; count: number }>();

function isRateLimited(request: NextRequest): boolean {
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const current = requestWindows.get(key);
  if (!current || now - current.startedAt >= RATE_WINDOW_MS) {
    requestWindows.set(key, { startedAt: now, count: 1 });
    if (requestWindows.size > 512) requestWindows.clear();
    return false;
  }
  current.count += 1;
  return current.count > RATE_LIMIT;
}

function parseLearner(value: unknown): LearnerProfile {
  const learner = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    level: learner.level === "middle-school" || learner.level === "intro-college"
      ? learner.level
      : "high-school",
    language: learner.language === "es" ? "es" : "en",
  };
}

export async function POST(request: NextRequest) {
  if (isRateLimited(request)) {
    return NextResponse.json(
      { error: "Too many explanation requests. Please wait a minute and try again." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  let text: string;
  try {
    text = await request.text();
  } catch {
    return NextResponse.json({ error: "Could not read the request." }, { status: 400 });
  }
  if (Buffer.byteLength(text, "utf8") > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request is too large. Use the provided STEM inputs." }, { status: 413 });
  }

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid");
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Request must be valid JSON." }, { status: 400 });
  }

  const input = parseAxiomInput(body.domain, body.input);
  if (!input) {
    return NextResponse.json(
      { error: "Invalid genetics or combinatorics input. Check the fields and try again." },
      { status: 400 }
    );
  }

  try {
    // Recompute on the server. Client-provided results are never treated as evidence.
    const axiomResult = computeAxiom(input);
    const narrative = await generateNarrative(
      axiomResult,
      parseLearner(body.learner),
      getOpenAiNarrativeProviderFromEnv(),
      getFoundryNarrativeProviderFromEnv()
    );
    return NextResponse.json({
      axiomResult,
      narrative,
      mode: narrative.provider === "openai" ? "openai" : "deterministic_fallback",
    });
  } catch {
    // Do not log input or provider errors: either may contain sensitive learner text.
    return NextResponse.json(
      { error: "AXIOM could not compute this example. Check the input and try again." },
      { status: 422 }
    );
  }
}

