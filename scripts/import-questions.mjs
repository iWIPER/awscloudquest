#!/usr/bin/env node
/**
 * Imports questions from a JSON file into data/questions.js.
 *
 *   node scripts/import-questions.mjs bank.json --prefix sim01 [--dry-run]
 *
 * Accepted input (either form):
 *   - { "perguntas": [ { numero, pergunta, selecione, alternativas: [{ letra, texto }],
 *                        corretas: ["B"], explicacao, aviso } ] }
 *   - [ { id?, topic?, q, options, answer, explanation? } ]   (the game's own format)
 *
 * Rules:
 *   - Answers are copied exactly as given; nothing is inferred or fixed.
 *   - Questions with more than one correct answer ("Selecione DUAS") are skipped:
 *     multi-answer questions are not supported yet (see README roadmap).
 *   - Questions whose id or text already exist in the bank are skipped.
 *   - `aviso` is kept as `note` (not shown in the game) so it can be reviewed later.
 *   - Every new item is validated with the game's rules before anything is written.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const CONFIG = require("../js/config.js");
const Questions = require("../js/questions.js");
const { readRawBank, DEFAULT_BANK, ROOT } = require("./load-bank.js");

const args = process.argv.slice(2);
const input = args.find((a) => !a.startsWith("--"));
const prefixArg = args.indexOf("--prefix");
const prefix = prefixArg >= 0 ? args[prefixArg + 1] : "imported";
const dryRun = args.includes("--dry-run");

if (!input || !prefix) {
  console.error("Usage: node scripts/import-questions.mjs <file.json> --prefix <id-prefix> [--dry-run]");
  process.exit(2);
}

const data = JSON.parse(readFileSync(path.resolve(input), "utf8"));
const source = Array.isArray(data) ? data : data.perguntas;
if (!Array.isArray(source)) {
  console.error('✖ Expected a JSON array or an object with a "perguntas" array.');
  process.exit(1);
}

/** Converts one source item to the game format, or returns { skip: reason }. */
function convert(item, position) {
  if (!("pergunta" in item)) return { item }; // already in the game format

  const correct = Array.isArray(item.corretas) ? item.corretas : [];
  const label = `#${item.numero ?? position + 1}`;
  if (correct.length !== 1) return { skip: `${label}: ${correct.length} correct answers (multi-answer not supported yet)` };

  const options = (item.alternativas || []).map((a) => a.texto);
  const letters = (item.alternativas || []).map((a) => a.letra);
  const answerIndex = letters.indexOf(correct[0]);
  if (answerIndex < 0) return { skip: `${label}: correct letter "${correct[0]}" not found among the options` };

  const out = { id: `${prefix}-${String(item.numero ?? position + 1).padStart(2, "0")}`, q: item.pergunta, options, answer: Questions.LETTERS[answerIndex] };
  if (item.explicacao) out.explanation = item.explicacao;
  if (item.aviso) out.note = item.aviso;
  return { item: out };
}

const existing = readRawBank(DEFAULT_BANK) || [];
const existingIds = new Set(existing.map((q) => q && q.id).filter(Boolean));
const existingTexts = new Set(existing.map((q) => q && typeof q.q === "string" && Questions.textKey(q.q)));

const added = [];
const skipped = [];
const flagged = [];
source.forEach((raw, position) => {
  const { item, skip } = convert(raw, position);
  if (skip) return skipped.push(skip);

  const label = item.id || `#${position + 1}`;
  const problems = Questions.checkItem(item, CONFIG);
  if (problems.length) return skipped.push(`${label}: ${problems.join("; ")}`);
  if (item.id && existingIds.has(item.id)) return skipped.push(`${label}: id already in the bank`);
  if (existingTexts.has(Questions.textKey(item.q))) return skipped.push(`${label}: same text already in the bank`);

  existingIds.add(item.id);
  existingTexts.add(Questions.textKey(item.q));
  added.push(item);
  if (item.note) flagged.push(`${label}: ${item.note}`);
});

console.log(`Added:   ${added.length}`);
console.log(`Skipped: ${skipped.length}`);
skipped.forEach((s) => console.log(`  - ${s}`));
if (flagged.length) {
  console.log(`Imported with a note (review the answer key):`);
  flagged.forEach((s) => console.log(`  - ${s}`));
}

if (dryRun || added.length === 0) {
  console.log(dryRun ? "\nDry run: nothing written." : "\nNothing to write.");
  process.exit(0);
}

// Append the new blocks right before the closing "];" of window.QUESTIONS.
const bankText = readFileSync(DEFAULT_BANK, "utf8");
const end = bankText.lastIndexOf("];");
if (end < 0) {
  console.error("✖ Could not find the closing \"];\" in data/questions.js");
  process.exit(1);
}
const blocks = added.map((item) => "  " + JSON.stringify(item, null, 2).replace(/\n/g, "\n  ") + ",\n").join("");
writeFileSync(DEFAULT_BANK, bankText.slice(0, end) + blocks + bankText.slice(end));
console.log(`\n✔ Wrote ${added.length} question(s) to ${path.relative(ROOT, DEFAULT_BANK)}. Run: npm run validate`);
