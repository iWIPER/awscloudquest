"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createStore, KEYS } = require("../js/storage.js");

function memoryBackend() {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
  };
}

const blockedBackend = {
  getItem() { throw new Error("blocked"); },
  setItem() { throw new Error("blocked"); },
  removeItem() { throw new Error("blocked"); },
};

test("best score: starts at 0 and persists", () => {
  const backend = memoryBackend();
  const store = createStore(() => backend);
  assert.equal(store.getBest(), 0);
  store.setBest(120);
  assert.equal(createStore(() => backend).getBest(), 120);
});

const memoryStore = () => {
  const backend = memoryBackend();
  return createStore(() => backend);
};

test("history: newest first and capped", () => {
  const store = memoryStore();
  for (let i = 1; i <= 60; i++) store.addHistory({ t: i, score: i, correct: i, level: 1 }, 50);
  const history = store.getHistory();
  assert.equal(history.length, 50);
  assert.equal(history[0].t, 60);
  assert.equal(history[49].t, 11);
});

test("clearHistory: removes history and best score, keeps review stats", () => {
  const store = memoryStore();
  store.setBest(10);
  store.addHistory({ t: 1, score: 10, correct: 1, level: 1 }, 50);
  store.setStats({ a: { w: 1, r: 0 } });
  store.clearHistory();
  assert.equal(store.getBest(), 0);
  assert.deepEqual(store.getHistory(), []);
  assert.deepEqual(store.getStats(), { a: { w: 1, r: 0 } });
});

test("corrupted data falls back to defaults", () => {
  const backend = memoryBackend();
  backend.setItem(KEYS.best, "not-json");
  backend.setItem(KEYS.history, JSON.stringify({ not: "a list" }));
  backend.setItem(KEYS.stats, JSON.stringify([1, 2]));
  const store = createStore(() => backend);
  assert.equal(store.getBest(), 0);
  assert.deepEqual(store.getHistory(), []);
  assert.deepEqual(store.getStats(), {});
});

test("blocked storage: nothing throws", () => {
  const store = createStore(() => blockedBackend);
  assert.equal(store.getBest(), 0);
  assert.equal(store.setBest(5), false);
  assert.deepEqual(store.addHistory({ t: 1 }, 50), [{ t: 1 }]);
  assert.deepEqual(store.getStats(), {});
  assert.doesNotThrow(() => store.clearHistory());
});

test("missing localStorage: nothing throws", () => {
  const store = createStore(() => undefined);
  assert.equal(store.getBest(), 0);
  assert.equal(store.setStats({}), false);
});
