import { NextRequest, NextResponse } from "next/server";

const WALLET_API = process.env.WALLET_API_URL || "https://wallet.radhikachain.xyz";
const AXIOM_API = process.env.AXIOM_API_URL;

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet) {
    return NextResponse.json({ error: "wallet required" }, { status: 400 });
  }

  const out: Record<string, unknown> = { wallet };

  try {
    const bhaktiRes = await fetch(`${WALLET_API}/wallet/api/bhakti/${wallet}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (bhaktiRes.ok) {
      out.bhakti = await bhaktiRes.json();
    }
  } catch {
    out.bhakti = null;
  }

  if (AXIOM_API) {
    try {
      const progRes = await fetch(`${AXIOM_API}/axiom/progress/${wallet}`, {
        signal: AbortSignal.timeout(8000),
      });
      if (progRes.ok) {
        out.progress = await progRes.json();
      }
    } catch {
      out.progress = null;
    }
  }

  return NextResponse.json(out);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { wallet, domain, xp } = body;

  if (!wallet || !domain) {
    return NextResponse.json({ error: "wallet and domain required" }, { status: 400 });
  }

  if (AXIOM_API) {
    try {
      const res = await fetch(`${AXIOM_API}/axiom/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet, domain, xp }),
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) return NextResponse.json(await res.json());
    } catch {
      // fall through to local-only ack
    }
  }

  return NextResponse.json({ ok: true, mode: "local" });
}