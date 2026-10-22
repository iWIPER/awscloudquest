#!/usr/bin/env node
/**
 * Runs `node --check` on every JavaScript file of the project
 * (browser scripts, question bank, Node scripts and tests).
 * Cross-platform replacement for a shell loop; exits 1 on the first error.
 */
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dirs = ["js", "data", "scripts", "tests"];

const files = dirs.flatMap((dir) =>
  readdirSync(path.join(root, dir))
    .filter((name) => /\.(m?js)$/.test(name))
    .map((name) => path.join(dir, name))
);

let failed = 0;
for (const file of files) {
  try {
    execFileSync(process.execPath, ["--check", path.join(root, file)], { stdio: "pipe" });
    console.log(`✔ ${file}`);
  } catch (error) {
    failed++;
    console.error(`✖ ${file}\n${error.stderr}`);
  }
}

if (failed) {
  console.error(`\n${failed} file(s) with syntax errors`);
  process.exit(1);
}
console.log(`\n${files.length} files OK`);
