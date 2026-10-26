"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const PDF = require("../js/pdf.js");
const R = require("../js/report.js");
const { loadGuide } = require("../scripts/load-bank.js");

const asText = (bytes) => Buffer.from(bytes).toString("latin1");

test("encode: Portuguese letters map to WinAnsi; unsupported symbols get fallbacks", () => {
  assert.deepEqual(PDF.encode("ção"), [0xe7, 0xe3, 0x6f]);
  assert.deepEqual(PDF.encode("—•"), [0x97, 0x95]);
  assert.deepEqual(PDF.encode("✓→"), [43, 45, 62]);
  assert.deepEqual(PDF.encode("漢"), [63]);
});

test("textWidth and wrap: lines never exceed the width; long words are cut", () => {
  const text = "Uma empresa de mídia guarda vídeos brutos de gravações em um bucket do Amazon S3 por sete anos.";
  const lines = PDF.wrap(text, 120, 10);
  assert.ok(lines.length > 1);
  for (const line of lines) assert.ok(PDF.textWidth(line, 10) <= 120, `"${line}" is too wide`);
  const word = PDF.wrap("x".repeat(200), 50, 10);
  assert.ok(word.length > 1 && word.every((l) => PDF.textWidth(l, 10) <= 50));
  assert.ok(PDF.textWidth("WWW", 10, true) > PDF.textWidth("iii", 10, true));
});

test("createDocument: valid structure with a correct xref table", () => {
  const doc = PDF.createDocument({ title: "Teste (1)" });
  doc.addPage();
  doc.text(40, 60, "Olá, relatório (com parênteses) \\ barra");
  doc.rect(40, 80, 100, 10, "#0ca30c");
  doc.link(40, 100, 100, 12, "https://aws.amazon.com/");
  doc.addPage();
  const pdf = asText(doc.build());

  assert.match(pdf, /^%PDF-1\.4\n/);
  assert.match(pdf, /%%EOF\n$/);
  assert.match(pdf, /\/Count 2/);
  assert.match(pdf, /\(Ol\\341, relat\\363rio \\\(com par\\352nteses\\\) \\\\ barra\) Tj/);
  assert.match(pdf, /\/URI \(https:\/\/aws\.amazon\.com\/\)/);

  // Every xref entry must point at the start of its "N 0 obj".
  const xrefAt = Number(pdf.match(/startxref\n(\d+)/)[1]);
  const table = pdf.slice(xrefAt).split("\n");
  const count = Number(table[1].split(" ")[1]);
  for (let n = 1; n < count; n++) {
    const offset = Number(table[2 + n].slice(0, 10));
    assert.ok(pdf.startsWith(`${n} 0 obj`, offset), `object ${n} offset ${offset}`);
  }
});

test("report.toPdf: builds a multi-page report with the area analysis and study links", () => {
  const guide = loadGuide();
  const entry = (i, outcome, topic) => ({
    id: `q${i}`,
    q: `Pergunta número ${i} sobre ${topic}, com um enunciado longo o suficiente para quebrar linha no PDF do relatório.`,
    topic,
    answer: "Resposta certa",
    explanation: "Explicação da resposta.",
    wrongPicks: outcome === "first" ? [] : ["Errada"],
    outcome,
    seconds: 10,
  });
  const log = [];
  // IAM always right (strength), Governança always lost (weak area with study links).
  for (let i = 0; i < 30; i++) log.push(i % 2 ? entry(i, "first", "IAM e identidade") : entry(i, "lost", "Governança e auditoria"));
  const report = { t: Date.UTC(2026, 9, 26, 12), modeLabel: "Fácil", hero: "female", score: 300, correct: 20, misses: 10, accuracy: 67, level: 7, maxStreak: 5, seconds: 600, log };

  const pdf = asText(R.toPdf(report, guide, PDF));
  assert.match(pdf, /^%PDF-1\.4/);
  assert.ok(Number(pdf.match(/\/Count (\d+)/)[1]) >= 2, "a long game spans several pages");
  assert.match(pdf, /\(Desempenho por \\341rea\) Tj/);
  assert.match(pdf, /\/URI \(https:\/\/aws\.amazon\.com\/cloudtrail\/\)/);
  assert.match(pdf, /P\\341gina 1 de \d+/);
});
