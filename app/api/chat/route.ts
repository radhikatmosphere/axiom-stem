import { NextRequest, NextResponse } from "next/server";
import { computeAxiom } from "@/lib/axiom-result";
import {
  generateNarrative,
  type LearnerProfile,
} from "@/lib/narrative-service";
import { getOpenAiNarrativeProviderFromEnv } from "@/lib/openai-narrative-provider";
import { getFoundryNarrativeProviderFromEnv } from "@/lib/foundry-narrative-provider";
import { axiomToChat } from "@/lib/foundry-adapter";
import { parseChatQuestion } from "@/lib/chat-question";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 4_000;
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 20;
const requestWindows = new Map<string, { startedAt: number; count: number }>();

function isRateLimited(request: NextRequest): boolean {
  const key =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
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
  const learner =
    value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    level:
      learner.level === "middle-school" || learner.level === "intro-college"
        ? learner.level
        : "high-school",
    language: learner.language === "es" ? "es" : "en",
  };
}

interface ChatRequestBody {
  question?: unknown;
  learner?: unknown;
}

function readBody(value: unknown): ChatRequestBody {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as ChatRequestBody;
}

export async function POST(request: NextRequest) {
  if (isRateLimited(request)) {
    return NextResponse.json(
      {
        error: "Too many chat requests. Please wait a minute and try again.",
      },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  let text: string;
  try {
    text = await request.text();
  } catch {
    return NextResponse.json({ error: "Could not read the chat request." }, { status: 400 });
  }
  if (Buffer.byteLength(text, "utf8") > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: "Chat question is too long. Use a shorter STEM problem." },
      { status: 413 }
    );
  }

  let body: ChatRequestBody;
  try {
    body = readBody(JSON.parse(text));
  } catch {
    return NextResponse.json({ error: "Request must be valid JSON." }, { status: 400 });
  }

  const question = typeof body.question === "string" ? body.question : "";
  const parsed = parseChatQuestion(question);
  if (!parsed) {
    return NextResponse.json(
      {
        error:
          "AXIOM could not parse that question. Try a genetics cross like Aa × aa or a counting question like C(10,3).",
      },
      { status: 400 }
    );
  }

  try {
    const axiomResult = computeAxiom(parsed.input);
    const narrative = await generateNarrative(
      axiomResult,
      parseLearner(body.learner),
      getOpenAiNarrativeProviderFromEnv(),
      getFoundryNarrativeProviderFromEnv()
    );
    return NextResponse.json({
      chat: axiomToChat(axiomResult, narrative),
      mode: narrative.provider === "openai" ? "openai" : "deterministic_fallback",
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "AXIOM could not compute that example. The deterministic engine only supports one-gene crosses and bounded combinatorics.",
      },
      { status: 422 }
    );
  }
}
