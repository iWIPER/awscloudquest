"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const R = require("../js/report.js");

const entry = (outcome, extra = {}) => ({
  id: outcome,
  q: `Pergunta ${outcome}?`,
  topic: "",
  answer: "Resposta",
  explanation: "",
  wrongPicks: [],
  outcome,
  seconds: 5,
  ...extra,
});

const game = (log) => ({
  date: new Date(2026, 9, 22, 14, 5),
  hero: "female",
  score: 42,
  correct: 2,
  misses: 1,
  accuracy: 67,
  level: 1,
  maxStreak: 1,
  seconds: 95,
  log,
});

test("summarize: counts every outcome and the first-try rate over answered questions", () => {
  const s = R.summarize([entry("first"), entry("first"), entry("late"), entry("lost"), entry("skipped")]);
  assert.deepEqual(s.counts, { first: 2, late: 1, lost: 1, skipped: 1 });
  assert.equal(s.total, 5);
  assert.equal(s.answered, 4);
  assert.equal(s.firstTryRate, 50);
});

test("summarize: empty log", () => {
  assert.deepEqual(R.summarize([]), { counts: { first: 0, late: 0, lost: 0, skipped: 0 }, total: 0, answered: 0, firstTryRate: 0 });
});

test("toMarkdown: has summary, outcome table and one section per group", () => {
  const text = R.toMarkdown(
    game([
      entry("first"),
      entry("lost", { wrongPicks: ["Errada A"], explanation: "Porque sim." }),
      entry("skipped"),
    ])
  );
  assert.match(text, /^# AWS Cloud Quest — Relatório da partida/);
  assert.match(text, /\*\*Data:\*\* 22\/10\/2026 14:05/);
  assert.match(text, /\*\*Personagem:\*\* Mulher/);
  assert.match(text, /\| 42 \| 2 \| 1 \| 67% \| 1 \| 1 \| 1:35 \|/);
  assert.match(text, /## Errei ou não respondi a tempo/);
  assert.match(text, /\*\*Você marcou:\*\* Errada A/);
  assert.match(text, /\*\*Por quê:\*\* Porque sim\./);
  assert.match(text, /## Acertei de primeira/);
  assert.match(text, /## Pulei/);
  assert.match(text, /não são questões oficiais da AWS/);
});

test("toMarkdown: shows the difficulty mode when present", () => {
  assert.match(R.toMarkdown({ ...game([entry("first")]), modeLabel: "Fácil" }), /\*\*Modo:\*\* Fácil/);
  assert.doesNotMatch(R.toMarkdown(game([entry("first")])), /Modo:/);
});

test("toMarkdown: omits empty sections", () => {
  const text = R.toMarkdown(game([entry("first")]));
  assert.doesNotMatch(text, /## Pulei/);
  assert.doesNotMatch(text, /## Errei/);
});

test("toMarkdown: escapes Markdown control characters from the bank", () => {
  const text = R.toMarkdown(game([entry("first", { q: "Use *bold* | pipe\nnew line?", answer: "a_b" })]));
  assert.match(text, /Use \\\*bold\\\* \\\| pipe new line\?/);
  assert.match(text, /a\\_b/);
});

test("stamp: filename-safe date from a Date or a stored report", () => {
  assert.equal(R.stamp(new Date(2026, 9, 22, 9, 7)), "2026-10-22-0907");
  assert.equal(R.stamp({ t: new Date(2026, 9, 22, 9, 7).getTime() }), "2026-10-22-0907");
});

test("toMarkdown: works with a stored report (timestamp `t` instead of `date`)", () => {
  const stored = JSON.parse(JSON.stringify({ ...game([entry("first")]), date: undefined, t: new Date(2026, 9, 22, 14, 5).getTime() }));
  assert.match(R.toMarkdown(stored), /\*\*Data:\*\* 22\/10\/2026 14:05/);
});
