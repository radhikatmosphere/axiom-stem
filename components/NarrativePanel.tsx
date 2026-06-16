"use client";

import { motion } from "framer-motion";
import { BookOpen, Copy, Check, Sparkles } from "lucide-react";
import { useState } from "react";

interface NarrativePanelProps {
  narrative: string | null;
  provider: string | null;
  loading: boolean;
}

function renderMarkdown(text: string) {
  return text.split("\n").map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className="mb-2 last:mb-0">
        {parts.map((part, j) =>
          part.startsWith("**") && part.endsWith("**") ? (
            <strong key={j} className="text-cyan font-semibold">
              {part.slice(2, -2)}
            </strong>
          ) : (
            <span key={j}>{part}</span>
          )
        )}
      </p>
    );
  });
}

export default function NarrativePanel({ narrative, provider, loading }: NarrativePanelProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!narrative) return;
    await navigator.clipboard.writeText(narrative);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const providerLabel =
    provider === "supergrok" ? "SuperGrok (Grok 4.3)" : provider === "agent-core" ? "RadhikaChain Agent-Core" : "Demo Narrative";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="axiom-card min-h-[200px]"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <BookOpen size={16} className="text-gold" />
          Layer 2 — Narrative Adapter
        </h3>
        {narrative && (
          <button onClick={copy} className="axiom-btn-secondary p-2 text-xs flex items-center gap-1">
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy"}
          </button>
        )}
      </div>

      {loading && (
        <div className="space-y-3">
          <div className="h-4 shimmer-bg rounded w-full" />
          <div className="h-4 shimmer-bg rounded w-5/6" />
          <div className="h-4 shimmer-bg rounded w-4/6" />
          <p className="text-xs text-white/40 flex items-center gap-1 mt-4">
            <Sparkles size={12} className="animate-pulse text-cyan" />
            Meaning appears after truth is computed…
          </p>
        </div>
      )}

      {!loading && !narrative && (
        <p className="text-sm text-white/40 italic">
          Decompose a problem above — the narrative will appear automatically.
        </p>
      )}

      {!loading && narrative && (
        <>
          <div className="text-sm text-white/80 leading-relaxed">{renderMarkdown(narrative)}</div>
          <p className="text-xs text-white/30 mt-4 pt-3 border-t border-white/5">
            via {providerLabel} · RadhikaChain ecosystem
          </p>
        </>
      )}
    </motion.div>
  );
}