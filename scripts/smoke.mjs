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
import { readFile, rm, writeFile } from "node:fs/promises";
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
const MONSTERS = ["dino", "dragon", "snake", "gator", "gorilla", "wolf", "spider", "scorpion", "bat", "ptero", "wasp"];

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

/**
 * On-screen indexes of the correct options (two in "choose two" questions),
 * the first of them, and one wrong option, for the current question.
 */
async function optionIndexes(page) {
  return page.evaluate(() => {
    const NS = window.AwsCloudQuest;
    const { questionId } = NS.app.snapshot();
    const question = NS.questions.normalize(window.QUESTIONS, NS.config).questions.find((q) => q.id === questionId);
    const answers = question.answers.map((i) => question.options[i]);
    const texts = [...document.querySelectorAll("#answers .answer-text")].map((el) => el.textContent);
    const rights = answers.map((a) => texts.indexOf(a));
    return { rights, right: rights[0], wrong: texts.findIndex((_, i) => !rights.includes(i)) };
  });
}

async function clickOption(page, index) {
  await page.locator(`#answers .answer[data-index="${index}"]`).click();
  await page.clock.runFor(400); // bullet flight + resolution
}

/**
 * Runs the clock until a question is on screen again: scripted moments (the
 * cheering visitor, the boss announcement) can appear between questions.
 */
async function waitPlay(page) {
  for (let i = 0; i < 40 && (await snapshot(page)).phase !== "play"; i++) await page.clock.runFor(500);
}

/** Answers correctly and waits for the next question. */
async function hit(page) {
  await waitPlay(page);
  const { rights } = await optionIndexes(page);
  for (const index of rights) await clickOption(page, index);
  await page.clock.runFor(1000);
  await waitPlay(page);
}

/** Lets the current monster reach the hero and finish its attack (and the dark Game Over screen, if it was the last life). */
async function letMonsterArrive(page) {
  await waitPlay(page);
  const { travel, progress, speed } = await snapshot(page);
  await page.clock.runFor(Math.ceil(((1 - progress) * travel * 1000) / speed) + 2500);
  if ((await snapshot(page)).phase === "dead") {
    const deathMs = await page.evaluate(() => window.AwsCloudQuest.app.config().DEATH_SCREEN_MS);
    await page.clock.runFor(deathMs + 300);
  }
}

/** Starts a game straight on a question (tests skip the "READY? GO!" intro). */
const startGame = (page, options = {}) => page.evaluate((o) => window.AwsCloudQuest.app.start({ skipIntro: true, ...o }), options);

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
  check(await page.locator("#start-rules").isHidden(), '"Como jogar" starts collapsed');
  await shot(page, `${viewport.name}-1-start`);
  await page.locator("#howto-toggle").click();
  check(await page.locator("#start-rules li").first().isVisible(), '"Como jogar" opens on tap');
  check(await cardFits(page, "ov-start"), "the start card does not overflow with \"Como jogar\" open (the list scrolls inside)");
  await shot(page, `${viewport.name}-1b-start-howto`);
  await page.locator("#howto-toggle").click();
  check(await page.locator("#start-rules").isHidden(), '"Como jogar" closes again');

  // "Jogar" opens "Antes de começar" with nothing pre-selected.
  await page.locator("#btn-play").click();
  check(await page.locator("#ov-setup:not([hidden])").isVisible(), '"Jogar" opens the character and mode picker');
  check((await page.locator("#ov-setup input:checked").count()) === 0, "nothing comes pre-selected");
  check(await page.locator("#btn-begin").isDisabled(), "Começar is disabled until both choices are made");
  const heroChoice = viewport.name === "mobile" ? "female" : "male";
  await page.locator(`#ov-setup .pick-card:has(input[value="${heroChoice}"])`).click();
  check((await snapshot(page)).hero === heroChoice, `the ${heroChoice} character is in the field`);
  check(await page.locator("#btn-begin").isDisabled(), "a character alone does not enable Começar");

  // Difficulty: mobile plays Fácil, desktop plays Avançado.
  const modeChoice = viewport.name === "mobile" ? "easy" : "advanced";
  await page.locator(`#ov-setup .mode-card:has(input[value="${modeChoice}"])`).click();
  const modeConfig = await page.evaluate(() => window.AwsCloudQuest.app.config());
  check(modeConfig.mode === modeChoice, `mode "${modeChoice}" selected`);
  check(await page.locator("#btn-begin").isEnabled(), "character and mode enable Começar");
  if (modeChoice === "easy") {
    check(
      modeConfig.POWER_FREEZE === 5 && modeConfig.POWER_SKIP === 3 && modeConfig.WRONG_LOCK_SECONDS === 5 && modeConfig.WRONG_SPEEDUP === 0.3,
      "Fácil: 5 Gelo, 3 Pular, 5 s lockout, +30% speed"
    );
    check((await page.locator("#freeze-count").textContent()) === "5", "the Gelo button shows the easy-mode count");
  }
  check(await cardFits(page, "ov-setup"), "the picker card fits on screen");
  await shot(page, `${viewport.name}-1c-setup`);

  // "Começar" shows "READY? / GO!" before the first question, and the sound balloon.
  await page.locator("#btn-begin").click();
  await page.clock.runFor(200);
  check(
    (await snapshot(page)).phase === "event" && (await page.locator("#banner").textContent()) === "READY?",
    '"Começar" starts with the READY? banner'
  );
  check(await page.locator("#sound-hint").isVisible(), "a balloon points at the sound button");
  await shot(page, `${viewport.name}-1d-ready`);
  const introMs = await page.evaluate(() => window.AwsCloudQuest.app.config().INTRO_MS);
  await page.clock.runFor(introMs);
  check((await snapshot(page)).phase === "play", "after READY? / GO! the first question starts");
  await page.clock.runFor(5200);
  check(await page.locator("#sound-hint").isHidden(), "the sound balloon closes by itself");

  // Longest question first, to check the layout with 600+ characters.
  const longId = await page.evaluate(() =>
    window.QUESTIONS.reduce((a, b) => (b.q.length > a.q.length ? b : a)).id
  );
  await startGame(page, { questionId: longId, monsterId: "dino" });
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

  // Last life → dark "GAME OVER" screen, then the Game Over card with the answer and the history entry.
  await waitPlay(page);
  s = await snapshot(page);
  await page.clock.runFor(Math.ceil(((1 - s.progress) * s.travel * 1000) / s.speed) + 2500);
  check((await snapshot(page)).phase === "dead" && (await page.locator("#curtain").isVisible()), "losing the last life shows the dark GAME OVER screen first");
  check(await page.locator("#ov-over").isHidden(), "the summary card waits for the dark screen");
  check((await page.locator("#curtain-title").textContent()) === "GAME OVER", "the dark screen always says GAME OVER, even on a new record");
  await page.locator("#curtain").click(); // a tap skips the dark screen
  check(await page.locator("#ov-over:not([hidden])").isVisible(), "losing the last life shows Game Over");
  check(/GAME OVER/.test(await page.locator("#over-title").textContent()), "the card title is GAME OVER");
  check(
    (await page.locator("#over-record").isVisible()) === ((await snapshot(page)).score > 0),
    "a new record shows as a badge on the card (first game with points)"
  );
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

  // PDF: a real file to view or download, with no print dialog.
  page.once("dialog", (d) => {
    errors.push(`unexpected print/browser dialog: ${d.message()}`);
    d.dismiss();
  });
  await page.locator("#btn-pdf").click();
  check(await page.locator("#ov-pdf:not([hidden])").isVisible(), "PDF opens the view / download card");
  const pdfInfo = await page.evaluate(async () => {
    const link = document.getElementById("pdf-download");
    const bytes = new Uint8Array(await (await fetch(link.href)).arrayBuffer());
    return {
      blob: link.href.startsWith("blob:"),
      file: link.download,
      view: document.getElementById("pdf-view").href === link.href,
      header: String.fromCharCode(...bytes.slice(0, 8)),
      size: bytes.length,
    };
  });
  check(
    pdfInfo.blob && /^aws-cloud-quest-relatorio-.*\.pdf$/.test(pdfInfo.file) && pdfInfo.view && pdfInfo.header.startsWith("%PDF-1.4") && pdfInfo.size > 3000,
    `the PDF is generated in the browser (${pdfInfo.file}, ${Math.round(pdfInfo.size / 1024)} KB)`
  );
  if (shotsDir && viewport.name === "desktop") {
    const pdfBytes = await page.evaluate(async () => [...new Uint8Array(await (await fetch(document.getElementById("pdf-download").href)).arrayBuffer())]);
    await writeFile(path.join(shotsDir, "report.pdf"), Buffer.from(pdfBytes));
  }
  await page.locator("#btn-pdf-close").click();
  check(await page.locator("#ov-over:not([hidden])").isVisible(), "Voltar returns from the PDF card to Game Over");
  await page.locator("#btn-home").click();
  check(await page.locator("#ov-leave:not([hidden])").isVisible(), "Início asks to download the report before leaving");
  await page.locator("#btn-leave-cancel").click();
  check(await page.locator("#ov-over:not([hidden])").isVisible(), "Cancelar keeps the Game Over card");

  await page.evaluate(() => (navigator.share = async (data) => (window.__shared = data)));
  await page.locator("#btn-share").click();
  const shared = await page.evaluate(() => window.__shared);
  check(Boolean(shared && /pontos/.test(shared.text) && /^https:\/\//.test(shared.url)), "Compartilhar opens the share sheet with the score and the link");

  // Every monster attacks once and leaves the hero in its end state.
  for (const monsterId of MONSTERS) {
    await startGame(page, { monsterId });
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

  // Power-ups: Gelo freezes the monster, Pular swaps the question.
  await startGame(page, { monsterId: "dino" });
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

  // "Choose two" question: the first right pick is marked, the second one kills the monster.
  const multiId = await page.evaluate(
    () => window.AwsCloudQuest.questions.normalize(window.QUESTIONS, window.AwsCloudQuest.config).questions.find((q) => q.answers.length === 2).id
  );
  await startGame(page, { questionId: multiId, monsterId: "dino" });
  await page.clock.runFor(800);
  check(/Marque 2 · 0 de 2/.test(await page.locator("#q-multi").textContent()), 'a "choose two" question shows "Marque 2 · 0 de 2"');
  const two = (await optionIndexes(page)).rights;
  await clickOption(page, two[0]);
  const afterFirst = await snapshot(page);
  check(
    afterFirst.phase === "play" && afterFirst.correct === 0 && /1 de 2/.test(await page.locator("#q-multi").textContent()),
    "the first right answer counts 1 of 2 and the monster keeps coming"
  );
  check(await page.locator(`#answers .answer[data-index="${two[0]}"]`).isDisabled(), "a right answer already marked cannot be shot again");
  await clickOption(page, two[1]);
  check((await snapshot(page)).correct === 1, "the second right answer kills the monster");

  // Pause: Esc (or the HUD button) stops everything under a dim "JOGO PAUSADO" screen.
  await waitPlay(page);
  await page.keyboard.press("Escape");
  const pausedAt = await snapshot(page);
  check(pausedAt.phase === "paused" && (await page.locator("#pause-screen").isVisible()), "Esc pauses the game: JOGO PAUSADO");
  await page.clock.runFor(4000);
  check(Math.abs((await snapshot(page)).progress - pausedAt.progress) < 1e-6, "nothing moves while paused");
  await shot(page, `${viewport.name}-8a-paused`);
  await page.locator("#btn-resume").click();
  check((await snapshot(page)).phase === "play" && (await page.locator("#pause-screen").isHidden()), "Continuar resumes the game");

  // Easy mode only: "Dica" pauses the game and opens a study card for the question's topic.
  const easy = (await page.evaluate(() => window.AwsCloudQuest.app.config().mode)) === "easy";
  check((await page.locator("#btn-hint").isVisible()) === easy, `the Dica button shows only in the easy mode (${easy ? "easy" : "advanced"})`);
  if (easy) {
    await waitPlay(page);
    await page.keyboard.press("d");
    const paused = await snapshot(page);
    check(paused.phase === "hint" && (await page.locator("#ov-hint:not([hidden])").isVisible()), "Dica opens the study card and pauses the game");
    check((await page.locator("#hint-map .hint-node").count()) >= 3 && (await page.locator("#hint-tips li").count()) >= 1, "the card has memory tricks and a mind map");
    await shot(page, `${viewport.name}-8b-hint`);
    await page.clock.runFor(3000);
    check(Math.abs((await snapshot(page)).progress - paused.progress) < 1e-6, "the monster does not move while the card is open");
    await page.keyboard.press("Escape");
    check((await snapshot(page)).phase === "play", "closing the card resumes the game");
  }

  // Mystery box: swaps the weapon.
  await startGame(page);
  await waitPlay(page);
  const weaponBefore = (await snapshot(page)).weapon;
  await page.evaluate(() => window.AwsCloudQuest.app.trigger("box"));
  check(await page.locator("#weapon-box").isVisible(), "the mystery box appears next to the hero");
  await page.keyboard.press("x");
  await page.clock.runFor(500);
  const armed = await snapshot(page);
  check(armed.weapon !== weaponBefore && !armed.boxReady, `opening the box swaps the weapon (${weaponBefore} → ${armed.weapon})`);
  await page.clock.runFor(1500); // let the "new weapon" balloon fade
  await shot(page, `${viewport.name}-8-new-weapon`);

  // Cheering visitor: questions hidden while the sign is up, then the game goes on.
  await page.evaluate(() => window.AwsCloudQuest.app.trigger("cheer"));
  const visit = await page.evaluate(() => window.AwsCloudQuest.visitor.TIMING);
  await page.clock.runFor(visit.raise + 600);
  check(
    (await snapshot(page)).phase === "event" && (await page.locator(".visitor .v-sign").isVisible()),
    "the visitor stops and raises the sign"
  );
  check(await page.locator("#answers").isHidden(), "the answers are hidden during the visit");
  await shot(page, `${viewport.name}-9-visitor`);
  await page.clock.runFor(visit.end - visit.raise);
  await waitPlay(page);
  check((await snapshot(page)).phase === "play" && (await page.locator(".visitor").count()) === 0, "the visitor leaves and the questions come back");

  // Boss won: two hits out of three rounds.
  const bossConfig = await page.evaluate(() => window.AwsCloudQuest.app.config());
  const beforeBoss = await snapshot(page);
  await page.evaluate(() => window.AwsCloudQuest.app.trigger("boss"));
  await waitPlay(page);
  const bossOn = await snapshot(page);
  check(bossOn.isBoss && bossOn.boss.hp === bossConfig.BOSS_HP, "the boss walks in with its hearts");
  await shot(page, `${viewport.name}-10-boss`);
  for (let i = 0; i < bossConfig.BOSS_HP; i++) await hit(page);
  const afterBoss = await snapshot(page);
  check(
    afterBoss.boss === null && afterBoss.lives > beforeBoss.lives && afterBoss.score >= beforeBoss.score + bossConfig.BOSS_BONUS,
    `beating the boss gives +${bossConfig.BOSS_BONUS} points and +1 life`
  );

  // Boss lost: rocks on each timeout do not take lives; the final smash does.
  await page.evaluate(() => window.AwsCloudQuest.app.trigger("boss"));
  await waitPlay(page);
  const livesInFight = (await snapshot(page)).lives;
  for (let i = 0; i < 120 && ((await snapshot(page)).boss || {}).round === 1; i++) await page.clock.runFor(1000);
  check((await snapshot(page)).lives === livesInFight, "a boss rock does not take a life");
  // Up to 4 rounds of up to ~2 minutes each (long reads and "choose two" questions get extra time).
  for (let i = 0; i < 600 && !["modal", "dead"].includes((await snapshot(page)).phase); i++) await page.clock.runFor(1000);
  const lost = await snapshot(page);
  check(lost.lives === livesInFight - 1 && lost.boss === null, "losing the boss fight costs one life");
  if (lost.phase === "modal") await page.locator("#btn-continue").click();
  else await page.clock.runFor(bossConfig.DEATH_SCREEN_MS + 300);

  // Pause → "Encerrar partida" asks first; Continuar goes back to the game, Encerrar shows the summary.
  await startGame(page);
  await page.keyboard.press("Escape");
  await page.locator("#btn-quit").click();
  check(await page.locator("#quit-confirm").isVisible(), "Encerrar partida asks: Tem certeza que deseja encerrar?");
  await page.locator("#btn-quit-no").click();
  check((await snapshot(page)).phase === "play", "Continuar on the question goes back to the game");
  await page.keyboard.press("Escape");
  await page.locator("#btn-quit").click();
  await page.locator("#btn-quit-yes").click();
  check(
    (await snapshot(page)).phase === "over" && /PARTIDA ENCERRADA/.test(await page.textContent("#over-title")),
    "Encerrar ends the game: PARTIDA ENCERRADA, with the summary and the report"
  );
  await shot(page, `${viewport.name}-10b-quit`);

  // Scenery: changes after SCENE_EVERY correct answers (boss and visitors may show up on the way).
  await startGame(page);
  for (let i = 0; i < bossConfig.SCENE_EVERY; i++) await hit(page);
  const sceneNow = await snapshot(page);
  check(
    sceneNow.scene !== "field" && (await page.locator("#world").getAttribute("data-scene")) === sceneNow.scene,
    `after ${bossConfig.SCENE_EVERY} hits the scenery changes (${sceneNow.scene})`
  );
  await shot(page, `${viewport.name}-11-scene-${sceneNow.scene}`);

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
  const speedLinesInRain = await page.evaluate(() => {
    const monster = document.getElementById("monster");
    monster.classList.add("is-enraged");
    const shown = getComputedStyle(monster, "::before").display !== "none";
    monster.classList.remove("is-enraged");
    return shown;
  });
  check(!speedLinesInRain, "speed lines are hidden while it rains");
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
