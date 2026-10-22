"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { loadBank } = require("../scripts/load-bank.js");

test("data/questions.js: the repository bank is valid", () => {
  const { questions, problems } = loadBank();
  assert.deepEqual(problems, []);
  assert.ok(questions.length >= 8);
});

test("data/questions.js: has at least one long question (600+ chars, 5 options) to exercise the layout", () => {
  const { questions } = loadBank();
  assert.ok(questions.some((q) => q.q.length >= 600 && q.options.length === 5));
});
