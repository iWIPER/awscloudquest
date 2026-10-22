#!/usr/bin/env node
/**
 * Headless smoke test (Playwright, optional dev dependency).
 *
 *   npm install && npx playwright install chromium
 *   node scripts/smoke.mjs [--shots <dir>]
 *
 * Uses Playwright's fake clock, so whole games run in seconds. For each
 * viewport (360 px and 1280 px) it checks that the page loads without console
 * errors, a 600+ character question fits without horizontal scroll, a miss
 * locks the option, a hit scores, three fast hits give a life, losing a life
 * shows the answer, and the game reaches Game Over. It also runs every
 * monster's attack once. --shots saves screenshots along the way.
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { startServer } from "./serve.mjs";

const shotsArg = process.argv.indexOf("--shots");
const shotsDir = shotsArg >= 0 ? path.resolve(process.argv[shotsArg + 1]) : null;
if (shotsDir) mkdirSync(shotsDir, { recursive: true });

const VIEWPORTS = [
  { name: "mobile", width: 360, height: 740 },
  { name: "desktop", width: 1280, height: 800 },
];
const MONSTERS = ["dino", "dragon", "snake", "gator"];

let failures = 0;
const check = (ok, message) => {
  console.log(`${ok ? "✔" : "✖"} ${message}`);
  if (!ok) failures++;
};

const { server, url } = await startServer();
const browser = await chromium.launch();

/** Real-time pause so CSS animations settle before a screenshot. */
const settle = (page) => page.waitForTimeout(700);

async function shot(page, name) {
  if (!shotsDir) return;
  await settle(page);
  await page.screenshot({ path: path.join(shotsDir, `${name}.png`) });
}

const snapshot = (page) => page.evaluate(() => window.AwsCloudQuest.app.snapshot());

/** Index (on screen) of the correct and of one wrong option for the current question. */
async function optionIndexes(page) {
  return page.evaluate(() => {
    const NS = window.AwsCloudQuest;
    const { questionId } = NS.app.snapshot();
    const question = NS.questions.normalize(window.QUESTIONS, NS.config).questions.find((q) => q.id === questionId);
    const answer = question.options[question.answer];
    const texts = [...document.querySelectorAll("#answers .answer-text")].map((el) => el.textContent);
    const right = texts.indexOf(answer);
    return { right, wrong: texts.findIndex((_, i) => i !== right) };
  });
}

async function clickOption(page, index) {
  await page.locator(`#answers .answer[data-index="${index}"]`).click();
  await page.clock.runFor(400); // bullet flight + resolution
}

/** Answers correctly and waits for the next question. */
async function hit(page) {
  const { right } = await optionIndexes(page);
  await clickOption(page, right);
  await page.clock.runFor(1000);
}

/** Lets the current monster reach the hero and finish its attack. */
async function letMonsterArrive(page) {
  const { travel, progress } = await snapshot(page);
  await page.clock.runFor(Math.ceil((1 - progress) * travel * 1000) + 2500);
}

for (const viewport of VIEWPORTS) {
  console.log(`\n— ${viewport.name} (${viewport.width}×${viewport.height})`);
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));

  await page.clock.install();
  await page.goto(url);
  await page.locator("#ov-start:not([hidden])").waitFor();
  check(await page.locator("#btn-play").isEnabled(), "start screen shows an enabled Play button");
  await shot(page, `${viewport.name}-1-start`);

  // Longest question first, to check the layout with 600+ characters.
  const longId = await page.evaluate(() =>
    window.QUESTIONS.reduce((a, b) => (b.q.length > a.q.length ? b : a)).id
  );
  await page.evaluate((id) => window.AwsCloudQuest.app.start({ questionId: id, monsterId: "dino" }), longId);
  await page.clock.runFor(1500);
  const layout = await page.evaluate(() => ({
    overflowX: document.documentElement.scrollWidth > window.innerWidth,
    buttons: [...document.querySelectorAll("#answers .answer")].map((b) => b.getBoundingClientRect().right <= window.innerWidth),
    textLength: document.getElementById("q-text").textContent.length,
  }));
  check(layout.textLength >= 600 && layout.buttons.length === 5, "long question (600+ chars, 5 options) is shown");
  check(!layout.overflowX && layout.buttons.every(Boolean), "no horizontal overflow with the long question");
  await shot(page, `${viewport.name}-2-long-question`);

  // A miss locks the option and pushes the monster.
  const before = await snapshot(page);
  const { wrong } = await optionIndexes(page);
  await clickOption(page, wrong);
  const afterMiss = await snapshot(page);
  check(await page.locator(`#answers .answer[data-index="${wrong}"]`).isDisabled(), "a wrong option gets locked");
  check(afterMiss.progress > before.progress + 0.07, "a miss pushes the monster forward");

  // A hit after a miss scores but is not fast.
  await hit(page);
  let s = await snapshot(page);
  check(s.score > 0 && s.correct === 1 && s.fast === 0, "a hit after a miss scores without a fast dot");

  // Panel auto-closes after QUESTION_AUTOCLOSE seconds and reopens with Q.
  await page.clock.runFor(21000);
  check(!(await snapshot(page)).panelOpen, "question panel closes by itself after 20 s");
  await page.keyboard.press("q");
  check((await snapshot(page)).panelOpen, "Q reopens the question panel");

  // This question has been on screen for 20+ s, so this hit is not fast.
  await hit(page);
  s = await snapshot(page);
  check(s.correct === 2 && s.fast === 0, "a hit after FAST_SECONDS is not a fast hit");

  // Three fast hits → +1 life (starts with 1).
  await hit(page);
  await hit(page);
  await hit(page);
  s = await snapshot(page);
  check(s.lives === 2 && s.fast === 0, "three fast hits give +1 life");
  await shot(page, `${viewport.name}-3-playing`);

  // Losing a life with lives left shows the answer, then the game goes on.
  await letMonsterArrive(page);
  check(await page.locator("#ov-life:not([hidden])").isVisible(), "losing a life shows the life-lost card");
  check((await page.locator("#life-a").textContent()).length > 0, "life-lost card shows the right answer");
  await shot(page, `${viewport.name}-4-life-lost`);
  await page.keyboard.press("Enter");
  await page.clock.runFor(2000);
  s = await snapshot(page);
  check(s.phase === "play" && s.lives === 1, "Continue resumes the game with one life less");

  // Last life → Game Over with the answer and the history entry.
  await letMonsterArrive(page);
  check(await page.locator("#ov-over:not([hidden])").isVisible(), "losing the last life shows Game Over");
  check((await page.locator("#over-a").textContent()).length > 0, "Game Over shows the right answer");
  await shot(page, `${viewport.name}-5-game-over`);
  const history = await page.evaluate(() => JSON.parse(localStorage.getItem("awsCloudQuestHistory") || "[]"));
  check(history.length === 1 && history[0].score === s.score, "the game is saved in the history");

  // Every monster attacks once and leaves the hero in its end state.
  for (const monsterId of MONSTERS) {
    await page.evaluate((id) => window.AwsCloudQuest.app.start({ monsterId: id }), monsterId);
    await page.clock.runFor(200);
    check((await snapshot(page)).monsterId === monsterId, `${monsterId} walks in`);
    await letMonsterArrive(page);
    const fate = await page.evaluate(() => document.getElementById("hero").className);
    check(/fate-/.test(fate), `${monsterId} attack leaves the hero in an end state (${fate})`);
    if (viewport.name === "desktop") {
      await page.locator("#ov-over").evaluate((el) => (el.hidden = true)); // peek at the field
      await shot(page, `${viewport.name}-attack-${monsterId}`);
    }
  }

  check(errors.length === 0, `no console errors${errors.length ? `: ${errors.join(" | ")}` : ""}`);
  await context.close();
}

await browser.close();
server.close();

if (failures) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log("\nSmoke test passed");
