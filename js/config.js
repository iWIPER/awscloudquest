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
    LONG_READ_CHARS: 500,      // question + options this long count as a "long read"…
    LONG_READ_BONUS: 30,       // …and get these extra seconds (not reduced by level)
    LEVEL_SPEEDUP: 0.05,
    MIN_FACTOR: 0.55,
    DANGER_AT: 0.72,           // progress at which the field pulses red

    // ── Level ──────────────────────────────────────────────────────────
    QUESTIONS_PER_LEVEL: 3,    // correct answers per level

    // ── Wrong answers ──────────────────────────────────────────────────
    WRONG_LOCK_SECONDS: 8,     // after a miss, the player cannot shoot for N s
    WRONG_SPEEDUP: 0.4,        // each miss: monster +40% speed for the rest of the question…
    MAX_SPEED: 2.5,            // …up to 2.5× its normal speed

    // ── Power-ups (per game) ───────────────────────────────────────────
    POWER_FREEZE: 3,           // "Gelo": freezes the monster inside an ice cube…
    FREEZE_SECONDS: 15,        // …for this long
    POWER_SKIP: 2,             // "Pular": swaps the question, no life lost, no score

    // ── Difficulty modes ───────────────────────────────────────────────
    // Each mode overrides some of the values above; anything not listed
    // keeps the base value. "advanced" is the base game.
    DEFAULT_MODE: "advanced",
    MODES: {
      easy: {
        label: "Fácil",
        POWER_FREEZE: 5,
        POWER_SKIP: 3,
        WRONG_LOCK_SECONDS: 5,
        WRONG_SPEEDUP: 0.3,
        THINK_SECONDS: 30,     // +10 s before the monster arrives, on every question
      },
      advanced: {
        label: "Avançado",
      },
    },

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
    REPORTS_LIMIT: 20,         // games whose full per-question report is kept for export

    // ── Game events ────────────────────────────────────────────────────
    INTRO_MS: 1700,                    // "READY?" → "GO!" before the first question
    DEATH_SCREEN_MS: 3400,             // dark "GAME OVER" screen before the summary card
    WEAPON_BOX_EVERY: [6, 8],          // questions finished between mystery boxes (random)
    SCENE_EVERY: 15,                   // correct answers between scenery changes
    CHEER_FIRST: [5, 7],               // correct answers before the first cheer (random)
    CHEERS: [                          // fixed milestones, in correct answers
      { at: 25, text: "Mandou bem! A cidade inteira está torcendo por você!" },
      { at: 50, text: "Imbatível! Os monstros já estão fugindo da cidade!" },
      { at: 100, text: "Lendário! Você é o herói que a cidade precisava!" },
      { at: 200, text: "Extraordinário! Ninguém nunca chegou até aqui! A cidade está salva!" },
    ],
    CHEER_FIRST_TEXT: "Continue, você está indo bem! Você vai salvar a cidade!",

    // ── Boss fight: 4 questions, 3 hits to win ─────────────────────────
    // Rocks thrown during the fight only stagger the hero. Winning gives a
    // bonus and a life; losing ends with the boss's smash (−1 life).
    BOSS_FIRST: 12,                    // correct answers before the first boss…
    BOSS_EVERY: 15,                    // …and between bosses
    BOSS_HP: 3,                        // hits to defeat it: 3 correct answers…
    BOSS_ROUNDS: 4,                    // …out of 4 questions (room for one miss)
    BOSS_STEP: 0.15,                   // it steps closer each round it is not hit…
    BOSS_LIMIT: 0.55,                  // …but never past this point of the path
    BOSS_BONUS: 100,                   // points for defeating it (plus +1 life up to MAX_LIVES)
    BOSS_HIT_BONUS: 15,                // points per hit when the fight is lost

    // ── Ambience (seconds; [min, max] are random ranges) ───────────────
    AMBIENT_CYCLE_SECONDS: 240,       // one full day → night → day cycle
    AMBIENT_CYCLE_START: 0.1,         // where the cycle starts (0–1; 0.55–0.8 is night)
    AMBIENT_RAIN_EVERY: [70, 160],    // dry spell before it rains
    AMBIENT_RAIN_LASTS: [25, 50],     // how long a rain lasts
    AMBIENT_THUNDER_EVERY: [9, 20],   // thunder interval while raining
    AMBIENT_BIRDS_EVERY: [7, 16],     // interval between flocks (day, no rain)
    AMBIENT_CRITTERS_EVERY: [12, 26], // bunnies/squirrels hopping left → right (day, no rain)

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
