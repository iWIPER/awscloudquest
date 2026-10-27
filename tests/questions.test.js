"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const CONFIG = require("../js/config.js");
const Q = require("../js/questions.js");
const { seededRng, makeQuestion } = require("./helpers.js");

const valid = (extra = {}) => ({ q: "Which service is DNS?", options: ["Route 53", "S3", "EC2"], answer: "A", ...extra });

test("normalize: accepts the answer as a letter (any case) or as an index", () => {
  const { questions, problems } = Q.normalize(
    [valid(), valid({ q: "Another?", answer: "c" }), valid({ q: "One more?", answer: 1 })],
    CONFIG
  );
  assert.equal(problems.length, 0);
  assert.deepEqual(questions.map((q) => q.answer), [0, 2, 1]);
});

test("normalize: fills optional fields and derives a stable id from the text", () => {
  const [a] = Q.normalize([valid()], CONFIG).questions;
  const [b] = Q.normalize([valid({ q: "  which SERVICE   is dns? " })], CONFIG).questions;
  assert.equal(a.topic, "");
  assert.equal(a.explanation, "");
  assert.match(a.id, /^q[0-9a-f]{8}$/);
  assert.equal(a.id, b.id, "the id ignores case and extra whitespace");
});

test("normalize: uses the given id and trims fields", () => {
  const [q] = Q.normalize([valid({ id: " dns-1 ", topic: " Redes " })], CONFIG).questions;
  assert.equal(q.id, "dns-1");
  assert.equal(q.topic, "Redes");
});

test("normalize: accepts an optional maintainer note (null included)", () => {
  assert.equal(Q.normalize([valid({ note: "check the answer key" })], CONFIG).problems.length, 0);
  assert.equal(Q.normalize([valid({ note: null })], CONFIG).problems.length, 0);
});

test("normalize: rejects invalid items with clear messages", () => {
  const cases = [
    [null, /not an object/],
    [{ options: ["a", "b"], answer: 0 }, /"q"/],
    [valid({ q: "   " }), /"q"/],
    [valid({ options: ["only one"] }), /1 item/],
    [valid({ options: ["1", "2", "3", "4", "5", "6", "7"] }), /7 item/],
    [valid({ options: "A, B" }), /"options"/],
    [valid({ answer: "D" }), /invalid "answer"/],
    [valid({ answer: 3 }), /invalid "answer"/],
    [valid({ answer: -1 }), /invalid "answer"/],
    [valid({ answer: "AB" }), /invalid "answer"/],
    [valid({ answer: undefined }), /invalid "answer"/],
    [valid({ options: ["Route 53", " route 53 ", "S3"] }), /repeats/],
    [valid({ options: ["Route 53", "", "S3"] }), /empty/],
    [valid({ explanation: 42 }), /"explanation"/],
    [valid({ topic: 1 }), /"topic"/],
    [valid({ id: "" }), /"id"/],
  ];
  for (const [item, pattern] of cases) {
    const { questions, problems } = Q.normalize([item], CONFIG);
    assert.equal(questions.length, 0, `should reject ${JSON.stringify(item)}`);
    assert.ok(problems.some((p) => pattern.test(p.message)), `${JSON.stringify(item)} → ${JSON.stringify(problems)}`);
  }
});

test("normalize: drops duplicates by text and by id, keeping the first", () => {
  const { questions, problems } = Q.normalize(
    [valid({ id: "x" }), valid({ id: "y", q: "WHICH service is DNS?" }), valid({ id: "x", q: "Different?" })],
    CONFIG
  );
  assert.deepEqual(questions.map((q) => q.id), ["x"]);
  assert.equal(problems.length, 2);
  assert.match(problems[0].message, /duplicate question/);
  assert.match(problems[1].message, /duplicate id "x"/);
});

test("normalize: bad items do not take down good ones", () => {
  const { questions, problems } = Q.normalize([valid(), { q: "broken" }, valid({ q: "Good?" })], CONFIG);
  assert.equal(questions.length, 2);
  assert.ok(problems.every((p) => p.index === 1));
});

test("normalize: missing bank or a bank that is not a list", () => {
  for (const input of [undefined, null, {}, "text"]) {
    const { questions, problems } = Q.normalize(input, CONFIG);
    assert.equal(questions.length, 0);
    assert.equal(problems[0].index, -1);
  }
});

test("formatProblem: numbers from 1 and shows the start of the question", () => {
  assert.equal(Q.formatProblem({ index: 0, preview: "Which?", message: "error" }), 'Question #1 ("Which?"): error');
});

const noAdjacentRepeats = (deck) => deck.every((id, i) => i === 0 || deck[i - 1] !== id);

test("buildDeck: every question appears exactly once without stats", () => {
  const questions = ["a", "b", "c", "d", "e"].map((id) => makeQuestion(id));
  const deck = Q.buildDeck(questions, CONFIG, { rng: seededRng(1) });
  assert.deepEqual([...deck].sort(), ["a", "b", "c", "d", "e"]);
});

test("buildDeck: questions missed more than answered get up to REVIEW_MAX_COPIES extra copies", () => {
  const questions = ["a", "b", "c", "d", "e", "f"].map((id) => makeQuestion(id));
  const stats = { a: { w: 1, r: 0 }, b: { w: 9, r: 1 }, c: { w: 2, r: 2 }, d: { w: 0, r: 5 } };
  const deck = Q.buildDeck(questions, CONFIG, { stats, rng: seededRng(7) });
  const count = (id) => deck.filter((x) => x === id).length;
  assert.equal(count("a"), 2);
  assert.equal(count("b"), 1 + CONFIG.REVIEW_MAX_COPIES);
  assert.equal(count("c"), 1);
  assert.equal(count("d"), 1);
  assert.ok(noAdjacentRepeats(deck));
});

test("buildDeck: no extra copies when REVIEW_MISSED is off", () => {
  const questions = ["a", "b", "c"].map((id) => makeQuestion(id));
  const config = { ...CONFIG, REVIEW_MISSED: false };
  const deck = Q.buildDeck(questions, config, { stats: { a: { w: 5, r: 0 } }, rng: seededRng(3) });
  assert.equal(deck.length, 3);
});

test("buildDeck: never repeats a question back to back (many seeds)", () => {
  const questions = ["a", "b", "c", "d"].map((id) => makeQuestion(id));
  const stats = { a: { w: 5, r: 0 }, b: { w: 3, r: 0 } };
  for (let seed = 1; seed <= 500; seed++) {
    const deck = Q.buildDeck(questions, CONFIG, { stats, rng: seededRng(seed) });
    assert.ok(noAdjacentRepeats(deck), `seed ${seed}: ${deck}`);
    for (const id of ["a", "b", "c", "d"]) assert.ok(deck.includes(id), `seed ${seed}: missing ${id}`);
  }
});

test("buildDeck: across a deck rollover, the new deck does not start with the last question", () => {
  const questions = ["a", "b", "c"].map((id) => makeQuestion(id));
  for (let seed = 1; seed <= 300; seed++) {
    const rng = seededRng(seed);
    const first = Q.buildDeck(questions, CONFIG, { rng });
    const second = Q.buildDeck(questions, CONFIG, { rng, lastId: first[first.length - 1] });
    assert.notEqual(second[0], first[first.length - 1], `seed ${seed}`);
    assert.ok(noAdjacentRepeats([...first, ...second]));
  }
});

test("buildDeck: drops extra copies that cannot be placed without being adjacent", () => {
  const questions = ["a", "b"].map((id) => makeQuestion(id));
  const deck = Q.buildDeck(questions, CONFIG, { stats: { a: { w: 9, r: 0 } }, rng: seededRng(5) });
  assert.deepEqual(deck, ["a", "b", "a"], "only one extra copy fits when interleaved");
});

test("buildDeck: a bank with a single question still works", () => {
  const deck = Q.buildDeck([makeQuestion("solo")], CONFIG, { lastId: "solo", stats: { solo: { w: 3, r: 0 } } });
  assert.deepEqual(deck, ["solo"]);
});

test("shuffledOptions: keeps every option and marks only the correct one", () => {
  const question = makeQuestion("x", { options: ["one", "two", "three", "four", "five"], answer: 3 });
  const shown = Q.shuffledOptions(question, seededRng(11));
  assert.deepEqual(shown.map((o) => o.text).sort(), [...question.options].sort());
  assert.deepEqual(shown.filter((o) => o.correct).map((o) => o.text), ["four"]);
});

test("shuffledOptions: order changes between showings", () => {
  const question = makeQuestion("x", { options: ["1", "2", "3", "4", "5", "6"] });
  const rng = seededRng(42);
  const orders = new Set(Array.from({ length: 20 }, () => Q.shuffledOptions(question, rng).map((o) => o.text).join()));
  assert.ok(orders.size > 1);
});

test("recordResult: counts misses and hits without mutating the input", () => {
  const before = { a: { w: 1, r: 0 } };
  const after = Q.recordResult(Q.recordResult(before, "a", true), "b", false);
  assert.deepEqual(before, { a: { w: 1, r: 0 } });
  assert.deepEqual(after, { a: { w: 1, r: 1 }, b: { w: 1, r: 0 } });
});

test('multi-answer: answer ["A", "E"] marks both options correct (a "choose two" question)', () => {
  const item = { q: "Which two store files?", options: ["EFS", "EC2", "Lambda", "IAM", "S3"], answer: ["E", "a"] };
  const { questions, problems } = Q.normalize([item], CONFIG);
  assert.equal(problems.length, 0);
  assert.deepEqual(questions[0].answers, [0, 4]);
  assert.equal(questions[0].answer, 0);
  assert.equal(Q.answerText(questions[0]), "EFS + S3");
  const shown = Q.shuffledOptions(questions[0], seededRng(7));
  assert.deepEqual(shown.filter((o) => o.correct).map((o) => o.text).sort(), ["EFS", "S3"]);
});

test("multi-answer: repeats, unknown letters and as many answers as options are rejected", () => {
  assert.deepEqual(Q.parseAnswers(["A", "A"], 4), []);
  assert.deepEqual(Q.parseAnswers(["A", "Z"], 4), []);
  assert.deepEqual(Q.parseAnswers(["A", "B"], 2), []);
  assert.deepEqual(Q.parseAnswers([], 4), []);
  assert.deepEqual(Q.parseAnswers("B", 4), [1]);
  const { problems } = Q.normalize([{ q: "Bad?", options: ["a", "b", "c"], answer: ["A", "A"] }], CONFIG);
  assert.match(problems[0].message, /invalid "answer"/);
});

test("answerText and correctIndexes also work with older data that only has `answer`", () => {
  const old = { options: ["x", "y"], answer: 1 };
  assert.deepEqual(Q.correctIndexes(old), [1]);
  assert.equal(Q.answerText(old), "y");
});
