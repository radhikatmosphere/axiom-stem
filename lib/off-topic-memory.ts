import "server-only";

/**
 * Per-session state machine for the off-topic guardrail.
 *
 * State machine:
 *   on-topic  -- off-topic msg -->  warned
 *   warned    -- off-topic msg -->  silent  (no answer sent)
 *   warned    -- on-topic msg  -->  on-topic  (state resets immediately)
 *   silent    -- on-topic msg  -->  on-topic
 *   silent    -- off-topic msg -->  silent
 *
 * No accounts. sessionId is a client-supplied random string; entries expire
 * after IDLE_TTL_MS of inactivity and the map caps at MAX_SESSIONS to bound
 * memory (same eviction strategy as the rate-limit map in api/narrative).
 */

interface SessionState {
  warningSent: boolean;
  lastSeenAt: number;
}

const IDLE_TTL_MS = 30 * 60_000;
const MAX_SESSIONS = 512;

const sessions = new Map<string, SessionState>();

function clean(sessionId: string): SessionState {
  const now = Date.now();
  const existing = sessions.get(sessionId);
  if (!existing || now - existing.lastSeenAt > IDLE_TTL_MS) {
    const fresh: SessionState = { warningSent: false, lastSeenAt: now };
    sessions.set(sessionId, fresh);
    if (sessions.size > MAX_SESSIONS) sessions.clear();
    return fresh;
  }
  existing.lastSeenAt = now;
  return existing;
}

/** Returns true when the warning has already fired for this session. */
export function hasWarning(sessionId: string): boolean {
  return clean(sessionId).warningSent;
}

/** Marks the session as warned so the next off-topic message goes silent. */
export function markWarning(sessionId: string): void {
  const state = clean(sessionId);
  state.warningSent = true;
}

/** Resets the session to on-topic — called whenever a STEM message lands. */
export function resetSession(sessionId: string): void {
  const state = clean(sessionId);
  state.warningSent = false;
}

/** Exposed for tests; not part of the public chat path. */
export function _resetAllForTests(): void {
  sessions.clear();
}
