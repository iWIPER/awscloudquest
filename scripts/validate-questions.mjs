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
const { loadBank, DEFAULT_BANK, ROOT } = require("./load-bank.js");
const { formatProblem } = require("../js/questions.js");

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
if (problems.length > 0) {
  console.error(`✖ ${problems.length} problem(s) in ${shown}:`);
  for (const problem of problems) console.error(`  - ${formatProblem(problem)}`);
  process.exit(1);
}

const byOptions = questions.reduce((acc, q) => ((acc[q.options.length] = (acc[q.options.length] || 0) + 1), acc), {});
const breakdown = Object.entries(byOptions).map(([n, count]) => `${count} with ${n} options`).join(", ");
console.log(`✔ ${questions.length} valid questions in ${shown} (${breakdown})`);
