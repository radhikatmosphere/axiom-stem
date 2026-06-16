import { NextRequest, NextResponse } from "next/server";
import { logAxiomEvent, type AxiomEventType } from "@/lib/splunk-hec";
import type { Domain } from "@/types";

export const runtime = "edge";

const DOMAINS: Domain[] = ["genetics", "math", "chemistry", "physics"];
const EVENTS: AxiomEventType[] = ["decompose", "auth_connect", "error"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = body.event as AxiomEventType;
    const domain = body.domain as Domain | undefined;

    if (!event || !EVENTS.includes(event)) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }
    if (domain && !DOMAINS.includes(domain)) {
      return NextResponse.json({ error: "Invalid domain" }, { status: 400 });
    }

    logAxiomEvent({
      event,
      domain,
      severity: event === "error" ? "error" : "info",
      metadata: body.metadata,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}