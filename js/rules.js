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

  /** Very long question + options: the player gets LONG_READ_BONUS extra seconds. */
  function isLongRead(question, config) {
    return charCount(question) >= config.LONG_READ_CHARS;
  }

  /** How many options must be marked: 1, or 2 for "choose two" questions. */
  const answersNeeded = (question) => (Array.isArray(question.answers) ? question.answers.length : 1);

  /**
   * Seconds the monster takes from the right edge to the hero: thinking time
   * (shorter at higher levels) plus reading time (never shorter: a player must
   * be able to read the whole question). Long reads and "choose two" questions
   * add fixed seconds.
   */
  function travelSeconds(question, level, config) {
    const factor = Math.max(config.MIN_FACTOR, 1 - config.LEVEL_SPEEDUP * (level - 1));
    const reading = charCount(question) / config.READ_CHARS_PER_SEC;
    const extra =
      (isLongRead(question, config) ? config.LONG_READ_BONUS : 0) + (answersNeeded(question) - 1) * (config.MULTI_ANSWER_BONUS || 0);
    return config.THINK_SECONDS * factor + reading + extra;
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

  // ── Game events ─────────────────────────────────────────────────────
  /** Random integer in [min, max]. */
  const between = ([min, max], rng = Math.random) => min + Math.floor(rng() * (max - min + 1));

  /** Question count at which the next mystery box appears. */
  function nextBoxAt(finished, config, rng) {
    return finished + between(config.WEAPON_BOX_EVERY, rng);
  }

  /** Cheering milestones of a game (correct answers → text), the first one at a random count. */
  function cheerMilestones(config, rng) {
    const first = { at: between(config.CHEER_FIRST, rng), text: config.CHEER_FIRST_TEXT };
    return [first, ...config.CHEERS].sort((a, b) => a.at - b.at);
  }

  /**
   * Text for a character: each "[male|female]" pair keeps the form that fits
   * ("Você é [o herói|a heroína]!", "[Campeão|Campeã] da nuvem!").
   */
  function gendered(text, female) {
    return String(text).replace(/\[([^|\]]*)\|([^\]]*)\]/g, (_, male, fem) => (female ? fem : male));
  }

  /** True when this number of correct answers starts a boss fight. */
  function isBossDue(correct, config) {
    return correct >= config.BOSS_FIRST && (correct - config.BOSS_FIRST) % config.BOSS_EVERY === 0;
  }

  /** Scenery for a number of correct answers: it changes every SCENE_EVERY and cycles. */
  function sceneFor(correct, config, scenes) {
    return scenes[Math.floor(correct / config.SCENE_EVERY) % scenes.length];
  }

  /** Boss position after a round in which it was not hit: one step closer, never past BOSS_LIMIT. */
  function bossStep(position, config) {
    return Math.min(config.BOSS_LIMIT, position + config.BOSS_STEP);
  }

  /**
   * Reward when a boss fight ends. Losing it (fewer than BOSS_HP hits) also
   * costs a life, applied by game.js after the boss's final smash.
   * @returns {{ defeated: boolean, points: number, lives: number }}
   */
  function bossReward({ hits, lives }, config) {
    const defeated = hits >= config.BOSS_HP;
    if (!defeated) return { defeated, points: hits * config.BOSS_HIT_BONUS, lives };
    return { defeated, points: config.BOSS_BONUS, lives: Math.min(config.MAX_LIVES, lives + 1) };
  }

  const api = Object.freeze({
    configFor,
    nextBoxAt,
    cheerMilestones,
    gendered,
    isBossDue,
    sceneFor,
    bossStep,
    bossReward,
    charCount,
    levelFor,
    isLongRead,
    answersNeeded,
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
