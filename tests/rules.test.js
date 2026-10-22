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

test("travelSeconds: each level speeds up, but the factor never drops below MIN_FACTOR", () => {
  const question = makeQuestion("x");
  const base = R.travelSeconds(question, 1, CONFIG);
  close(R.travelSeconds(question, 2, CONFIG), base * (1 - CONFIG.LEVEL_SPEEDUP));
  close(R.travelSeconds(question, 999, CONFIG), base * CONFIG.MIN_FACTOR);
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

test("pushAfterWrong: +WRONG_PUSH, capped at WRONG_PUSH_CAP, never moving back", () => {
  close(R.pushAfterWrong(0.1, CONFIG), 0.1 + CONFIG.WRONG_PUSH);
  close(R.pushAfterWrong(0.95, CONFIG), CONFIG.WRONG_PUSH_CAP);
  close(R.pushAfterWrong(0.99, CONFIG), 0.99);
});

test("charCount: sums question and options", () => {
  assert.equal(R.charCount(makeQuestion("x", { q: "abc", options: ["de", "f"] })), 6);
});
