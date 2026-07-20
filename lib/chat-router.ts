import "server-only";

import type { AxiomInput, AxiomResult } from "@/types";
import { parseChatQuestion } from "@/lib/chat-question";

/**
 * Deterministic chat-router. No LLM is used to classify — that would make the
 * guardrail itself untrustworthy. We match STEM markers lexically and use the
 * already-deterministic parseChatQuestion parser as the authoritative STEM
 * detector.
 *
 * Verdicts:
 *   deterministic            — parseChatQuestion succeeded.
 *   educational_followup     — question references the last deterministic
 *                              result (fact/step ids, domain words, or asks a
 *                              question about a discovered genotype/formula).
 *   off_topic_warning        — first off-topic message this session.
 *   off_topic_silent         — consecutive off-topic after a warning.
 *   invalid_input            — empty or over-length body.
 */

export type ChatRoute =
  | "deterministic"
  | "educational_followup"
  | "off_topic_warning"
  | "off_topic_silent"
  | "invalid_input";

export interface ChatRouteInput {
  question: string;
  sessionId: string;
  /** Most recent deterministic result for this session, if any. */
  lastResult?: AxiomResult | null;
  /** True once the off-topic warning has fired for this session. */
  warningSent: boolean;
}

export interface ChatRouteDecision {
  route: ChatRoute;
  matchedDomain?: string;
  matchedFactId?: string;
  reason: string;
  parsedDeterministic?: ParsedDeterministic;
}

export interface ParsedDeterministic {
  input: AxiomInput;
  label: string;
}

// Words that make a follow-up recognisable as a STEM-education question.
const STEM_QUESTION_HINTS =
  /\b(why|how|what|explain|difference|between|dominant|recessive|gamete|allele|punnett|probab|genotype|phenotype|combination|permutation|factorial|counting|formula|frequency|harmonic)\b/i;

// Hard off-topic buckets — anything in these areas is refused even if it
// contains a STEM-looking token, to prevent jailbreaks via "Aa lottery ticket".
const FORBIDDEN_TOPICS =
  /\b(medical|diagnos|symptom|disease|treatment|prescription|invest|stock|crypto|trading|arbitrage|betting|gambl|religion|prayer|polit|weapon|nsfw|porn|hookup|drug|alcohol|tobacco)\b/i;

function mentionsLastResult(question: string, result: AxiomResult): { matched: boolean; factId?: string } {
  const lower = question.toLowerCase();
  for (const fact of result.facts) {
    if (fact.id.toLowerCase().includes(lower.slice(0, 6))) continue; // avoid trivial substring
    if (lower.includes(fact.id.toLowerCase())) return { matched: true, factId: fact.id };
  }
  for (const step of result.steps) {
    if (lower.includes(step.id.toLowerCase())) return { matched: true, factId: step.id };
  }
  // Domain-word signal plus a question word: counts as follow-up intent.
  const domain = result.domain === "genetics"
    ? /(genetic|allele|dominant|recessive|punnett|genotype|phenotype|gamete)/i
    : /(combination|permutation|factorial|count|ways|outcomes?)/i;
  if (domain.test(question) && STEM_QUESTION_HINTS.test(question)) {
    return { matched: true };
  }
  return { matched: false };
}

export function classifyChat(input: ChatRouteInput): ChatRouteDecision {
  const q = (input.question ?? "").trim();
  if (q.length === 0 || q.length > 200) {
    return { route: "invalid_input", reason: "empty or over-length body" };
  }

  // Forbidden topics are always refused, even with STEM tokens nearby.
  if (FORBIDDEN_TOPICS.test(q)) {
    return {
      route: input.warningSent ? "off_topic_silent" : "off_topic_warning",
      reason: "forbidden topic (medical/financial/religious/etc)",
    };
  }

  // Deterministic wins first; this is the only path that produces a verified claim.
  const parsed = parseChatQuestion(q);
  if (parsed) {
    return {
      route: "deterministic",
      matchedDomain: parsed.label,
      reason: "parseChatQuestion matched a deterministic STEM problem",
      parsedDeterministic: { input: parsed.input, label: parsed.label },
    };
  }

  // Educational follow-up: only allowed when there's a prior deterministic
  // result on the conversation AND the question references it.
  if (input.lastResult && mentionsLastResult(q, input.lastResult).matched) {
    const match = mentionsLastResult(q, input.lastResult);
    return {
      route: "educational_followup",
      matchedDomain: input.lastResult.domain,
      matchedFactId: match.factId,
      reason: "follow-up question references the most recent deterministic result",
    };
  }

  // Anything else is off-topic.
  return {
    route: input.warningSent ? "off_topic_silent" : "off_topic_warning",
    reason: "no deterministic match and no reference to a prior deterministic result",
  };
}
