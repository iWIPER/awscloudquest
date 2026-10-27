"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const T = require("../js/topics.js");
const { loadBank, loadGuide } = require("../scripts/load-bank.js");

const guide = loadGuide();
const compiled = T.compile(guide);
const ask = (q, answer, explanation = "", options = []) => ({ q, options, answer, explanation });

test("study guide: every topic has a known domain, study items, https links and keywords", () => {
  assert.equal(guide.domains.length, 4);
  for (const [name, info] of Object.entries(guide.topics)) {
    assert.ok(guide.domains.includes(info.domain), `${name}: unknown domain ${info.domain}`);
    assert.ok(info.study.length > 0, `${name}: no study items`);
    assert.ok(info.links.length > 0 && info.links.every((l) => /^https:\/\/(aws\.amazon\.com|docs\.aws\.amazon\.com)\//.test(l.url)), `${name}: links must be official AWS https URLs`);
    assert.ok(info.keywords.length >= 3, `${name}: needs keywords for the classifier`);
  }
});

test("plain: lowercases and strips accents and punctuation", () => {
  assert.equal(T.plain("Região, ÁREA-geográfica!"), " regiao area geografica ");
});

test("classify: picks the topic of well-known services", () => {
  assert.equal(T.classify(ask("Qual serviço registra chamadas de API?", "AWS CloudTrail"), compiled), "Governança e auditoria");
  assert.equal(T.classify(ask("Qual serviço faz consultas SQL em dados no S3?", "Amazon Athena"), compiled), "Análise de dados");
  assert.equal(T.classify(ask("Como proteger o usuário-raiz?", "Ativar a MFA"), compiled), "IAM e identidade");
  assert.equal(T.classify(ask("Qual opção de compra é a mais barata para lotes interrompíveis?", "Instâncias spot"), compiled), "Preços e compras");
});

test("classify: the correct answer weighs more than the question text", () => {
  // The question talks about S3 (Armazenamento), but the answer is a data-protection service.
  const question = ask("A empresa guarda dados no Amazon S3 e quer saber quais são sensíveis.", "Amazon Macie");
  assert.equal(T.classify(question, compiled), "Proteção de dados");
});

test("classify: matches whole words only and works with an answer index", () => {
  assert.equal(T.classify(ask("Texto sem nenhum termo conhecido", "Resposta qualquer"), compiled), null);
  assert.equal(T.classify(ask("Qual é a melhor opção?", 1, "", ["Amazon EC2", "Amazon DynamoDB"]), compiled), "Banco de dados");
});

test("topicOf: a known topic in the bank wins; unknown or missing topics are classified", () => {
  const base = ask("Qual serviço registra chamadas de API?", "AWS CloudTrail");
  assert.equal(T.topicOf({ ...base, topic: "Computação" }, guide, compiled), "Computação");
  assert.equal(T.topicOf({ ...base, topic: "Tema inventado" }, guide, compiled), "Governança e auditoria");
  assert.equal(T.topicOf(base, guide, compiled), "Governança e auditoria");
});

test("classifier agrees with the hand-picked topics of the bank on most questions", () => {
  const { questions } = loadBank();
  const agree = questions.filter((q) => T.classify(q, compiled) === q.topic).length;
  assert.ok(agree / questions.length >= 0.85, `only ${agree}/${questions.length} agree`);
});

test("study guide follows the official exam guide: weights, task statements, hints", () => {
  assert.equal(Object.values(guide.weights).reduce((a, b) => a + b, 0), 100);
  assert.deepEqual(Object.keys(guide.weights), guide.domains);
  for (const [name, info] of Object.entries(guide.topics)) {
    assert.ok(guide.tasks[info.task], `${name}: unknown task "${info.task}"`);
    assert.equal(info.task[0], String(guide.domains.indexOf(info.domain) + 1), `${name}: task ${info.task} is outside its domain`);
    assert.ok(info.tips.length >= 1 && info.map.length >= 3, `${name}: needs tips and a mind map for the study hint`);
    assert.ok(info.map.every((pair) => Array.isArray(pair) && pair.length === 2), `${name}: map items are [service, what it does]`);
  }
});
