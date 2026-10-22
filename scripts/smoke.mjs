#!/usr/bin/env node
/**
 * Headless smoke test (Playwright, optional dev dependency).
 *
 *   npm install && npx playwright install chromium   (and/or webkit)
 *   node scripts/smoke.mjs [--browser chromium|webkit] [--shots <dir>]
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
import { readFile, rm } from "node:fs/promises";
import path from "node:path";
import { chromium, webkit } from "playwright";
import { startServer } from "./serve.mjs";

const shotsArg = process.argv.indexOf("--shots");
const shotsDir = shotsArg >= 0 ? path.resolve(process.argv[shotsArg + 1]) : null;
if (shotsDir) mkdirSync(shotsDir, { recursive: true });

const VIEWPORTS = [
  { name: "mobile", width: 360, height: 740 },
  { name: "desktop", width: 1280, height: 800 },
];
const MONSTERS = ["dino", "dragon", "snake", "gator", "gorilla"];

let failures = 0;
const check = (ok, message) => {
  console.log(`${ok ? "✔" : "✖"} ${message}`);
  if (!ok) failures++;
};

const { server, url } = await startServer();
// WebKit is the engine of Safari and of every browser on iPhone.
const browserArg = process.argv.indexOf("--browser");
const engineName = browserArg >= 0 ? process.argv[browserArg + 1] : "chromium";
const engine = { chromium, webkit }[engineName];
if (!engine) throw new Error(`Unknown --browser "${engineName}" (use chromium or webkit)`);
console.log(`Engine: ${engineName}`);
const browser = await engine.launch();

/** Real-time pause so CSS animations settle before a screenshot. */
const settle = (page) => page.waitForTimeout(700);

async function shot(page, name) {
  if (!shotsDir) return;
  await settle(page);
  await page.screenshot({ path: path.join(shotsDir, `${name}.png`) });
}

const snapshot = (page) => page.evaluate(() => window.AwsCloudQuest.app.snapshot());

/** True when an overlay's card shows all its content without scrolling the card itself. */
const cardFits = (page, overlayId) =>
  page.evaluate((id) => {
    const card = document.querySelector(`#${id} .card`);
    return card.scrollHeight <= card.clientHeight + 1;
  }, overlayId);

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
  check(await page.locator("#btn-play").isDisabled(), "Play is disabled until a character is chosen");
  const heroChoice = viewport.name === "mobile" ? "female" : "male";
  await page.locator(`.pick-card:has(input[value="${heroChoice}"])`).click();
  check(await page.locator("#btn-play").isEnabled(), `choosing "${heroChoice}" enables Play`);
  check((await snapshot(page)).hero === heroChoice, `the ${heroChoice} character is in the field`);

  // Difficulty: mobile plays Fácil, desktop plays Avançado (the default).
  const modeChoice = viewport.name === "mobile" ? "easy" : "advanced";
  check(await page.locator('input[name="mode"][value="advanced"]').isChecked(), "Avançado is the default mode");
  await page.locator(`.mode-card:has(input[value="${modeChoice}"])`).click();
  const modeConfig = await page.evaluate(() => window.AwsCloudQuest.app.config());
  check(modeConfig.mode === modeChoice, `mode "${modeChoice}" selected`);
  if (modeChoice === "easy") {
    check(
      modeConfig.POWER_FREEZE === 5 && modeConfig.POWER_SKIP === 3 && modeConfig.WRONG_LOCK_SECONDS === 5 && modeConfig.WRONG_SPEEDUP === 0.3,
      "Fácil: 5 Gelo, 3 Pular, 5 s lockout, +30% speed"
    );
    check((await page.locator("#freeze-count").textContent()) === "5", "the Gelo button shows the easy-mode count");
  }
  check(await page.locator("#start-rules").isHidden(), '"Como jogar" starts collapsed');
  await shot(page, `${viewport.name}-1-start`);
  await page.locator("#howto-toggle").click();
  check(await page.locator("#start-rules li").first().isVisible(), '"Como jogar" opens on tap');
  check(
    (await page.locator("#ov-start .pick").isHidden()) && (await page.locator("#ov-start .modes").isHidden()),
    'opening "Como jogar" hides the character and mode pickers'
  );
  check(await cardFits(page, "ov-start"), "the start card does not overflow with \"Como jogar\" open (the list scrolls inside)");
  await shot(page, `${viewport.name}-1b-start-howto`);
  await page.locator("#howto-toggle").click();
  check(await page.locator("#start-rules").isHidden(), '"Como jogar" closes again');
  check(
    (await page.locator("#ov-start .pick").isVisible()) && (await page.locator("#ov-start .modes").isVisible()),
    'closing "Como jogar" brings the pickers back'
  );

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
  const dots = await page.evaluate(() => [...document.querySelectorAll("#hud-fast .dot")].map((d) => d.getBoundingClientRect().width));
  check(dots.length === 3 && dots.every((w) => w > 0), "the HUD shows the three fast-hit dots");
  check(!layout.overflowX && layout.buttons.every(Boolean), "no horizontal overflow with the long question");
  await shot(page, `${viewport.name}-2-long-question`);

  // A miss eliminates the option, locks all answers for WRONG_LOCK_SECONDS and speeds the monster up.
  const lockSeconds = await page.evaluate(() => window.AwsCloudQuest.app.config().WRONG_LOCK_SECONDS);
  const { wrong, right } = await optionIndexes(page);
  await clickOption(page, wrong);
  const afterMiss = await snapshot(page);
  const penaltyVisible = await page.evaluate(() => {
    const sign = document.querySelector(".penalty");
    if (!sign) return false;
    const box = sign.getBoundingClientRect();
    const world = document.getElementById("world").getBoundingClientRect();
    const z = (id) => Number(getComputedStyle(document.getElementById(id)).zIndex);
    return box.top >= world.top && box.bottom <= world.bottom && z("fx") > z("qpanel");
  });
  check(penaltyVisible, "the downgrade sign is inside the world and above the question balloon");
  const expectedSpeed = 1 + (await page.evaluate(() => window.AwsCloudQuest.app.config().WRONG_SPEEDUP));
  check(Math.abs(afterMiss.speed - expectedSpeed) < 1e-9, `a miss makes the monster ${Math.round((expectedSpeed - 1) * 100)}% faster (×${afterMiss.speed})`);
  check(await page.locator("#answers-lock").isVisible(), "a miss shows the lockout banner");
  check(await page.locator(`#answers .answer[data-index="${right}"]`).isDisabled(), "during the lockout no option can be shot");
  await shot(page, `${viewport.name}-2b-miss-penalty`);
  check(afterMiss.lockLeft > lockSeconds - 1, `the lockout lasts ${lockSeconds} s`);
  // The fake clock also flows in real time (screenshots), so wait relative to what is left.
  const { lockLeft } = await snapshot(page);
  await page.clock.runFor(Math.max(0, lockLeft * 1000 - 400));
  check(await page.locator("#answers-lock").isVisible(), `the lockout is still on just before ${lockSeconds} s`);
  await page.clock.runFor(700);
  check(await page.locator("#answers-lock").isHidden(), `the lockout ends after ${lockSeconds} s`);
  check(await page.locator(`#answers .answer[data-index="${right}"]`).isEnabled(), "remaining options are enabled again");
  check(await page.locator(`#answers .answer[data-index="${wrong}"]`).isDisabled(), "the wrong option stays eliminated");

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
  check(await cardFits(page, "ov-over"), "the Game Over card fits on screen (long text scrolls inside)");
  const overStats = await page.evaluate(() => ({
    correct: document.getElementById("over-correct").textContent,
    misses: document.getElementById("over-misses").textContent,
    accuracy: document.getElementById("over-accuracy").textContent,
    time: document.getElementById("over-time").textContent,
  }));
  check(
    Number(overStats.correct) >= 5 && Number(overStats.misses) >= 1 && /%$/.test(overStats.accuracy) && overStats.time !== "0s",
    `Game Over shows the player's stats (${JSON.stringify(overStats)})`
  );
  await shot(page, `${viewport.name}-5-game-over`);
  const history = await page.evaluate(() => JSON.parse(localStorage.getItem("awsCloudQuestHistory") || "[]"));
  check(history.length === 1 && history[0].score === s.score, "the game is saved in the history");

  // History: clearing asks for confirmation inside the card (no browser dialog).
  page.once("dialog", (d) => {
    errors.push(`unexpected browser dialog: ${d.message()}`);
    d.dismiss();
  });
  await page.locator("#btn-history-over").click();
  check(await page.locator("#hist-list li").count() === 1, "history lists the game");
  const [histDownload] = await Promise.all([page.waitForEvent("download"), page.locator('#hist-list button[data-export="md"]').first().click()]);
  check(/^aws-cloud-quest-relatorio-.*\.md$/.test(histDownload.suggestedFilename()), "each history row exports that game's report");
  await page.locator("#btn-history-clear").click();
  check(await page.locator("#hist-confirm").isVisible(), "Limpar asks for confirmation in the card");
  await page.locator("#btn-clear-cancel").click();
  check(await page.locator("#hist-list li").count() === 1, "Cancelar keeps the history");
  await page.locator("#btn-history-clear").click();
  await page.locator("#btn-clear-yes").click();
  check(await page.locator("#hist-list li").count() === 0, "Apagar clears the history");
  await page.locator("#btn-history-close").click();
  check(await page.locator("#ov-over:not([hidden])").isVisible(), "Fechar returns to the Game Over card");

  // Report: Markdown download, printable PDF and the share button.
  const [download] = await Promise.all([page.waitForEvent("download"), page.locator("#btn-md").click()]);
  const markdownPath = path.join(shotsDir || process.cwd(), `${viewport.name}-report.md`);
  await download.saveAs(markdownPath);
  const markdown = await readFile(markdownPath, "utf8");
  if (!shotsDir) await rm(markdownPath);
  check(
    /^aws-cloud-quest-relatorio-\d{4}-\d{2}-\d{2}-\d{4}\.md$/.test(download.suggestedFilename()) &&
      markdown.includes("# AWS Cloud Quest — Relatório da partida") &&
      markdown.includes("## Acertei de primeira") &&
      markdown.includes("**Resposta certa:**"),
    `the .md report downloads with the summary and the questions (${download.suggestedFilename()})`
  );

  await page.evaluate(() => (window.print = () => (window.__printed = true)));
  await page.locator("#btn-pdf").click();
  const printed = await page.evaluate(() => ({
    called: window.__printed === true,
    items: document.querySelectorAll("#report .report-item").length,
    bars: document.querySelectorAll("#report .report-bar rect").length,
  }));
  check(printed.called && printed.items >= 5 && printed.bars >= 1, `PDF: the printable report has the chart and ${printed.items} questions`);
  if (shotsDir && viewport.name === "desktop") {
    await page.emulateMedia({ media: "print" });
    // page.pdf() is Chromium-only; other engines still get the print-media screenshot.
    if (engineName === "chromium") {
      await page.pdf({ path: path.join(shotsDir, "report.pdf"), format: "A4", printBackground: true });
    }
    await page.screenshot({ path: path.join(shotsDir, "report-print.png"), fullPage: true });
    await page.emulateMedia({ media: "screen" });
  }

  await page.evaluate(() => (navigator.share = async (data) => (window.__shared = data)));
  await page.locator("#btn-share").click();
  const shared = await page.evaluate(() => window.__shared);
  check(Boolean(shared && /pontos/.test(shared.text) && /^https:\/\//.test(shared.url)), "Compartilhar opens the share sheet with the score and the link");

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

  // Power-ups: Gelo freezes the monster, Pular swaps the question; two of each per game.
  await page.evaluate(() => window.AwsCloudQuest.app.start({ monsterId: "dino" }));
  await page.clock.runFor(1000);
  const { FREEZE_SECONDS: freezeSeconds, POWER_FREEZE: freezeCharges, POWER_SKIP: skipCharges } = await page.evaluate(
    () => window.AwsCloudQuest.app.config()
  );
  await page.locator("#btn-freeze").click();
  const frozenAt = await snapshot(page);
  check(frozenAt.frozenLeft > 0 && frozenAt.powers.freeze === freezeCharges - 1, "Gelo freezes the monster and uses one charge");
  check(await page.locator("#monster .m-ice").count() === 1, "the frozen monster is inside an ice cube");
  await shot(page, `${viewport.name}-8-frozen`);
  await page.clock.runFor(3000);
  const stillFrozen = await snapshot(page);
  check(Math.abs(stillFrozen.progress - frozenAt.progress) < 1e-6, "a frozen monster does not move");
  await page.clock.runFor((stillFrozen.frozenLeft + 0.5) * 1000);
  const thawed = await snapshot(page);
  check(thawed.frozenLeft === 0, `the ice melts after ${freezeSeconds} s`);
  await page.clock.runFor(1000);
  check((await snapshot(page)).progress > thawed.progress, "the monster walks again after thawing");

  const beforeSkip = await snapshot(page);
  await page.keyboard.press("p");
  await page.clock.runFor(1200);
  const afterSkip = await snapshot(page);
  check(
    afterSkip.questionId !== beforeSkip.questionId && afterSkip.lives === beforeSkip.lives && afterSkip.score === beforeSkip.score,
    "Pular (key P) swaps the question without losing a life or scoring"
  );
  check(afterSkip.powers.skip === skipCharges - 1, "Pular uses one charge");
  // Use the remaining Gelo charges (each one waits for the previous ice to melt).
  for (let left = (await snapshot(page)).powers.freeze; left > 0; left--) {
    await page.keyboard.press("g");
    await page.clock.runFor(200);
    if (left > 1) await page.clock.runFor(((await snapshot(page)).frozenLeft + 0.5) * 1000);
  }
  check((await snapshot(page)).powers.freeze === 0 && (await page.locator("#btn-freeze").isDisabled()), "Gelo runs out after all its charges");

  // Sound toggle (button and M key) and ambience: night, rain and birds.
  await page.locator("#ov-over").evaluate((el) => (el.hidden = true));
  await page.evaluate(() => document.getElementById("app").removeAttribute("inert"));
  const mutedBefore = (await snapshot(page)).muted;
  await page.locator("#btn-sound").click();
  check((await snapshot(page)).muted === !mutedBefore, "the sound button toggles mute");
  await page.keyboard.press("m");
  check((await snapshot(page)).muted === mutedBefore, "the M key toggles mute back");

  await page.evaluate(() => window.AwsCloudQuest.scene.set({ time: 0.2, rain: false, bird: true }));
  await page.evaluate(() => window.AwsCloudQuest.scene.set({ critter: "bunny" }));
  await page.evaluate(() => window.AwsCloudQuest.scene.set({ critter: "squirrel" }));
  await page.clock.runFor(100);
  check((await page.locator(".bird").count()) > 0, "birds fly across the sky by day");
  check(
    (await page.locator(".critter-bunny").count()) > 0 && (await page.locator(".critter-squirrel").count()) > 0,
    "bunnies and squirrels hop along the ground"
  );
  await shot(page, `${viewport.name}-6-day-birds`);
  await page.evaluate(() => window.AwsCloudQuest.scene.set({ time: 0.7, rain: true }));
  await page.clock.runFor(100);
  const scene = (await snapshot(page)).ambient;
  check(scene.night === 1 && scene.rain === true, "night and rain can happen");
  check(await page.locator("#world.is-night.is-rain").count() === 1, "the world shows night and rain");
  await shot(page, `${viewport.name}-7-night-rain`);
  await page.evaluate(() => window.AwsCloudQuest.scene.set({ time: 0.1, rain: false }));

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
