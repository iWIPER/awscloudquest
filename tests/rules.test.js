"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const CONFIG = require("../js/config.js");
const R = require("../js/rules.js");
const { makeQuestion } = require("./helpers.js");

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} ≠ ${expected}`);

test("travelSeconds: question + options set the reading time", () => {
  // 50 characters in the question + 4 × 25 in the options = 150 characters
  const question = makeQuestion("x", { q: "x".repeat(50), options: Array(4).fill("y".repeat(25)) });
  close(R.travelSeconds(question, 1, CONFIG), CONFIG.THINK_SECONDS + 150 / CONFIG.READ_CHARS_PER_SEC);
});

test("travelSeconds: longer questions get more time", () => {
  const short = makeQuestion("a", { q: "Short?" });
  const long = makeQuestion("b", { q: "x".repeat(600) });
  assert.ok(R.travelSeconds(long, 1, CONFIG) > R.travelSeconds(short, 1, CONFIG));
});

test("travelSeconds: levels shorten the thinking time (down to MIN_FACTOR), never the reading time", () => {
  const question = makeQuestion("x");
  const reading = R.charCount(question) / CONFIG.READ_CHARS_PER_SEC;
  close(R.travelSeconds(question, 1, CONFIG), CONFIG.THINK_SECONDS + reading);
  close(R.travelSeconds(question, 2, CONFIG), CONFIG.THINK_SECONDS * (1 - CONFIG.LEVEL_SPEEDUP) + reading);
  close(R.travelSeconds(question, 999, CONFIG), CONFIG.THINK_SECONDS * CONFIG.MIN_FACTOR + reading);
});

test("travelSeconds: a long read gets LONG_READ_BONUS extra seconds, not reduced by level", () => {
  const long = makeQuestion("x", { q: "x".repeat(CONFIG.LONG_READ_CHARS) });
  const plain = (level) =>
    CONFIG.THINK_SECONDS * Math.max(CONFIG.MIN_FACTOR, 1 - CONFIG.LEVEL_SPEEDUP * (level - 1)) +
    R.charCount(long) / CONFIG.READ_CHARS_PER_SEC;
  assert.ok(R.isLongRead(long, CONFIG));
  assert.ok(!R.isLongRead(makeQuestion("y"), CONFIG));
  close(R.travelSeconds(long, 1, CONFIG), plain(1) + CONFIG.LONG_READ_BONUS);
  close(R.travelSeconds(long, 5, CONFIG), plain(5) + CONFIG.LONG_READ_BONUS);
});

test("levelFor: one level every QUESTIONS_PER_LEVEL correct answers", () => {
  const per = CONFIG.QUESTIONS_PER_LEVEL;
  assert.equal(R.levelFor(0, CONFIG), 1);
  assert.equal(R.levelFor(per - 1, CONFIG), 1);
  assert.equal(R.levelFor(per, CONFIG), 2);
  assert.equal(R.levelFor(per * 4, CONFIG), 5);
});

test("pointsFor: 10 + min(streak, 10) × 2 + 10 when fast", () => {
  assert.equal(R.pointsFor(0, false, CONFIG), 10);
  assert.equal(R.pointsFor(0, true, CONFIG), 20);
  assert.equal(R.pointsFor(3, false, CONFIG), 16);
  assert.equal(R.pointsFor(10, true, CONFIG), 40);
  assert.equal(R.pointsFor(50, true, CONFIG), 40, "streak is capped at STREAK_CAP");
});

test("isFastHit: must be first try and within FAST_SECONDS", () => {
  assert.equal(R.isFastHit(CONFIG.FAST_SECONDS, false, CONFIG), true);
  assert.equal(R.isFastHit(CONFIG.FAST_SECONDS + 0.01, false, CONFIG), false);
  assert.equal(R.isFastHit(1, true, CONFIG), false);
});

test("applyFastHit: lights up dots until FAST_NEEDED", () => {
  assert.deepEqual(R.applyFastHit({ lives: 1, fast: 0 }, CONFIG), { lives: 1, fast: 1, gainedLife: false, bonusPoints: 0 });
});

test("applyFastHit: the last dot gives +1 life and resets the dots", () => {
  const result = R.applyFastHit({ lives: 1, fast: CONFIG.FAST_NEEDED - 1 }, CONFIG);
  assert.deepEqual(result, { lives: 2, fast: 0, gainedLife: true, bonusPoints: 0 });
});

test("applyFastHit: with lives maxed it becomes FULL_LIVES_BONUS points", () => {
  const result = R.applyFastHit({ lives: CONFIG.MAX_LIVES, fast: CONFIG.FAST_NEEDED - 1 }, CONFIG);
  assert.deepEqual(result, { lives: CONFIG.MAX_LIVES, fast: 0, gainedLife: false, bonusPoints: CONFIG.FULL_LIVES_BONUS });
});

test("applyFastHit: from START_LIVES, lives climb to MAX_LIVES and never exceed it", () => {
  let state = { lives: CONFIG.START_LIVES, fast: 0 };
  let bonus = 0;
  for (let i = 0; i < CONFIG.FAST_NEEDED * 3; i++) {
    const r = R.applyFastHit(state, CONFIG);
    state = { lives: r.lives, fast: r.fast };
    bonus += r.bonusPoints;
    assert.ok(state.lives <= CONFIG.MAX_LIVES);
  }
  assert.equal(state.lives, CONFIG.MAX_LIVES);
  assert.equal(bonus, CONFIG.FULL_LIVES_BONUS, "the third round already finds lives maxed");
});

test("speedAfterWrong: each miss adds WRONG_SPEEDUP, capped at MAX_SPEED", () => {
  close(R.speedAfterWrong(1, CONFIG), 1 + CONFIG.WRONG_SPEEDUP);
  let speed = 1;
  for (let i = 0; i < 20; i++) speed = R.speedAfterWrong(speed, CONFIG);
  close(speed, CONFIG.MAX_SPEED);
});

test("secondsLeft: a faster monster arrives sooner", () => {
  close(R.secondsLeft(0, 30, 1), 30);
  close(R.secondsLeft(0.5, 30, 1), 15);
  close(R.secondsLeft(0.5, 30, 1.5), 10);
});

test("configFor: easy mode overrides only its own values", () => {
  const easy = R.configFor(CONFIG, "easy");
  assert.equal(easy.mode, "easy");
  assert.equal(easy.modeLabel, "Fácil");
  assert.equal(easy.POWER_FREEZE, 5);
  assert.equal(easy.POWER_SKIP, 3);
  assert.equal(easy.WRONG_LOCK_SECONDS, 5);
  assert.equal(easy.WRONG_SPEEDUP, 0.3);
  assert.equal(easy.START_LIVES, CONFIG.START_LIVES, "values not in the mode keep the base value");
  assert.ok(Object.isFrozen(easy));
});

test("configFor: advanced is the base game; unknown modes fall back to the default", () => {
  const advanced = R.configFor(CONFIG, "advanced");
  for (const key of ["POWER_FREEZE", "POWER_SKIP", "WRONG_LOCK_SECONDS", "WRONG_SPEEDUP"]) {
    assert.equal(advanced[key], CONFIG[key], key);
  }
  assert.equal(R.configFor(CONFIG, "nightmare").mode, CONFIG.DEFAULT_MODE);
  assert.equal(R.configFor(CONFIG, undefined).mode, CONFIG.DEFAULT_MODE);
});

test("configFor: easy is never harder than advanced", () => {
  const easy = R.configFor(CONFIG, "easy");
  const advanced = R.configFor(CONFIG, "advanced");
  assert.ok(easy.POWER_FREEZE >= advanced.POWER_FREEZE);
  assert.ok(easy.POWER_SKIP >= advanced.POWER_SKIP);
  assert.ok(easy.WRONG_LOCK_SECONDS <= advanced.WRONG_LOCK_SECONDS);
  assert.ok(easy.WRONG_SPEEDUP <= advanced.WRONG_SPEEDUP);
  const question = makeQuestion("x");
  assert.ok(R.travelSeconds(question, 1, easy) > R.travelSeconds(question, 1, advanced), "easy gives more time per question");
  close(R.travelSeconds(question, 1, easy) - R.travelSeconds(question, 1, advanced), easy.THINK_SECONDS - advanced.THINK_SECONDS);
});

const fixedRng = (value) => () => value;

test("nextBoxAt: the mystery box comes back after WEAPON_BOX_EVERY questions", () => {
  const [min, max] = CONFIG.WEAPON_BOX_EVERY;
  assert.equal(R.nextBoxAt(10, CONFIG, fixedRng(0)), 10 + min);
  assert.equal(R.nextBoxAt(10, CONFIG, fixedRng(0.999)), 10 + max);
});

test("cheerMilestones: a random first cheer, then the fixed ones, in order", () => {
  const list = R.cheerMilestones(CONFIG, fixedRng(0));
  assert.equal(list[0].at, CONFIG.CHEER_FIRST[0]);
  assert.equal(list[0].text, CONFIG.CHEER_FIRST_TEXT);
  assert.deepEqual(list.slice(1).map((c) => c.at), CONFIG.CHEERS.map((c) => c.at));
  assert.ok(list.every((c, i) => i === 0 || c.at >= list[i - 1].at));
});

test("isBossDue: first at BOSS_FIRST, then every BOSS_EVERY correct answers", () => {
  const { BOSS_FIRST: first, BOSS_EVERY: every } = CONFIG;
  assert.equal(R.isBossDue(first - 1, CONFIG), false);
  assert.equal(R.isBossDue(first, CONFIG), true);
  assert.equal(R.isBossDue(first + 1, CONFIG), false);
  assert.equal(R.isBossDue(first + every, CONFIG), true);
});

test("sceneFor: changes every SCENE_EVERY correct answers and cycles", () => {
  const scenes = ["a", "b", "c"];
  const n = CONFIG.SCENE_EVERY;
  assert.equal(R.sceneFor(0, CONFIG, scenes), "a");
  assert.equal(R.sceneFor(n - 1, CONFIG, scenes), "a");
  assert.equal(R.sceneFor(n, CONFIG, scenes), "b");
  assert.equal(R.sceneFor(3 * n, CONFIG, scenes), "a");
});

test("bossStep: the boss steps closer but never past BOSS_LIMIT", () => {
  close(R.bossStep(0, CONFIG), CONFIG.BOSS_STEP);
  let pos = 0;
  for (let i = 0; i < 20; i++) pos = R.bossStep(pos, CONFIG);
  close(pos, CONFIG.BOSS_LIMIT);
  assert.ok(CONFIG.BOSS_LIMIT < 1, "the boss never reaches the hero");
});

test("bossReward: defeating gives the bonus and a life (capped); escaping pays per hit", () => {
  assert.deepEqual(R.bossReward({ hits: CONFIG.BOSS_HP, lives: 1 }, CONFIG), { defeated: true, points: CONFIG.BOSS_BONUS, lives: 2 });
  assert.equal(R.bossReward({ hits: CONFIG.BOSS_HP, lives: CONFIG.MAX_LIVES }, CONFIG).lives, CONFIG.MAX_LIVES);
  const almost = CONFIG.BOSS_HP - 1;
  assert.deepEqual(R.bossReward({ hits: almost, lives: 1 }, CONFIG), { defeated: false, points: almost * CONFIG.BOSS_HIT_BONUS, lives: 1 });
});

test("boss fight: winnable with room for one miss (3 hits out of 4 rounds)", () => {
  assert.ok(CONFIG.BOSS_HP < CONFIG.BOSS_ROUNDS, "the player can miss a round and still win");
  assert.equal(CONFIG.BOSS_HP, 3);
  assert.equal(CONFIG.BOSS_ROUNDS, 4);
});

test("charCount: sums question and options", () => {
  assert.equal(R.charCount(makeQuestion("x", { q: "abc", options: ["de", "f"] })), 6);
});

test("travelSeconds: a \"choose two\" question gets MULTI_ANSWER_BONUS extra seconds", () => {
  const single = makeQuestion("s", { options: ["a", "b", "c", "d", "e"], answers: [1] });
  const double = makeQuestion("d", { options: ["a", "b", "c", "d", "e"], answers: [1, 3] });
  assert.equal(R.answersNeeded(single), 1);
  assert.equal(R.answersNeeded(double), 2);
  close(R.travelSeconds(double, 1, CONFIG) - R.travelSeconds(single, 1, CONFIG), CONFIG.MULTI_ANSWER_BONUS);
  close(R.travelSeconds(double, 7, CONFIG) - R.travelSeconds(single, 7, CONFIG), CONFIG.MULTI_ANSWER_BONUS);
});

test("gendered: keeps the male or the female form of each [male|female] pair", () => {
  const text = "Você é [o herói|a heroína]! [Campeão|Campeã]!";
  assert.equal(R.gendered(text, false), "Você é o herói! Campeão!");
  assert.equal(R.gendered(text, true), "Você é a heroína! Campeã!");
  assert.equal(R.gendered("Sem marcação.", true), "Sem marcação.");
});
