import type { Domain, ProgressState } from "@/types";

const STORAGE_KEY = "axiom_progress";

export const XP_DECOMPOSE = 10;
export const XP_DOMAIN_FIRST = 25;
export const XP_STREAK_BONUS = 5;

export const BADGES: Record<string, { name: string; description: string; domain?: Domain }> = {
  first_decompose: { name: "First Truth", description: "Completed your first decomposition" },
  genetics_master: { name: "Gene Weaver", description: "Mastered genetics domain", domain: "genetics" },
  math_master: { name: "Combinator", description: "Mastered math domain", domain: "math" },
  chemistry_master: { name: "Electron Sage", description: "Mastered chemistry domain", domain: "chemistry" },
  physics_master: { name: "Harmonic Hero", description: "Mastered physics domain", domain: "physics" },
  streak_3: { name: "3-Day Streak", description: "Learned 3 days in a row" },
  streak_7: { name: "Week Warrior", description: "7-day learning streak" },
  level_5: { name: "Rising Scholar", description: "Reached level 5" },
  radhika_linked: { name: "Chain Learner", description: "Connected RadhikaChain wallet" },
};

export function xpForLevel(level: number): number {
  return level * 100;
}

export function levelFromXp(xp: number): number {
  let level = 1;
  while (xp >= xpForLevel(level)) {
    level++;
  }
  return level;
}

export function loadProgress(): ProgressState {
  if (typeof window === "undefined") {
    return { totalXp: 0, level: 1, streakDays: 0, badges: [], domains: { genetics: 0, math: 0, chemistry: 0, physics: 0 } };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    return { ...defaultProgress(), ...JSON.parse(raw) };
  } catch {
    return defaultProgress();
  }
}

function defaultProgress(): ProgressState {
  return {
    totalXp: 0,
    level: 1,
    streakDays: 0,
    badges: [],
    domains: { genetics: 0, math: 0, chemistry: 0, physics: 0 },
  };
}

export function saveProgress(state: ProgressState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function awardXp(domain: Domain, current: ProgressState): ProgressState {
  const today = new Date().toDateString();
  const lastDay = localStorage.getItem("axiom_last_day");
  let streak = current.streakDays;

  if (lastDay !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    streak = lastDay === yesterday.toDateString() ? streak + 1 : 1;
    localStorage.setItem("axiom_last_day", today);
  }

  let xp = XP_DECOMPOSE + (streak > 1 ? XP_STREAK_BONUS : 0);
  const domains = { ...current.domains };
  const isFirst = domains[domain] === 0;
  domains[domain] = (domains[domain] || 0) + 1;
  if (isFirst) xp += XP_DOMAIN_FIRST;

  const totalXp = current.totalXp + xp;
  const level = levelFromXp(totalXp);
  const badges = new Set(current.badges);

  if (current.totalXp === 0) badges.add("first_decompose");
  if (isFirst) badges.add(`${domain}_master`);
  if (streak >= 3) badges.add("streak_3");
  if (streak >= 7) badges.add("streak_7");
  if (level >= 5) badges.add("level_5");
  if (current.walletAddress) badges.add("radhika_linked");

  return {
    ...current,
    totalXp,
    level,
    streakDays: streak,
    badges: Array.from(badges),
    domains,
  };
}