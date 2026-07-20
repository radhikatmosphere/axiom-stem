import "server-only";

import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * Server-only audit trail for chat responses. AXIOM never persists the full
 * learner message unless AXIOM_AUDIT_FULL=1 is set; default entries only carry
 * a short hash of the question plus the decision/why metadata. This lets judges
 * inspect why AXIOM answered the way it did without leaking student text.
 */

const LOG_PATH = "logs/chat-trace.jsonl";
const RING_CAP = 200;

export type ChatDecision =
  | "deterministic"
  | "educational_followup"
  | "off_topic_warning"
  | "off_topic_silent"
  | "invalid_input";

export interface AuditRecord {
  /** ISO timestamp so the log is reproducible on disk. */
  ts: string;
  /** Client-supplied random session id (no account). */
  sessionId: string;
  /** Stable hash of the user message; never the raw text unless AXIOM_AUDIT_FULL=1. */
  questionFingerprint: string;
  /** Length cap guards against trivial fingerprint collisions on length. */
  questionLength: number;
  /** Classification verdict. */
  decision: ChatDecision;
  /** Why AXIOM picked that branch. */
  why: {
    reason: string;
    matchedDomain?: string;
    matchedFactId?: string;
    warningAlreadySent?: boolean;
    fallbackReason?: string;
    verificationStatus?: string;
  };
  /** Deterministic result headline, if the path was deterministic or follow-up. */
  headline?: string;
  /** Provider used for the narrative. */
  provider?: "openai" | "azure_foundry" | "deterministic_fallback";
}

const ring: AuditRecord[] = [];
let ringPos = 0;

function hashMessage(text: string): string {
  // FNV-1a keeps hashes recoverable without crypto deps; collision is fine for
  // audit aggregate, not for security.
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

function pushRing(record: AuditRecord): void {
  if (ring.length < RING_CAP) {
    ring.push(record);
  } else {
    ring[ringPos] = record;
    ringPos = (ringPos + 1) % RING_CAP;
  }
}

export function appendAudit(
  rawMessage: string,
  sessionId: string,
  decision: ChatDecision,
  why: AuditRecord["why"],
  extras?: Partial<Pick<AuditRecord, "headline" | "provider">>
): AuditRecord {
  const full = process.env.AXIOM_AUDIT_FULL === "1";
  const record: AuditRecord = {
    ts: new Date().toISOString(),
    sessionId: sessionId.slice(0, 32),
    questionFingerprint: full ? rawMessage : hashMessage(rawMessage),
    questionLength: rawMessage.length,
    decision,
    why,
    ...extras,
  };

  try {
    mkdirSync(dirname(LOG_PATH), { recursive: true });
    appendFileSync(join(process.cwd(), LOG_PATH), JSON.stringify(record) + "\n", "utf8");
  } catch {
    // Disk failure must not break the chat path; the ring buffer still holds it.
  }
  pushRing(record);
  return record;
}

/** Returns the most recent records (newest last) for the audit viewer. */
export function recentAudit(limit: number): AuditRecord[] {
  const safeLimit = Math.max(1, Math.min(limit, 200));
  if (ring.length < RING_CAP) {
    return ring.slice(-safeLimit);
  }
  // Ring wrapped; newest are ringPos-1 backwards.
  const out: AuditRecord[] = [];
  for (let i = 0; i < safeLimit; i++) {
    const idx = (ringPos - 1 - i + RING_CAP) % RING_CAP;
    out.unshift(ring[idx]);
  }
  return out;
}

/** Exported for tests only; callers should use recentAudit(). */
export function _ringSizeForTests(): number {
  return ring.length;
}

/** Exposed for tests; clears the ring and resets the position. */
export function _resetRingForTests(): void {
  ring.length = 0;
  ringPos = 0;
}
