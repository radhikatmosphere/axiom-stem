/**
 * SuperGrok — xAI Grok API (OpenAI-compatible, edge-safe fetch)
 */

export type SuperGrokResult =
  | { ok: true; content: string }
  | { ok: false; status?: number; error: string };

export async function chatSuperGrok(
  apiKey: string,
  options: {
    system: string;
    user: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<SuperGrokResult> {
  const model = options.model ?? process.env.XAI_MODEL ?? "grok-4.3";

  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: options.maxTokens ?? 600,
        temperature: options.temperature ?? 0.7,
        messages: [
          { role: "system", content: options.system },
          { role: "user", content: options.user },
        ],
      }),
    });

    if (!res.ok) {
      const body = (await res.text()).slice(0, 200);
      console.error(`SuperGrok HTTP ${res.status}: ${body}`);
      return { ok: false, status: res.status, error: body || `HTTP ${res.status}` };
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? null;
    if (!content) {
      return { ok: false, error: "empty_response" };
    }
    return { ok: true, content };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("SuperGrok error:", message);
    return { ok: false, error: message };
  }
}