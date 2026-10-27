#!/usr/bin/env node
/**
 * Imports questions from a JSON file into data/questions.js.
 *
 *   node scripts/import-questions.mjs bank.json --prefix sim01 [--dry-run]
 *
 * Accepted input:
 *   - { "perguntas": [ { numero, pergunta, alternativas: [{ letra, texto }],
 *                        corretas: ["B"], explicacao, aviso } ] }
 *   - { "questoes": [ { id, pergunta, alternativas: { "A": "…" },
 *                       resposta: "A" | ["A", "C"]  (or resposta_correta), revisao } ] }
 *   - [ { id?, topic?, q, options, answer, explanation? } ]   (the game's own format)
 *
 * Rules:
 *   - Answers are copied exactly as given; nothing is inferred or fixed.
 *   - "Selecione DUAS" questions keep all their answers: answer: ["A", "C"].
 *   - Questions whose id or text already exist in the bank are skipped
 *     (same text, ignoring case and spaces); a different question with the same
 *     answer is kept.
 *   - `aviso` / `revisao` is kept as `note` (not shown in the game) so it can be reviewed.
 *   - Each new question gets a `topic` from the automatic classifier (js/topics.js),
 *     listed at the end so it can be reviewed.
 *   - Every new item is validated with the game's rules before anything is written.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const CONFIG = require("../js/config.js");
const Questions = require("../js/questions.js");
const { readRawBank, loadGuide, DEFAULT_BANK, ROOT } = require("./load-bank.js");
const Topics = require("../js/topics.js");

// New questions get a topic from the classifier (see js/topics.js) unless they bring a valid one.
const guide = loadGuide();
const compiledTopics = Topics.compile(guide);

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
const source = Array.isArray(data) ? data : data.perguntas || data.questoes;
if (!Array.isArray(source)) {
  console.error('✖ Expected a JSON array or an object with a "perguntas" or "questoes" array.');
  process.exit(1);
}

/** Converts one source item to the game format, or returns { skip: reason }. */
function convert(item, position) {
  if (!("pergunta" in item)) return { item }; // already in the game format

  // Practice-exam exports come in a few shapes: options as [{ letra, texto }] or
  // { "A": "…" }; the key in "corretas", "resposta" or "resposta_correta" (a
  // letter or a list); the number in "numero" or "id"; a review flag in
  // "aviso" or "revisao".
  const answerField = item.corretas ?? item.resposta ?? item.resposta_correta;
  const correct = (Array.isArray(answerField) ? answerField : answerField ? [answerField] : []).map((l) => String(l).trim().toUpperCase());
  const number = item.numero ?? item.id ?? position + 1;
  const label = `#${number}`;
  if (correct.length === 0) return { skip: `${label}: no correct answer` };

  const choices = Array.isArray(item.alternativas)
    ? item.alternativas.map((a) => [String(a.letra).trim().toUpperCase(), a.texto])
    : Object.entries(item.alternativas || {}).map(([letter, text]) => [letter.trim().toUpperCase(), text]).sort((a, b) => a[0].localeCompare(b[0]));
  const options = choices.map(([, text]) => text);
  const letters = choices.map(([letter]) => letter);
  const indexes = correct.map((letter) => letters.indexOf(letter));
  const missing = correct.find((letter, i) => indexes[i] < 0);
  if (missing) return { skip: `${label}: correct letter "${missing}" not found among the options` };

  // One answer → "B"; "choose two" → ["A", "E"] (letters follow the option order kept here).
  const answer = indexes.length === 1 ? Questions.LETTERS[indexes[0]] : indexes.map((i) => Questions.LETTERS[i]);
  const out = { id: `${prefix}-${String(number).padStart(2, "0")}`, topic: "", q: item.pergunta, options, answer };
  if (item.explicacao) out.explanation = item.explicacao;
  const review = item.revisao;
  if (item.aviso) out.note = item.aviso;
  else if (typeof review === "string") out.note = review;
  else if (review) {
    // { gabarito_sugerido: ["C"], motivo: "…" }: keep both, the answer key itself is not changed.
    const suggested = [].concat(review.gabarito_sugerido || []).join(" e ");
    out.note = `Revisar gabarito: o simulado marca ${correct.join(" e ")}${suggested ? `; a documentação da AWS sugere ${suggested}` : ""}. ${review.motivo || ""}`.trim();
  }
  return { item: out };
}

const existing = readRawBank(DEFAULT_BANK) || [];
const existingIds = new Set(existing.map((q) => q && q.id).filter(Boolean));
const existingTexts = new Set(existing.map((q) => q && typeof q.q === "string" && Questions.textKey(q.q)));

const added = [];
const skipped = [];
const flagged = [];
const classified = [];
source.forEach((raw, position) => {
  const { item, skip } = convert(raw, position);
  if (skip) return skipped.push(skip);

  const label = item.id || `#${position + 1}`;
  if (!item.topic || !guide.topics[item.topic]) {
    const answers = Questions.parseAnswers(item.answer, Array.isArray(item.options) ? item.options.length : 0);
    item.topic = (answers.length > 0 && Topics.classify({ ...item, answer: answers[0], answers }, compiledTopics)) || "";
    if (!item.topic) delete item.topic; // no keyword matched: leave it for review
    classified.push(`${label} → ${item.topic || "(sem tema: revisar)"}`);
  }
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
const newIds = new Set(added.map((q) => q.id));
const classifiedNew = classified.filter((line) => newIds.has(line.split(" → ")[0]));
if (classifiedNew.length) {
  console.log("Topics assigned automatically (review; edit `topic` in data/questions.js to change):");
  classifiedNew.forEach((s) => console.log(`  - ${s}`));
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
