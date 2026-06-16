"use client";

import { motion } from "framer-motion";
import { Award, Flame, Star, Zap } from "lucide-react";
import { BADGES, xpForLevel } from "@/lib/gamification";
import type { ProgressState } from "@/types";

interface ProgressPanelProps {
  progress: ProgressState;
}

export default function ProgressPanel({ progress }: ProgressPanelProps) {
  const currentLevelXp = xpForLevel(progress.level - 1);
  const nextLevelXp = xpForLevel(progress.level);
  const pct = Math.min(100, ((progress.totalXp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="axiom-card space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Zap size={16} className="text-gold" />
          Your Progress
        </h3>
        <span className="text-xs text-cyan font-mono">Lv.{progress.level}</span>
      </div>

      <div>
        <div className="flex justify-between text-xs text-white/50 mb-1">
          <span>{progress.totalXp} XP</span>
          <span>{nextLevelXp} XP</span>
        </div>
        <div className="h-2 bg-void rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan to-gold rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {progress.streakDays > 0 && (
        <div className="flex items-center gap-2 text-sm text-gold">
          <Flame size={14} />
          <span>{progress.streakDays}-day streak</span>
        </div>
      )}

      {progress.bhaktiTier !== undefined && progress.bhaktiTier > 0 && (
        <div className="text-xs text-white/60 border-t border-white/5 pt-3">
          <Star size={12} className="inline text-cyan mr-1" />
          Bhakti Tier {progress.bhaktiTier} · {(progress.bhaktiConfidence ?? 0).toFixed(1)}% confidence
        </div>
      )}

      {progress.badges.length > 0 && (
        <div className="border-t border-white/5 pt-3">
          <p className="text-xs text-white/40 mb-2 flex items-center gap-1">
            <Award size={12} /> Badges
          </p>
          <div className="flex flex-wrap gap-1.5">
            {progress.badges.slice(0, 6).map((id) => (
              <span
                key={id}
                title={BADGES[id]?.description}
                className="text-xs px-2 py-0.5 rounded-full bg-cyan/10 text-cyan border border-cyan/20"
              >
                {BADGES[id]?.name ?? id}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-1 text-center text-xs border-t border-white/5 pt-3">
        {(["genetics", "math", "chemistry", "physics"] as const).map((d) => (
          <div key={d} className="text-white/40">
            <div className="text-cyan font-mono">{progress.domains[d]}</div>
            <div className="capitalize truncate">{d.slice(0, 4)}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}