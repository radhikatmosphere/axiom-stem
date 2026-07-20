import { NextRequest, NextResponse } from "next/server";
import { computeAxiom } from "@/lib/axiom-result";
import {
  generateNarrative,
  type LearnerProfile,
} from "@/lib/narrative-service";
import { getOpenAiNarrativeProviderFromEnv } from "@/lib/openai-narrative-provider";
import { getFoundryNarrativeProviderFromEnv } from "@/lib/foundry-narrative-provider";
import { axiomToChat } from "@/lib/foundry-adapter";
import { classifyChat } from "@/lib/chat-router";
import { hasWarning, markWarning, resetSession } from "@/lib/off-topic-memory";
import { generateEducationalFollowup } from "@/lib/educational-followup";
import { appendAudit } from "@/lib/telemetry";
import type { AxiomResult } from "@/types";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 4_000;
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 20;
const LAST_RESULT_TTL_MS = 30 * 60_000;
const MAX_LAST_RESULTS = 512;

const requestWindows = new Map<string, { startedAt: number; count: number }>();
const lastResults = new Map<string, { result: AxiomResult; at: number }>();

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
  sessionId?: unknown;
}

function readBody(value: unknown): ChatRequestBody {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as ChatRequestBody;
}

function getLastResult(sessionId: string): AxiomResult | null {
  const entry = lastResults.get(sessionId);
  if (!entry) return null;
  if (Date.now() - entry.at > LAST_RESULT_TTL_MS) {
    lastResults.delete(sessionId);
    return null;
  }
  return entry.result;
}

function setLastResult(sessionId: string, result: AxiomResult): void {
  if (lastResults.size > MAX_LAST_RESULTS) lastResults.clear();
  lastResults.set(sessionId, { result, at: Date.now() });
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
  const sessionId =
    typeof body.sessionId === "string" && body.sessionId.length <= 64
      ? body.sessionId
      : "anon";

  const decision = classifyChat({
    question,
    sessionId,
    lastResult: getLastResult(sessionId),
    warningSent: hasWarning(sessionId),
  });

  if (decision.route === "invalid_input") {
    appendAudit(question, sessionId, "invalid_input", { reason: decision.reason });
    return NextResponse.json(
      { error: "Please send a short STEM question (under 200 characters)." },
      { status: 400 }
    );
  }

  if (decision.route === "off_topic_silent") {
    appendAudit(question, sessionId, "off_topic_silent", {
      reason: decision.reason,
      warningAlreadySent: true,
    });
    // Honest 200 with no model output — the UI shows a "stayed quiet" bubble.
    return NextResponse.json({ mode: "silent" }, { status: 200 });
  }

  if (decision.route === "off_topic_warning") {
    markWarning(sessionId);
    appendAudit(question, sessionId, "off_topic_warning", {
      reason: decision.reason,
      warningAlreadySent: false,
    });
    const message =
      parseLearner(body.learner).language === "es"
        ? "Volvamos a STEM. AXIOM solo responde genética determinista y combinatoria; prueba \"Aa × aa\" o \"C(10,3)\"."
        : "Let's keep this on STEM. AXIOM only answers deterministic genetics and combinatorics — try \"Aa × aa\" or \"C(10,3)\".";
    return NextResponse.json({ mode: "warning", warning: message });
  }

  if (decision.route === "deterministic" && decision.parsedDeterministic) {
    // A STEM question resets the off-topic guardrail immediately.
    resetSession(sessionId);
    try {
      const axiomResult = computeAxiom(decision.parsedDeterministic.input);
      setLastResult(sessionId, axiomResult);
      const narrative = await generateNarrative(
        axiomResult,
        parseLearner(body.learner),
        getOpenAiNarrativeProviderFromEnv(),
        getFoundryNarrativeProviderFromEnv()
      );
      appendAudit(question, sessionId, "deterministic", {
        reason: decision.reason,
        matchedDomain: decision.matchedDomain,
        verificationStatus: narrative.verification.status,
      }, {
        headline: axiomResult.domain === "genetics"
          ? `${(axiomResult.display as { parent1: string; parent2: string }).parent1} × ${(axiomResult.display as { parent1: string; parent2: string }).parent2}`
          : `C(${axiomResult.normalizedInput.n},${axiomResult.normalizedInput.r})`,
        provider: narrative.provider === "openai" ? "openai" : "deterministic_fallback",
      });
      return NextResponse.json({
        chat: axiomToChat(axiomResult, narrative),
        mode: narrative.provider === "openai" ? "openai" : "deterministic_fallback",
      });
    } catch {
      appendAudit(question, sessionId, "invalid_input", {
        reason: "computeAxiom raised on parsed input",
      });
      return NextResponse.json(
        { error: "AXIOM could not compute that example." },
        { status: 422 }
      );
    }
  }

  // educational_followup — only reachable when there's a prior deterministic
  // result. Always goes through verifier tagging an interpretation flag.
  const lastResult = getLastResult(sessionId);
  if (!lastResult) {
    // Defensive: classifier said follow-up but state expired. Reset and warn.
    appendAudit(question, sessionId, "off_topic_warning", {
      reason: "educational_followup without a live last result",
      warningAlreadySent: false,
    });
    return NextResponse.json({
      mode: "warning",
      warning: "Compute a deterministic question first, then ask a follow-up about it.",
    });
  }

  try {
    const { narrative, provider } = await generateEducationalFollowup(
      lastResult,
      parseLearner(body.learner),
      question
    );
    appendAudit(question, sessionId, "educational_followup", {
      reason: decision.reason,
      matchedDomain: decision.matchedDomain,
      matchedFactId: decision.matchedFactId,
      verificationStatus: narrative.verification.status,
      fallbackReason: narrative.fallbackReason,
    }, {
      provider,
    });
    return NextResponse.json({
      chat: axiomToChat(lastResult, narrative),
      mode: "interpretation",
    });
  } catch {
    appendAudit(question, sessionId, "invalid_input", {
      reason: "educational follow-up provider threw",
    });
    return NextResponse.json(
      { error: "AXIOM could not interpret that follow-up. Try rephrasing or compute a fresh question." },
      { status: 422 }
    );
  }
}
