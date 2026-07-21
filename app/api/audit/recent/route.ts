import { NextRequest, NextResponse } from "next/server";
import { recentAudit } from "@/lib/telemetry";

export const runtime = "nodejs";

const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 10;
const requestWindows = new Map<string, { startedAt: number; count: number }>();

function isRateLimited(request: NextRequest): boolean {
  const key =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const current = requestWindows.get(key);
  if (!current || now - current.startedAt >= RATE_WINDOW_MS) {
    requestWindows.set(key, { startedAt: now, count: 1 });
    if (requestWindows.size > 64) requestWindows.clear();
    return false;
  }
  current.count += 1;
  return current.count > RATE_LIMIT;
}

export function GET(request: NextRequest) {
  if (isRateLimited(request)) {
    return NextResponse.json(
      { error: "Audit viewer rate-limited. Slow down." },
      { status: 429, headers: { "Retry-After": "60", "X-Robots-Tag": "noindex" } }
    );
  }
  const requestedLimit = Number(new URL(request.url).searchParams.get("limit") ?? 50);
  const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(requestedLimit, 200)) : 50;
  const records = recentAudit(limit);

  return NextResponse.json(
    {
      count: records.length,
      records,
      privacy: "Questions are hashed unless AXIOM_AUDIT_FULL=1. No user accounts are tracked.",
    },
    {
      headers: {
        "X-Robots-Tag": "noindex, nofollow",
        "Cache-Control": "no-store",
      },
    }
  );
}
