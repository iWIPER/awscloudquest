/**
 * AWS Cloud Quest — configuration.
 *
 * Every gameplay rule lives in this object; no other file should contain
 * rule "magic numbers". Times are in SECONDS unless the name ends in _MS.
 * The full table is in the README ("Configuration").
 */
(function (root) {
  "use strict";

  const CONFIG = Object.freeze({
    // ── Lives ──────────────────────────────────────────────────────────
    START_LIVES: 1,            // lives when a game starts
    MAX_LIVES: 3,              // life cap
    FAST_SECONDS: 15,          // first-try hit within N s counts as a fast hit
    FAST_NEEDED: 3,            // fast hits needed to earn 1 life
    FULL_LIVES_BONUS: 50,      // points awarded instead when lives are already maxed

    // ── Question panel ─────────────────────────────────────────────────
    QUESTION_AUTOCLOSE: 20,    // panel collapses after being open for N s

    // ── Monster travel time ────────────────────────────────────────────
    // travel = (THINK_SECONDS + chars / READ_CHARS_PER_SEC) × factor
    // factor = max(MIN_FACTOR, 1 − LEVEL_SPEEDUP × (level − 1))
    THINK_SECONDS: 20,
    READ_CHARS_PER_SEC: 25,
    LEVEL_SPEEDUP: 0.05,
    MIN_FACTOR: 0.55,
    DANGER_AT: 0.72,           // progress at which the field pulses red

    // ── Level ──────────────────────────────────────────────────────────
    QUESTIONS_PER_LEVEL: 3,    // correct answers per level

    // ── Wrong answers ──────────────────────────────────────────────────
    WRONG_PUSH: 0.08,          // each miss pushes the monster 8% of the way…
    WRONG_PUSH_CAP: 0.97,      // …but never past 97%

    // ── Score: BASE + min(streak, STREAK_CAP) × PER_STREAK + fast bonus ─
    POINTS_BASE: 10,
    POINTS_PER_STREAK: 2,
    STREAK_CAP: 10,
    POINTS_FAST: 10,

    // ── Review of missed questions ─────────────────────────────────────
    REVIEW_MISSED: true,       // questions missed more than answered come back more often
    REVIEW_MAX_COPIES: 2,      // extra copies per deck, at most

    // ── Question bank ──────────────────────────────────────────────────
    MIN_OPTIONS: 2,
    MAX_OPTIONS: 6,

    // ── History ────────────────────────────────────────────────────────
    HISTORY_LIMIT: 50,         // games kept in storage
    HISTORY_SHOWN: 20,         // games listed on the history screen

    // ── Animation (ms) ─────────────────────────────────────────────────
    MAX_DT_MS: 50,             // max loop step (avoids jumps when the tab returns)
    SHOT_MS: 180,              // bullet flight
    DYING_MS: 600,             // monster death animation
    NEXT_AFTER_HIT_MS: 650,    // delay before the next question after a hit
    HERO_BLINK_MS: 1300,       // hero blinks when respawning after losing a life
    CONFETTI_COUNT: 24,
  });

  const NS = (root.AwsCloudQuest = root.AwsCloudQuest || {});
  NS.config = CONFIG;
  if (typeof module === "object" && module.exports) module.exports = CONFIG;
})(typeof window !== "undefined" ? window : globalThis);
