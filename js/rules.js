/**
 * AWS Cloud Quest — numeric game rules.
 *
 * Pure logic (no DOM), covered by tests/rules.test.js. Every number comes
 * from the CONFIG passed in.
 */
(function (root) {
  "use strict";

  /** Characters to read: question plus all options. */
  function charCount(question) {
    return question.q.length + question.options.reduce((sum, option) => sum + option.length, 0);
  }

  /** Current level: starts at 1 and goes up every QUESTIONS_PER_LEVEL correct answers. */
  function levelFor(correctCount, config) {
    return 1 + Math.floor(correctCount / config.QUESTIONS_PER_LEVEL);
  }

  /** Seconds the monster takes from the right edge to the hero. */
  function travelSeconds(question, level, config) {
    const base = config.THINK_SECONDS + charCount(question) / config.READ_CHARS_PER_SEC;
    const factor = Math.max(config.MIN_FACTOR, 1 - config.LEVEL_SPEEDUP * (level - 1));
    return base * factor;
  }

  /**
   * Points for a hit.
   * `streak` = consecutive hits BEFORE this one (the first hit of a streak uses 0).
   */
  function pointsFor(streak, fast, config) {
    return config.POINTS_BASE + Math.min(streak, config.STREAK_CAP) * config.POINTS_PER_STREAK + (fast ? config.POINTS_FAST : 0);
  }

  /** Fast hit: first try (no miss on this question) and within FAST_SECONDS. */
  function isFastHit(elapsedSeconds, hadError, config) {
    return !hadError && elapsedSeconds <= config.FAST_SECONDS;
  }

  /**
   * Applies a fast hit to the ⚡ dots.
   * Completing FAST_NEEDED gives +1 life, or FULL_LIVES_BONUS points when lives are maxed.
   * @returns {{ lives, fast, gainedLife: boolean, bonusPoints: number }}
   */
  function applyFastHit({ lives, fast }, config) {
    const dots = fast + 1;
    if (dots < config.FAST_NEEDED) return { lives, fast: dots, gainedLife: false, bonusPoints: 0 };
    if (lives < config.MAX_LIVES) return { lives: lives + 1, fast: 0, gainedLife: true, bonusPoints: 0 };
    return { lives, fast: 0, gainedLife: false, bonusPoints: config.FULL_LIVES_BONUS };
  }

  /** Monster speed multiplier after a miss: +WRONG_SPEEDUP, capped at MAX_SPEED. */
  function speedAfterWrong(speed, config) {
    return Math.min(config.MAX_SPEED, speed + config.WRONG_SPEEDUP);
  }

  /** Seconds until the monster arrives, given progress (0–1), base travel time and speed multiplier. */
  function secondsLeft(progress, travel, speed) {
    return ((1 - progress) * travel) / speed;
  }

  /**
   * Effective configuration for a difficulty mode: the base CONFIG with the
   * mode's overrides applied. Unknown modes fall back to DEFAULT_MODE.
   * The result also carries `mode` (key) and `modeLabel` (shown to the player).
   */
  function configFor(config, mode) {
    const key = config.MODES && config.MODES[mode] ? mode : config.DEFAULT_MODE;
    const { label, ...overrides } = (config.MODES && config.MODES[key]) || {};
    return Object.freeze({ ...config, ...overrides, mode: key, modeLabel: label || key });
  }

  const api = Object.freeze({
    configFor,
    charCount,
    levelFor,
    travelSeconds,
    pointsFor,
    isFastHit,
    applyFastHit,
    speedAfterWrong,
    secondsLeft,
  });

  const NS = (root.AwsCloudQuest = root.AwsCloudQuest || {});
  NS.rules = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
