"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const D = require("../js/duel-rules.js");
const CONFIG = require("../js/config.js");

const right = (ms) => ({ correct: true, ms });
const wrong = (ms) => ({ correct: false, ms });

test("room ids: 12 safe characters, read back from the link hash", () => {
  const id = D.newRoomId();
  assert.match(id, /^[2-9a-hj-km-np-z]{12}$/);
  assert.equal(D.roomFromHash(`#duelo=${id}`), id);
  assert.equal(D.roomFromHash("#duelo=../../evil"), null);
  assert.equal(D.roomFromHash("#outra=abc"), null);
  assert.equal(D.roomFromHash(""), null);
});

test("names: trimmed, single spaces, length-capped, never empty", () => {
  assert.equal(D.cleanName("  Josiane   Silva "), "Josiane Silva");
  assert.equal(D.cleanName("a".repeat(30), 16), "a".repeat(16));
  assert.equal(D.cleanName("   "), "Jogador");
});

test("round levels go up every LEVEL_EVERY rounds", () => {
  const duel = CONFIG.DUEL;
  assert.equal(D.levelForRound(1, duel), 1);
  assert.equal(D.levelForRound(duel.LEVEL_EVERY, duel), 1);
  assert.equal(D.levelForRound(duel.LEVEL_EVERY + 1, duel), 2);
});

test("decideRound: the fastest correct answer wins, by the player's own time", () => {
  // The guest's answer arrived later over the network but was faster on screen.
  assert.deepEqual(D.decideRound({ host: right(4200), guest: right(3900) }), { reason: "hit", winner: "guest", losers: ["host"] });
  assert.deepEqual(D.decideRound({ host: right(1000), guest: wrong(500) }), { reason: "hit", winner: "host", losers: ["guest"] });
});

test("decideRound: one correct answer waits for the grace window, then wins", () => {
  assert.equal(D.decideRound({ host: right(2000) }), null);
  assert.deepEqual(D.decideRound({ host: right(2000) }, { graceOver: true }), { reason: "hit", winner: "host", losers: ["guest"] });
});

test("decideRound: one wrong answer keeps the round open for the other player", () => {
  assert.equal(D.decideRound({ guest: wrong(800) }), null);
  assert.deepEqual(D.decideRound({ guest: wrong(800), host: right(5000) }), { reason: "hit", winner: "host", losers: ["guest"] });
});

test("decideRound: both wrong, or time out without a correct answer, costs both a life", () => {
  assert.deepEqual(D.decideRound({ host: wrong(1), guest: wrong(2) }), { reason: "both-wrong", winner: null, losers: ["host", "guest"] });
  assert.deepEqual(D.decideRound({ host: wrong(1) }, { timedOut: true }), { reason: "timeout", winner: null, losers: ["host", "guest"] });
  assert.deepEqual(D.decideRound({}, { timedOut: true }), { reason: "timeout", winner: null, losers: ["host", "guest"] });
  assert.equal(D.decideRound({}), null);
});

test("applyResult and matchWinner: lives drop, a winner appears at zero", () => {
  const hit = { reason: "hit", winner: "host", losers: ["guest"] };
  let lives = D.applyResult({ host: 10, guest: 1 }, hit);
  assert.deepEqual(lives, { host: 10, guest: 0 });
  assert.equal(D.matchWinner(lives), "host");
  lives = D.applyResult({ host: 3, guest: 3 }, { reason: "timeout", winner: null, losers: ["host", "guest"] });
  assert.deepEqual(lives, { host: 2, guest: 2 });
  assert.equal(D.matchWinner(lives), null);
});

test("draw: both out of lives in the same round", () => {
  const both = { reason: "both-wrong", winner: null, losers: ["host", "guest"] };
  const lives = D.applyResult({ host: 1, guest: 1 }, both);
  assert.deepEqual(lives, { host: 0, guest: 0 });
  assert.equal(D.matchWinner(lives), "draw");
});

test("outcomeFor: what goes into each player's report", () => {
  const hit = { reason: "hit", winner: "guest", losers: ["host"] };
  assert.equal(D.outcomeFor("guest", { guest: right(1) }, hit), "first");
  assert.equal(D.outcomeFor("host", { guest: right(1), host: right(2) }, hit), "first"); // knew it, just slower
  assert.equal(D.outcomeFor("host", { guest: right(1), host: wrong(2) }, hit), "lost");
  assert.equal(D.outcomeFor("host", { guest: right(1) }, hit), "skipped");
  assert.equal(D.outcomeFor("host", {}, { reason: "timeout", winner: null, losers: ["host", "guest"] }), "lost");
});

test("taunts and victory lines exist", () => {
  assert.ok(D.TAUNTS.length >= 3 && D.VICTORY_LINES.length >= 2);
  assert.ok(D.TAUNTS.includes(D.pick(D.TAUNTS)));
});

test("isSpecialHit: once per match, rounds SPECIAL_FROM to SPECIAL_TO, only when just one player was right", () => {
  const duel = { SPECIAL_FROM: 4, SPECIAL_TO: 7 };
  const hit = { reason: "hit", winner: "host", losers: ["guest"] };
  const oneRight = { host: right(3000), guest: wrong(2000) };
  const onlyOneAnswered = { host: right(3000) };
  const bothRight = { host: right(3000), guest: right(3500) };
  assert.equal(D.isSpecialHit(3, hit, oneRight, false, duel), false, "too early");
  assert.equal(D.isSpecialHit(4, hit, oneRight, false, duel), true);
  assert.equal(D.isSpecialHit(7, hit, onlyOneAnswered, false, duel), true, "the other did not answer in time");
  assert.equal(D.isSpecialHit(8, hit, oneRight, false, duel), false, "too late");
  assert.equal(D.isSpecialHit(5, hit, bothRight, false, duel), false, "both right: a normal shot");
  assert.equal(D.isSpecialHit(5, hit, oneRight, true, duel), false, "already happened this match");
  assert.equal(D.isSpecialHit(5, { reason: "both-wrong", winner: null, losers: ["host", "guest"] }, {}, false, duel), false, "both wrong");
});
