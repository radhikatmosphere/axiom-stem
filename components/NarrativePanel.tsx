"use client";

import type { NarrativeResult, VerificationStatus } from "@/types";

interface NarrativePanelProps {
  narrative: NarrativeResult | null;
  loading: boolean;
  error: string | null;
}

const statusLabel: Record<VerificationStatus, string> = {
  verified: "Verified",
  warnings: "Warnings",
  could_not_verify: "Could not verify",
};

const statusClass: Record<VerificationStatus, string> = {
  verified: "bg-emerald-400/15 text-emerald-200 border-emerald-300/30",
  warnings: "bg-amber-300/15 text-amber-100 border-amber-300/30",
  could_not_verify: "bg-red-400/15 text-red-100 border-red-300/30",
};

function CitationLinks({ citations }: { citations: string[] }) {
  if (!citations.length) return null;
  return (
    <span className="ml-2 inline-flex flex-wrap gap-1 align-baseline">
      {citations.map((citation) => (
        <a
          key={citation}
          href={`#evidence-${citation}`}
          className="rounded bg-cyan/10 px-1.5 py-0.5 font-mono text-[11px] text-cyan hover:bg-cyan/20 focus:outline-none focus:ring-2 focus:ring-cyan"
          aria-label={`View evidence ${citation}`}
        >
          {citation}
        </a>
      ))}
    </span>
  );
}

export default function NarrativePanel({ narrative, loading, error }: NarrativePanelProps) {
  return (
    <section className="axiom-card min-h-[220px]" aria-labelledby="explanation-heading">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">2. Explain</p>
          <h2 id="explanation-heading" className="text-lg font-semibold">Evidence-linked explanation</h2>
        </div>
        {narrative && (
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass[narrative.verification.status]}`}>
            {statusLabel[narrative.verification.status]}
          </span>
        )}
      </div>

      {loading && (
        <div className="space-y-3" aria-live="polite" aria-busy="true">
          <div className="h-4 w-full rounded shimmer-bg" />
          <div className="h-4 w-5/6 rounded shimmer-bg" />
          <div className="h-4 w-3/5 rounded shimmer-bg" />
          <p className="text-sm text-white/55">Generating an explanation from the deterministic evidence…</p>
        </div>
      )}

      {!loading && error && (
        <p className="rounded-lg border border-red-300/30 bg-red-400/10 p-3 text-sm text-red-100" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && !narrative && (
        <p className="text-sm text-white/55">
          Compute a result, then choose “Generate explanation.” Citations will link back to the evidence panel.
        </p>
      )}

      {!loading && narrative && (
        <div className="space-y-4 text-sm leading-6 text-white/85">
          <div className="rounded-lg border border-white/10 bg-void/40 p-4">
            <p>
              {narrative.summary}
              <CitationLinks citations={narrative.summaryCitations} />
            </p>
          </div>

          <div className="space-y-3">
            {narrative.explanationSegments.map((segment) => (
              <p key={segment.id}>
                {segment.text}
                <CitationLinks citations={segment.citations} />
              </p>
            ))}
          </div>

          {narrative.followUpQuestions.length > 0 && (
            <div className="rounded-lg border border-gold/20 bg-gold/5 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-gold">Try next</p>
              {narrative.followUpQuestions.map((question) => <p key={question}>{question}</p>)}
            </div>
          )}

          <div className="border-t border-white/10 pt-3 text-xs text-white/55">
            <p>
              {narrative.provider === "openai"
                ? "OpenAI-generated narrative; deterministic evidence remains the source of truth."
                : "Deterministic fallback mode; no OpenAI response was used."}
            </p>
            {narrative.fallbackReason && <p className="mt-1">Fallback reason: {narrative.fallbackReason.replaceAll("_", " ")}.</p>}
            {narrative.verification.warnings.map((warning) => <p key={warning} className="mt-1 text-amber-100">{warning}</p>)}
          </div>
        </div>
      )}
    </section>
  );
}
