"use strict";

/**
 * Loads data/questions.js in Node exactly as the browser does (a classic
 * script that assigns window.QUESTIONS) and runs it through the game's own
 * normalize(), so the CLI, the tests and the game share one set of rules.
 */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const CONFIG = require("../js/config.js");
const Questions = require("../js/questions.js");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_BANK = path.join(ROOT, "data", "questions.js");
const GUIDE_FILE = path.join(ROOT, "data", "study-guide.js");

/** Runs a classic data script in a sandbox and returns the value it assigns to window[name]. */
function readWindowValue(file, name) {
  const sandbox = {};
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(file, "utf8"), sandbox, { filename: path.relative(ROOT, file) || file });
  return sandbox[name] === undefined ? undefined : JSON.parse(JSON.stringify(sandbox[name]));
}

/** data/study-guide.js → window.STUDY_GUIDE. */
function loadGuide(file = GUIDE_FILE) {
  return readWindowValue(file, "STUDY_GUIDE");
}

/** Executes a bank file in a sandbox and returns the raw window.QUESTIONS value. */
function readRawBank(file = DEFAULT_BANK) {
  // Copied out of the sandbox realm, so callers get plain objects/arrays of this realm.
  return readWindowValue(file, "QUESTIONS");
}

/** @returns {{ raw: unknown, questions: object[], problems: object[] }} */
function loadBank(file = DEFAULT_BANK) {
  const raw = readRawBank(file);
  return { raw, ...Questions.normalize(raw, CONFIG) };
}

module.exports = { ROOT, DEFAULT_BANK, GUIDE_FILE, readRawBank, loadBank, loadGuide };
