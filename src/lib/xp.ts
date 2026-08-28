export const BASE_LESSON_XP = 20;
export const LESSON_SCORE_XP = 2;
export const REVIEW_LESSON_XP = 8;
export const WEEKLY_STREAK_LESSONS = 10;
export const WEEKLY_STREAK_GROWTH = 0.2;

export const TROPHY_LEVELS = [
  1, 10, 50, 100, 250, 500, 750, 1000, 2000, 5000, 10000,
] as const;

export type TrophyLevel = (typeof TROPHY_LEVELS)[number];

export const TROPHY_META: Record<
  TrophyLevel,
  { title: string; detail: string }
> = {
  1: { title: "First steps", detail: "You opened the path. Level 1 is yours." },
  10: { title: "Getting going", detail: "Ten levels in. The habit is forming." },
  50: { title: "Steady", detail: "Fifty levels. Practice is part of the week." },
  100: { title: "Century", detail: "One hundred levels of German work." },
  250: { title: "Committed", detail: "A serious climb. Two hundred fifty." },
  500: { title: "Halfway hero", detail: "Five hundred levels. Rare air." },
  750: { title: "Unstoppable", detail: "Seven hundred fifty. Keep the streak." },
  1000: { title: "Thousand", detail: "One thousand levels. A landmark." },
  2000: { title: "Veteran", detail: "Two thousand. The language is settling in." },
  5000: { title: "Master", detail: "Five thousand levels. Few reach here." },
  10000: { title: "Legend", detail: "Ten thousand. The long climb, completed in spirit." },
};

export type LevelProgress = {
  level: number;
  totalXp: number;
  xpInLevel: number;
  xpToNext: number;
  percent: number;
};

export function lessonXp(score: number, alreadyCompleted: boolean): number {
  if (alreadyCompleted) return REVIEW_LESSON_XP;
  return BASE_LESSON_XP + Math.max(0, score) * LESSON_SCORE_XP;
}

export function xpToNextLevel(level: number): number {
  const safe = Math.max(1, Math.floor(level));
  return Math.round(28 + 14 * Math.pow(safe, 1.12));
}

export function levelProgress(totalXp: number): LevelProgress {
  const total = Math.max(0, Math.floor(Number(totalXp) || 0));
  let level = 1;
  let remaining = total;
  while (level < 100_000) {
    const need = xpToNextLevel(level);
    if (remaining < need) {
      return {
        level,
        totalXp: total,
        xpInLevel: remaining,
        xpToNext: need,
        percent: need <= 0 ? 100 : Math.min(100, (remaining / need) * 100),
      };
    }
    remaining -= need;
    level += 1;
  }
  return {
    level,
    totalXp: total,
    xpInLevel: 0,
    xpToNext: xpToNextLevel(level),
    percent: 0,
  };
}

export function weeklyStreakMultiplier(weekNumber: number): number {
  if (weekNumber < 1) return 0;
  return 1 + WEEKLY_STREAK_GROWTH * (weekNumber - 1);
}

export function weeklyStreakBonus(weekNumber: number): number {
  if (weekNumber < 1) return 0;
  return Math.round(
    BASE_LESSON_XP * WEEKLY_STREAK_LESSONS * weeklyStreakMultiplier(weekNumber),
  );
}

export function pendingStreakBonus(streakDays: number, claimedWeeks: number) {
  const earnedWeeks = Math.floor(Math.max(0, streakDays) / 7);
  const already = Math.min(Math.max(0, claimedWeeks), earnedWeeks);
  let xp = 0;
  for (let week = already + 1; week <= earnedWeeks; week += 1) {
    xp += weeklyStreakBonus(week);
  }
  return { xp, earnedWeeks, awardedWeeks: earnedWeeks - already };
}

export function unlockedTrophies(level: number): TrophyLevel[] {
  return TROPHY_LEVELS.filter((item) => level >= item);
}

export function nextTrophy(level: number): TrophyLevel | null {
  return TROPHY_LEVELS.find((item) => item > level) ?? null;
}
