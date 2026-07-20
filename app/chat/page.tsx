"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Lightbulb, MessageSquare, Send, ShieldAlert, Sparkles, XCircle } from "lucide-react";
import type { ChatResult } from "@/lib/foundry-adapter";
import { CHAT_EXAMPLES } from "@/lib/chat-question";

interface ChatMessage {
  id: string;
  author: "user" | "axiom";
  text: string;
  chat?: ChatResult;
  error?: string;
}

const VERIFICATION_BADGE = {
  verified: {
    label: "Verified",
    class: "bg-emerald-400/15 text-emerald-200 border-emerald-300/30",
    Icon: CheckCircle2,
  },
  warnings: {
    label: "Warnings",
    class: "bg-amber-300/15 text-amber-100 border-amber-300/30",
    Icon: ShieldAlert,
  },
  could_not_verify: {
    label: "Could not verify",
    class: "bg-red-400/15 text-red-100 border-red-300/30",
    Icon: XCircle,
  },
} as const;

const SAMPLE_LLM_ERROR =
  "Demonstration only — AXIOM cannot answer arbitrary questions. It computes deterministic genetics and combinatorics, then explains the cited result.";

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function CitationChip({ id }: { id: string }) {
  return (
    <a
      href={`#evidence-${id}`}
      className="ml-1 rounded bg-cyan/10 px-1.5 py-0.5 font-mono text-[11px] text-cyan hover:bg-cyan/20"
    >
      {id}
    </a>
  );
}

function DisplayGrid({ chat }: { chat: ChatResult }) {
  const { display } = chat;
  if (display.kind === "punnett") {
    return (
      <div className="space-y-2">
        <p className="text-sm text-white/70">
          Cross: <strong>{display.parent1} × {display.parent2}</strong>
        </p>
        <table className="border-collapse font-mono text-xs">
          <thead>
            <tr>
              <th className="border border-white/10 bg-void/50 p-2" aria-label="empty corner" />
              {display.gametes2.map((g, i) => (
                <th key={`${g}-${i}`} className="border border-cyan/30 bg-cyan/10 p-2 text-cyan">{g}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {display.grid.map((row, r) => (
              <tr key={r}>
                <th className="border border-gold/30 bg-gold/10 p-2 text-gold">{display.gametes1[r]}</th>
                {row.map((cell, c) => (
                  <td key={`${cell}-${c}`} className="border border-white/10 p-2 text-center">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex flex-wrap gap-2">
          {Object.entries(display.probabilities)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([genotype, probability]) => (
              <span key={genotype} className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-xs">
                <strong className="text-cyan">{genotype}</strong>: {probability}%
              </span>
            ))}
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <p className="font-mono text-xl font-bold text-cyan">{display.result}</p>
      <p className="rounded bg-void/40 p-2 font-mono text-xs text-white/80">{display.formula}</p>
      {display.sampleOutcomes && (
        <p className="text-xs text-white/60">Sample: {display.sampleOutcomes.join(", ")}</p>
      )}
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  if (message.author === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-cyan/15 px-4 py-2 text-sm text-white/90">
          {message.text}
        </div>
      </div>
    );
  }

  if (message.error) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-red-300/30 bg-red-400/10 px-4 py-3 text-sm text-red-100">
          {message.error}
        </div>
      </div>
    );
  }

  if (!message.chat) return null;
  const chat = message.chat;
  const badge = VERIFICATION_BADGE[chat.verification.status];
  const BadgeIcon = badge.Icon;

  return (
    <div className="flex justify-start">
      <div className="w-full max-w-[90%] rounded-2xl rounded-bl-sm border border-white/10 bg-panel/80 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MessageSquare size={15} className="text-cyan" />
            <span className="text-sm font-semibold">{chat.domainLabel}</span>
            <span className="text-xs text-white/50">engine v{chat.engineVersion}</span>
          </div>
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${badge.class}`}>
            <BadgeIcon size={12} /> {badge.label}
          </span>
        </div>

        <p className="text-sm">
          {chat.summary.text}
          {chat.summary.citations.map((c) => <CitationChip key={c} id={c} />)}
        </p>

        <div className="mt-3 rounded-lg border border-white/10 bg-void/40 p-3">
          <DisplayGrid chat={chat} />
        </div>

        <div className="mt-3 space-y-2 text-sm text-white/80">
          {chat.segments.map((segment, i) => (
            <p key={i}>
              {segment.text}
              {segment.citations.map((c) => <CitationChip key={c} id={c} />)}
            </p>
          ))}
        </div>

        {chat.followUpQuestions.length > 0 && (
          <div className="mt-3 rounded-lg border border-gold/20 bg-gold/5 p-2 text-xs text-gold">
            <p className="mb-1 font-semibold">Try next</p>
            {chat.followUpQuestions.map((q) => <p key={q}>{q}</p>)}
          </div>
        )}

        <details className="mt-3 rounded-lg border border-white/10 bg-void/30 p-3 text-xs">
          <summary className="cursor-pointer font-semibold">Evidence ledger ({chat.evidence.length} items)</summary>
          <div className="mt-2 space-y-2">
            {chat.evidence.map((entry) => (
              <article key={entry.id} id={`evidence-${entry.id}`} className="rounded border border-white/10 bg-panel/70 p-2">
                <code className="text-cyan">{entry.id}</code>
                <p className="mt-0.5 text-white/80">{entry.label}: {entry.statement}</p>
              </article>
            ))}
          </div>
        </details>

        <div className="mt-3 border-t border-white/10 pt-2 text-[11px] text-white/55">
          {chat.provider === "openai"
            ? "OpenAI-generated narrative. Deterministic evidence remains the source of truth."
            : "Deterministic fallback — no OpenAI response was used."}
          {chat.fallbackReason && <> · {chat.fallbackReason.replaceAll("_", " ")}</>}
          {chat.engineWarnings[0] && <p className="mt-1 text-amber-100">{chat.engineWarnings[0]}</p>}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      author: "axiom",
      text: "",
      chat: undefined,
      error: SAMPLE_LLM_ERROR,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(event: FormEvent) {
    event.preventDefault();
    const question = input.trim();
    if (!question || loading) return;
    const userMessage: ChatMessage = { id: uid(), author: "user", text: question };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, learner: { level: "high-school", language: "en" } }),
      });
      const payload = await response.json() as { error?: string; chat?: ChatResult };
      if (!response.ok || !payload.chat) {
        setMessages((prev) => [...prev, {
          id: uid(),
          author: "axiom",
          text: "",
          error: payload.error || "Could not generate a chat answer.",
        }]);
      } else {
        setMessages((prev) => [...prev, { id: uid(), author: "axiom", text: "", chat: payload.chat }]);
      }
    } catch {
      setMessages((prev) => [...prev, {
        id: uid(),
        author: "axiom",
        text: "",
        error: "Network error talking to AXIOM. Try again.",
      }]);
    } finally {
      setLoading(false);
    }
  }

  function pickExample(example: string) {
    setInput(example);
  }

  return (
    <div className="relative z-10 min-h-screen">
      <header className="border-b border-white/10 bg-panel/70 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan font-bold text-void">A</div>
            <div>
              <h1 className="text-lg font-bold gradient-text">AXIOM Chat</h1>
              <p className="text-xs text-white/60">Verifiable STEM tutor · chat</p>
            </div>
          </div>
          <Link href="/" className="text-sm text-cyan hover:underline">Back to tutor</Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <section className="mb-4 rounded-xl border border-white/10 bg-panel/60 p-4 text-sm text-white/75">
          <p className="mb-1 flex items-center gap-2 text-cyan"><Sparkles size={14} /> Compute first, explain with citations</p>
          <p>Ask AXIOM a deterministic STEM question. AXIOM computes the answer locally, then optional OpenAI narration cites each fact/step id. The verification badge is always honest.</p>
        </section>

        <div ref={scrollRef} className="mb-4 h-[60vh] space-y-3 overflow-y-auto rounded-xl border border-white/10 bg-void/30 p-4">
          {messages.map((m) => <ChatBubble key={m.id} message={m} />)}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm border border-white/10 bg-panel/70 px-4 py-3 text-sm text-white/60">
                <span className="animate-pulse">AXIOM is computing…</span>
              </div>
            </div>
          )}
        </div>

        <div className="mb-3 flex flex-wrap gap-2 text-xs">
          <span className="text-white/55 flex items-center gap-1"><Lightbulb size={12} /> Try:</span>
          {CHAT_EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => pickExample(example)}
              className="rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 font-mono text-cyan hover:bg-cyan/20"
            >
              {example}
            </button>
          ))}
        </div>

        <form onSubmit={send} className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={200}
            placeholder="Aa × aa   or   C(10,3)"
            aria-label="Ask AXIOM"
            className="axiom-input flex-1"
          />
          <button type="submit" disabled={loading || !input.trim()} className="axiom-btn-primary flex items-center gap-2">
            Send <Send size={16} />
          </button>
        </form>

        <p className="mt-3 flex items-center gap-1 text-xs text-white/45">
          <ArrowRight size={12} /> Deterministic fallback is always shown if OpenAI is not configured.
        </p>
      </main>
    </div>
  );
}
