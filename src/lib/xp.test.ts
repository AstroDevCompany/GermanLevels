import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emptyProgress, recordLesson, streak, todayKey } from "./progress";
import {
  BASE_LESSON_XP,
  lessonXp,
  levelProgress,
  nextTrophy,
  pendingStreakBonus,
  TROPHY_LEVELS,
  unlockedTrophies,
  weeklyStreakBonus,
  weeklyStreakMultiplier,
  xpToNextLevel,
} from "./xp";

describe("level curve", () => {
  it("starts at level 1 and requires more XP each level", () => {
    const start = levelProgress(0);
    assert.equal(start.level, 1);
    assert.equal(start.xpInLevel, 0);
    assert.ok(xpToNextLevel(2) > xpToNextLevel(1));
    assert.ok(xpToNextLevel(50) > xpToNextLevel(10));
    const afterFirst = levelProgress(xpToNextLevel(1));
    assert.equal(afterFirst.level, 2);
    assert.equal(afterFirst.xpInLevel, 0);
  });

  it("unlocks trophies at the listed levels", () => {
    assert.deepEqual(unlockedTrophies(1), [1]);
    assert.deepEqual(unlockedTrophies(9), [1]);
    assert.deepEqual(unlockedTrophies(10), [1, 10]);
    assert.equal(nextTrophy(1), 10);
    assert.equal(nextTrophy(10000), null);
    assert.equal(TROPHY_LEVELS.length, 11);
  });
});

describe("lesson and streak XP", () => {
  it("awards more for a first completion than a replay", () => {
    assert.equal(lessonXp(5, false), BASE_LESSON_XP + 10);
    assert.equal(lessonXp(5, true), 8);
  });

  it("grows weekly streak bonuses from 100% at 7 days", () => {
    assert.equal(weeklyStreakMultiplier(1), 1);
    assert.equal(weeklyStreakMultiplier(2), 1.2);
    assert.equal(weeklyStreakBonus(1), BASE_LESSON_XP * 10);
    assert.equal(weeklyStreakBonus(2), Math.round(BASE_LESSON_XP * 10 * 1.2));
    const firstWeek = pendingStreakBonus(7, 0);
    assert.equal(firstWeek.xp, weeklyStreakBonus(1));
    assert.equal(firstWeek.earnedWeeks, 1);
    const alreadyClaimed = pendingStreakBonus(7, 1);
    assert.equal(alreadyClaimed.xp, 0);
    const twoWeeks = pendingStreakBonus(14, 1);
    assert.equal(twoWeeks.xp, weeklyStreakBonus(2));
  });

  it("resets the streak after a missed day and grants a weekly bonus at 7 days", () => {
    const monday = new Date(2026, 7, 3, 12);
    let state = emptyProgress();
    for (let i = 0; i < 7; i += 1) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      state = recordLesson(
        { ...state },
        { level: "a1", chapter: "alphabet-sounds", lesson: `0${i + 1}`, score: 4, total: 8 },
        day,
      );
    }
    assert.equal(streak(state.days, new Date(2026, 7, 9, 12)), 7);
    assert.equal(state.streakRewardWeeks, 1);
    assert.equal(state.lastXp?.streak, weeklyStreakBonus(1));
    assert.ok(state.xp > lessonXp(4, false));

    const afterGap = new Date(2026, 7, 11, 12);
    assert.equal(streak(state.days, afterGap), 0);
    state = recordLesson(
      state,
      { level: "a1", chapter: "alphabet-sounds", lesson: "08", score: 4, total: 8 },
      afterGap,
    );
    assert.equal(streak(state.days, afterGap), 1);
    assert.equal(state.streakRewardWeeks, 0);
    assert.equal(state.lastXp?.streak, 0);
  });

  it("uses local calendar days for the streak key", () => {
    assert.equal(todayKey(new Date(2026, 0, 5, 23)), "2026-01-05");
  });
});
