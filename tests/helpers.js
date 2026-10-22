"use strict";

/** Deterministic pseudo-random generator (mulberry32) for reproducible tests. */
function seededRng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Builds an already-normalized question for tests. */
function makeQuestion(id, overrides = {}) {
  return { id, topic: "", q: `Question ${id}?`, options: ["A", "B", "C", "D"], answer: 0, explanation: "", ...overrides };
}

module.exports = { seededRng, makeQuestion };
