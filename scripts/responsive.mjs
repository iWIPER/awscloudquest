#!/usr/bin/env node
/**
 * Responsive layout check (Playwright, optional dev dependency).
 *
 *   node scripts/responsive.mjs [--browser chromium|webkit] [--shots <dir>]
 *
 * Viewports are the area a page really gets: on phones that is the screen minus
 * the browser's address and tool bars (for example, an iPhone 14 in Safari shows
 * 390×664 CSS px of its 390×844 screen). On every size it checks that:
 *   - nothing scrolls sideways;
 *   - the HUD, the playing field and the first answer button are on screen;
 *   - every card (start, life lost, Game Over, history, areas) fits inside the
 *     screen; long content may scroll inside the card, but never off screen.
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium, webkit } from "playwright";
import { startServer } from "./serve.mjs";

const VIEWPORTS = [
  { name: "small-android", width: 320, height: 480, mobile: true },
  { name: "android", width: 360, height: 640, mobile: true },
  { name: "iphone-se-safari", width: 375, height: 553, mobile: true },
  { name: "iphone-14-safari", width: 390, height: 664, mobile: true },
  { name: "iphone-pro-max-safari", width: 430, height: 739, mobile: true },
  { name: "iphone-landscape", width: 844, height: 340, mobile: true },
  { name: "ipad", width: 768, height: 1024, mobile: true },
  { name: "laptop-short", width: 1280, height: 600 },
  { name: "laptop", width: 1366, height: 657 },
  { name: "full-hd", width: 1920, height: 969 },
];

const browserArg = process.argv.indexOf("--browser");
const engineName = browserArg >= 0 ? process.argv[browserArg + 1] : "chromium";
const engine = { chromium, webkit }[engineName];
if (!engine) throw new Error(`Unknown --browser "${engineName}"`);
const shotsArg = process.argv.indexOf("--shots");
const shotsDir = shotsArg >= 0 ? path.resolve(process.argv[shotsArg + 1]) : null;
if (shotsDir) mkdirSync(shotsDir, { recursive: true });

let failures = 0;
const check = (ok, message) => {
  if (!ok) {
    failures++;
    console.log(`  ✖ ${message}`);
  }
};

/** Layout facts measured inside the page. */
const measure = (page, overlayId) =>
  page.evaluate((id) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const inside = (r) => r.top >= -1 && r.left >= -1 && r.bottom <= vh + 1 && r.right <= vw + 1;
    const facts = { sideways: document.documentElement.scrollWidth > vw + 1 };
    if (id) {
      const card = document.querySelector(`#${id} .card`);
      const r = card.getBoundingClientRect();
      facts.cardInside = inside(r);
      facts.cardSideways = card.scrollWidth > card.clientWidth + 1;
      facts.cardScrolls = card.scrollHeight > card.clientHeight + 1;
      // The card's own buttons must be reachable: inside the screen, possibly after scrolling the card.
      const actions = [...card.querySelectorAll(":scope > .card-actions .btn")].filter((b) => b.offsetParent);
      facts.actionsReachable = actions.every((b) => {
        const br = b.getBoundingClientRect();
        return br.left >= r.left - 1 && br.right <= r.right + 1;
      });
    } else {
      const rect = (sel) => document.querySelector(sel).getBoundingClientRect();
      facts.hudInside = inside(rect(".hud"));
      facts.fieldHeight = Math.round(rect("#field").height);
      const first = document.querySelector("#answers .answer");
      facts.answerInside = first ? inside(first.getBoundingClientRect()) : false;
      facts.powersInside = inside(rect(".powers"));
      // The open question balloon must not cover the power-up buttons.
      facts.panelClearsPowers = rect("#qpanel").bottom <= rect(".powers").top + 1;
      // Hidden options must be signalled ("▼ mais alternativas").
      const answers = document.getElementById("answers");
      const overflowing = answers.scrollHeight - answers.clientHeight > 4;
      facts.moreHintOk = !overflowing || answers.parentElement.classList.contains("has-more");
    }
    return facts;
  }, overlayId);

const { server, url } = await startServer();
const browser = await engine.launch();
console.log(`Engine: ${engineName}`);

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    ...(vp.mobile && engineName === "chromium" ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}),
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.clock.install();
  await page.goto(url);
  await page.evaluate(() => {
    localStorage.setItem("awsCloudQuestHero", JSON.stringify("female"));
  });
  await page.reload();
  const label = `${vp.name} (${vp.width}×${vp.height})`;
  const before = failures;
  const shot = async (name) => shotsDir && page.screenshot({ path: path.join(shotsDir, `${vp.name}-${name}.png`) });

  // Start card, with "Como jogar" closed and open.
  let m = await measure(page, "ov-start");
  check(!m.sideways && m.cardInside && !m.cardSideways && m.actionsReachable, `${label}: start card ${JSON.stringify(m)}`);
  await shot("1-start");
  await page.locator("#howto-toggle").click();
  m = await measure(page, "ov-start");
  check(m.cardInside && !m.cardSideways, `${label}: start card with "Como jogar" open ${JSON.stringify(m)}`);
  await page.locator("#howto-toggle").click();

  // "Antes de começar": character and mode picker.
  await page.locator("#btn-play").click();
  m = await measure(page, "ov-setup");
  check(m.cardInside && !m.cardSideways && m.actionsReachable, `${label}: picker card ${JSON.stringify(m)}`);
  await shot("1b-setup");
  await page.locator("#btn-setup-back").click();

  // Playing, with the longest question (worst case for space).
  const longId = await page.evaluate(() => window.QUESTIONS.reduce((a, b) => (b.q.length > a.q.length ? b : a)).id);
  await page.evaluate((id) => window.AwsCloudQuest.app.start({ questionId: id, monsterId: "gorilla", skipIntro: true }), longId);
  await page.clock.runFor(1500);
  m = await measure(page);
  check(
    !m.sideways && m.hudInside && m.answerInside && m.powersInside && m.panelClearsPowers && m.moreHintOk && m.fieldHeight >= 150,
    `${label}: gameplay ${JSON.stringify(m)}`
  );
  await shot("2-play");

  // Life lost (needs two lives), then Game Over.
  await page.evaluate(() => window.AwsCloudQuest.app.start({ monsterId: "dino", skipIntro: true }));
  for (let i = 0; i < 3; i++) {
    const { questionId } = await page.evaluate(() => window.AwsCloudQuest.app.snapshot());
    const right = await page.evaluate((qid) => {
      const NS = window.AwsCloudQuest;
      const q = NS.questions.normalize(window.QUESTIONS, NS.config).questions.find((x) => x.id === qid);
      return [...document.querySelectorAll("#answers .answer-text")].findIndex((el) => el.textContent === q.options[q.answer]);
    }, questionId);
    await page.locator(`#answers .answer[data-index="${right}"]`).click();
    await page.clock.runFor(1500);
  }
  const travel = async () => {
    const s = await page.evaluate(() => window.AwsCloudQuest.app.snapshot());
    await page.clock.runFor(Math.ceil((1 - s.progress) * s.travel * 1000) + 2500);
  };
  await travel();
  m = await measure(page, "ov-life");
  check(m.cardInside && !m.cardSideways && m.actionsReachable, `${label}: life-lost card ${JSON.stringify(m)}`);
  await shot("3-life-lost");
  await page.locator("#btn-continue").click();
  await page.clock.runFor(2000);
  await travel();
  await page.locator("#curtain").click(); // skip the dark GAME OVER screen
  m = await measure(page, "ov-over");
  check(m.cardInside && !m.cardSideways && m.actionsReachable, `${label}: Game Over card ${JSON.stringify(m)}`);
  await shot("4-game-over");

  await page.locator("#btn-areas").click();
  m = await measure(page, "ov-areas");
  check(m.cardInside && !m.cardSideways && m.actionsReachable, `${label}: areas card ${JSON.stringify(m)}`);
  await shot("5-areas");
  await page.locator("#btn-areas-close").click();

  await page.locator("#btn-home").click();
  m = await measure(page, "ov-leave");
  check(m.cardInside && !m.cardSideways && m.actionsReachable, `${label}: leave card ${JSON.stringify(m)}`);
  await page.locator("#btn-leave-cancel").click();

  await page.locator("#btn-history-over").click();
  m = await measure(page, "ov-history");
  check(m.cardInside && !m.cardSideways && m.actionsReachable, `${label}: history card ${JSON.stringify(m)}`);
  await shot("6-history");

  check(errors.length === 0, `${label}: page errors ${errors.join(" | ")}`);
  console.log(`${failures === before ? "✔" : "✖"} ${label}`);
  await context.close();
}

await browser.close();
server.close();
if (failures) {
  console.error(`\n${failures} layout problem(s)`);
  process.exit(1);
}
console.log("\nResponsive check passed");
