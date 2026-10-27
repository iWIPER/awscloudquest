/**
 * AWS Cloud Quest — question bank: normalization, validation and deck building.
 *
 * Pure logic: no DOM, no localStorage. Loaded by the game in the browser and
 * by the tests / scripts/validate-questions.mjs in Node, so validation rules
 * are exactly the same in both places.
 *
 * The game NEVER generates, infers or fixes answers: everything comes from the bank.
 */
(function (root) {
  "use strict";

  const LETTERS = "ABCDEF";

  const isText = (value) => typeof value === "string" && value.trim().length > 0;

  /** Comparison key: ignores case and repeated whitespace. */
  const textKey = (text) => String(text).trim().replace(/\s+/g, " ").toLowerCase();

  /** Stable id derived from the question text (32-bit FNV-1a), used when `id` is missing. */
  function hashId(text) {
    let hash = 0x811c9dc5;
    const key = textKey(text);
    for (let i = 0; i < key.length; i++) {
      hash ^= key.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return "q" + hash.toString(16).padStart(8, "0");
  }

  /** Converts one answer (letter "A"–"F" or 0-based index) to an index, or -1. */
  function parseAnswer(answer, optionCount) {
    let index = -1;
    if (Number.isInteger(answer)) index = answer;
    else if (typeof answer === "string" && /^[a-f]$/i.test(answer.trim())) {
      index = LETTERS.indexOf(answer.trim().toUpperCase());
    }
    return index >= 0 && index < optionCount ? index : -1;
  }

  /**
   * All correct indexes, sorted. `answer` is one answer ("B") or a list for
   * "choose two" questions (["A", "E"]). Returns [] if anything is invalid:
   * an unknown letter, a repeat, or as many answers as options.
   */
  function parseAnswers(answer, optionCount) {
    const list = Array.isArray(answer) ? answer : [answer];
    const indexes = list.map((a) => parseAnswer(a, optionCount));
    const valid = list.length > 0 && list.length < optionCount && indexes.every((i) => i >= 0) && new Set(indexes).size === indexes.length;
    return valid ? indexes.sort((a, b) => a - b) : [];
  }

  /** Lists the problems of a single item (empty list = valid item). */
  function checkItem(item, config) {
    if (item === null || typeof item !== "object" || Array.isArray(item)) {
      return ["is not an object { q, options, answer }"];
    }
    const problems = [];

    if (!isText(item.q)) problems.push('"q" (question text) is missing or empty');

    if (!Array.isArray(item.options)) {
      problems.push('"options" is missing or is not a list [ ... ]');
    } else {
      const n = item.options.length;
      if (n < config.MIN_OPTIONS || n > config.MAX_OPTIONS) {
        problems.push(`"options" has ${n} item(s); allowed: ${config.MIN_OPTIONS} to ${config.MAX_OPTIONS}`);
      }
      const seen = new Set();
      item.options.forEach((option, i) => {
        const label = LETTERS[i] || i;
        if (!isText(option)) return problems.push(`option ${label} is empty or not text`);
        const key = textKey(option);
        if (seen.has(key)) problems.push(`option ${label} repeats another option`);
        seen.add(key);
      });
      if (n <= config.MAX_OPTIONS && parseAnswers(item.answer, n).length === 0) {
        const range = n > 0 ? `"A"–"${LETTERS[n - 1]}" or 0–${n - 1}, or a list of different ones (fewer than the options)` : "no options";
        problems.push(`invalid "answer" (${JSON.stringify(item.answer)}); use ${range}`);
      }
    }

    if (item.id !== undefined && !isText(item.id)) problems.push('"id" must be non-empty text');
    for (const field of ["topic", "explanation", "note"]) {
      if (item[field] !== undefined && item[field] !== null && typeof item[field] !== "string") {
        problems.push(`"${field}" must be text`);
      }
    }
    return problems;
  }

  /**
   * Validates and normalizes the whole bank. Invalid items are dropped and
   * described in `problems`.
   * @returns {{ questions: Question[], problems: Problem[] }}
   *   Question = { id, topic, q, options, answer (first correct index), answers (all correct indexes), explanation }
   *   Problem  = { index, preview, message }   (index -1 = problem with the whole bank)
   */
  function normalize(list, config) {
    const questions = [];
    const problems = [];

    if (!Array.isArray(list)) {
      problems.push({ index: -1, preview: "", message: "window.QUESTIONS is missing or is not a list" });
      return { questions, problems };
    }

    const byId = new Map();
    const byText = new Map();
    list.forEach((item, index) => {
      const preview = item && typeof item.q === "string" ? item.q.trim().slice(0, 60) : "";
      const issues = checkItem(item, config);

      if (issues.length === 0) {
        const id = isText(item.id) ? item.id.trim() : hashId(item.q);
        const key = textKey(item.q);
        if (byId.has(id)) issues.push(`duplicate id "${id}" (same as question #${byId.get(id) + 1})`);
        else if (byText.has(key)) issues.push(`duplicate question (same text as #${byText.get(key) + 1})`);
        else {
          byId.set(id, index);
          byText.set(key, index);
          questions.push({
            id,
            topic: isText(item.topic) ? item.topic.trim() : "",
            q: item.q.trim(),
            options: item.options.map((o) => o.trim()),
            answer: parseAnswers(item.answer, item.options.length)[0],
            answers: parseAnswers(item.answer, item.options.length),
            explanation: isText(item.explanation) ? item.explanation.trim() : "",
          });
        }
      }
      issues.forEach((message) => problems.push({ index, preview, message }));
    });

    return { questions, problems };
  }

  /** Human-readable problem. Question numbers start at 1. */
  function formatProblem(problem) {
    if (problem.index < 0) return problem.message;
    const more = problem.preview.length >= 60 ? "…" : "";
    const preview = problem.preview ? ` ("${problem.preview}${more}")` : "";
    return `Question #${problem.index + 1}${preview}: ${problem.message}`;
  }

  /** Fisher–Yates shuffle (does not mutate the input). */
  function shuffle(items, rng = Math.random) {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  /**
   * Builds a deck of question ids.
   * - Every question appears once; with review on, questions missed more often
   *   than answered (w > r) get up to REVIEW_MAX_COPIES extra copies.
   * - The same question is never placed in adjacent slots, nor first when it
   *   was the last one of the previous deck (`lastId`).
   * - An extra copy that cannot be placed without becoming adjacent to itself
   *   is dropped (every question still appears at least once).
   */
  function buildDeck(questions, config, options = {}) {
    const { stats = {}, lastId = null, rng = Math.random } = options;
    const counts = new Map();
    for (const question of questions) {
      let copies = 1;
      const s = stats[question.id];
      if (config.REVIEW_MISSED && s && s.w > s.r) copies += Math.min(config.REVIEW_MAX_COPIES, s.w - s.r);
      counts.set(question.id, copies);
    }
    return arrange(counts, lastId, rng);
  }

  function arrange(counts, lastId, rng) {
    const left = new Map(counts);
    let total = [...left.values()].reduce((a, b) => a + b, 0);
    const deck = [];
    let prev = lastId;

    while (total > 0) {
      let candidates = [...left].filter(([id, n]) => n > 0 && id !== prev);
      if (candidates.length === 0) {
        // Only the previous question is left. With an empty deck the bank has a
        // single question and repeating is unavoidable; otherwise the leftover
        // extra copies are dropped.
        if (deck.length > 0) break;
        candidates = [[prev, left.get(prev)]];
      }

      // A question holding more than half of what is left must go now, or it
      // could no longer be interleaved with the others.
      const forced = candidates.find(([, n]) => n * 2 > total);
      const [id] = forced || weightedPick(candidates, rng);

      deck.push(id);
      left.set(id, left.get(id) - 1);
      total -= 1;
      prev = id;
    }
    return deck;
  }

  function weightedPick(candidates, rng) {
    const sum = candidates.reduce((acc, [, n]) => acc + n, 0);
    let roll = rng() * sum;
    for (const entry of candidates) {
      roll -= entry[1];
      if (roll < 0) return entry;
    }
    return candidates[candidates.length - 1];
  }

  /** Correct indexes of a normalized question (older saved data may only have `answer`). */
  const correctIndexes = (question) => (Array.isArray(question.answers) ? question.answers : [question.answer]);

  /** The correct answer(s) as text, joined for display: "Amazon EFS + Amazon S3". */
  const answerText = (question) => correctIndexes(question).map((i) => question.options[i]).join(" + ");

  /** Options shuffled for display: [{ text, correct }] in on-screen order. */
  function shuffledOptions(question, rng = Math.random) {
    const items = question.options.map((text, i) => ({ text, correct: correctIndexes(question).includes(i) }));
    return shuffle(items, rng);
  }

  /** Records one showing's result in `stats` ({ [id]: { w, r } }). Does not mutate the input. */
  function recordResult(stats, id, correct) {
    const current = stats[id] || { w: 0, r: 0 };
    const next = correct ? { w: current.w, r: current.r + 1 } : { w: current.w + 1, r: current.r };
    return { ...stats, [id]: next };
  }

  const api = Object.freeze({
    LETTERS,
    textKey,
    hashId,
    parseAnswer,
    parseAnswers,
    correctIndexes,
    answerText,
    checkItem,
    normalize,
    formatProblem,
    shuffle,
    buildDeck,
    shuffledOptions,
    recordResult,
  });

  const NS = (root.AwsCloudQuest = root.AwsCloudQuest || {});
  NS.questions = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
