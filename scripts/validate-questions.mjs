#!/usr/bin/env node
/**
 * Validates the question bank with the same rules the game uses.
 *
 *   node scripts/validate-questions.mjs                # data/questions.js
 *   node scripts/validate-questions.mjs path/to/file.js
 *
 * Exits with code 1 if any question is invalid or the file cannot be loaded.
 */
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const { loadBank, loadGuide, DEFAULT_BANK, ROOT } = require("./load-bank.js");
const { formatProblem, parseAnswer } = require("../js/questions.js");
const Topics = require("../js/topics.js");

const file = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_BANK;
const shown = path.relative(ROOT, file) || file;

let result;
try {
  result = loadBank(file);
} catch (error) {
  console.error(`✖ Could not load ${shown}:`);
  console.error(String(error.stack || error).split("\n").slice(0, 6).join("\n"));
  process.exit(1);
}

const { questions, problems } = result;

// Topics: a written topic must exist in data/study-guide.js; a missing one is
// classified automatically by the game (reported here so it can be reviewed).
const guide = loadGuide();
const compiled = Topics.compile(guide);
const autoClassified = [];
result.raw.forEach((item, index) => {
  if (!item || typeof item !== "object") return;
  if (item.topic && !guide.topics[item.topic]) {
    problems.push({ index, preview: String(item.q || "").slice(0, 60), message: `unknown "topic" ("${item.topic}"); use one of the topics in data/study-guide.js` });
  } else if (!item.topic) {
    // Raw answers may be letters ("B"); the classifier needs the index.
    const answer = Array.isArray(item.options) ? parseAnswer(item.answer, item.options.length) : -1;
    const topic = answer >= 0 ? Topics.classify({ ...item, answer }, compiled) : null;
    autoClassified.push(`${item.id || `#${index + 1}`} → ${topic || "Outros"}`);
  }
});

if (problems.length > 0) {
  console.error(`✖ ${problems.length} problem(s) in ${shown}:`);
  for (const problem of problems) console.error(`  - ${formatProblem(problem)}`);
  process.exit(1);
}

const byOptions = questions.reduce((acc, q) => ((acc[q.options.length] = (acc[q.options.length] || 0) + 1), acc), {});
const breakdown = Object.entries(byOptions).map(([n, count]) => `${count} with ${n} options`).join(", ");
console.log(`✔ ${questions.length} valid questions in ${shown} (${breakdown})`);
if (autoClassified.length) {
  console.log(`ℹ ${autoClassified.length} question(s) without "topic" will be classified automatically:`);
  autoClassified.forEach((line) => console.log(`  - ${line}`));
}
