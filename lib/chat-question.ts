import type { AxiomInput } from "@/types";
import { computeAxiom } from "@/lib/axiom-result";

/**
 * Lightweight natural-language-ish parser for the web chat. The web chat
 * accepts a single user question and tries to map it to one of AXIOM's
 * deterministic domains. Anything that cannot be mapped is rejected with a
 * blank result so the chat UI can ask for a clearer question — AXIOM never
 * "invents" a deterministic answer for ambiguous input.
 */

export interface ParsedChatQuestion {
  input: AxiomInput;
  /** Short human label for the chat UI ("Genetics", "Combinatorics"). */
  label: string;
}

const GENETICS_PASS = /\b([A-Za-z]{2})\s*[x×]\s*([A-Za-z]{2})\b/;

function tryGenetics(question: string): ParsedChatQuestion | null {
  const match = question.match(GENETICS_PASS);
  if (!match) return null;
  const parent1 = match[1];
  const parent2 = match[2];
  if (parent1.toUpperCase()[0] !== parent1.toUpperCase()[1]) return null;
  if (parent2.toUpperCase()[0] !== parent2.toUpperCase()[1]) return null;
  const input: AxiomInput = {
    domain: "genetics",
    data: { parent1, parent2 },
  };
  try {
    computeAxiom(input);
  } catch {
    return null;
  }
  return { input, label: "Genetics" };
}

function tryCombinatorics(question: string): ParsedChatQuestion | null {
  const upper = question.toUpperCase();
  const match = upper.match(/\b([CP])\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
  if (!match) return null;
  const type = match[1] === "P" ? "permutation" : "combination";
  const n = Number(match[2]);
  const r = Number(match[3]);
  if (!Number.isInteger(n) || !Number.isInteger(r)) return null;
  const input: AxiomInput = {
    domain: "combinatorics",
    data: { type, n, r, repetition: false },
  };
  try {
    computeAxiom(input);
  } catch {
    return null;
  }
  return { input, label: "Combinatorics" };
}

export function parseChatQuestion(question: string): ParsedChatQuestion | null {
  const trimmed = question.trim();
  if (!trimmed || trimmed.length > 200) return null;
  return tryGenetics(trimmed) ?? tryCombinatorics(trimmed);
}

/** Chat-safe example suggestions surfaced to the user. */
export const CHAT_EXAMPLES = [
  "Aa × aa",
  "Aa × Aa",
  "C(10,3)",
  "P(5,2)",
] as const;
