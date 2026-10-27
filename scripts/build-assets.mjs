#!/usr/bin/env node
/**
 * Regenerates the image assets from source, with Playwright (optional dev dependency):
 *
 *   assets/icon-32.png, icon-180.png (apple-touch-icon), icon-192.png, icon-512.png,
 *   icon-maskable-512.png   ← rendered from assets/icon.svg
 *   assets/og-image.png     ← 1200×630 screenshot of a real game (link preview)
 *   assets/og-duel.png      ← 1200×630 screenshot of a real duel (preview of duelo.html
 *                             invitation links), with neutral player names
 *
 *   node scripts/build-assets.mjs
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { startServer } from "./serve.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assets = path.join(root, "assets");
const svg = await readFile(path.join(assets, "icon.svg"), "utf8");

const browser = await chromium.launch();

// ── Icons ───────────────────────────────────────────────────────────────
async function renderIcon(size, file, { maskable = false } = {}) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  // Maskable icons need a full-bleed background and the artwork inside the central 80% safe zone.
  const art = maskable
    ? `<div style="width:100%;height:100%;background:#3a1459;display:grid;place-items:center">
         <div style="width:80%;height:80%">${svg}</div></div>`
    : svg;
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}svg{display:block;width:100%;height:100%}</style>${art}`
  );
  await page.screenshot({ path: path.join(assets, file), omitBackground: !maskable });
  await page.close();
  console.log(`✔ assets/${file}`);
}

await renderIcon(32, "icon-32.png");
await renderIcon(180, "icon-180.png");
await renderIcon(192, "icon-192.png");
await renderIcon(512, "icon-512.png");
await renderIcon(512, "icon-maskable-512.png", { maskable: true });

// ── Link preview (Open Graph) ───────────────────────────────────────────
const { server, url } = await startServer();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.clock.install();
await page.goto(url);
await page.evaluate(() => {
  localStorage.setItem("awsCloudQuestHero", JSON.stringify("female"));
  localStorage.setItem("awsCloudQuestMuted", "true");
});
await page.reload();

// A short question, the dragon halfway, daylight with a few birds.
await page.evaluate(() => window.AwsCloudQuest.app.start({ questionId: "lambda-serverless", monsterId: "dragon", skipIntro: true }));
await page.evaluate(() => window.AwsCloudQuest.scene.set({ time: 0.15, rain: false, bird: true }));
await page.evaluate(() => (document.getElementById("sound-hint").hidden = true)); // no sound-button balloon in the preview
const { travel } = await page.evaluate(() => window.AwsCloudQuest.app.snapshot());
await page.clock.runFor(travel * 1000 * 0.45);
await page.waitForTimeout(900); // let CSS animations settle (real time)
await page.screenshot({ path: path.join(assets, "og-image.png") });
console.log("✔ assets/og-image.png");

// ── Duel invitation preview ──────────────────────────────────────────────
// Two pages of one browser play through the local transport; "Jogador 1"
// answers first and shoots, with the taunt sign up.
const duelContext = await browser.newContext({ viewport: { width: 1200, height: 630 } });
await duelContext.addInitScript(() => {
  window.AwsCloudQuestDuelTest = { transport: "local", COUNTDOWN: 1, ROUND_INTRO_MS: 300, firstQuestionId: "lambda-serverless" };
  localStorage.setItem("awsCloudQuestMuted", "true");
});
const join = async (page, name, hero) => {
  await page.fill("#duel-name", name);
  await page.locator(`#ov-duel .pick-card:has(input[value="${hero}"])`).click();
  await page.locator("#btn-duel-go").click();
};
const host = await duelContext.newPage();
await host.goto(url);
await host.locator("#btn-duel").click();
await join(host, "Jogador 1", "male");
await host.waitForSelector("#ov-duel-wait:not([hidden])");
const guest = await duelContext.newPage();
await guest.goto(await host.inputValue("#duel-link"));
await guest.waitForSelector("#ov-duel:not([hidden])");
await join(guest, "Jogador 2", "female");
for (const p of [host, guest]) {
  await p.waitForSelector("#btn-duel-ready:not([hidden])");
  await p.locator("#btn-duel-ready").click();
}
await host.waitForFunction(() => window.AwsCloudQuest.duelApp.snapshot().phase === "round", null, { timeout: 20000 });
await host.evaluate(() => window.AwsCloudQuest.scene.set({ time: 0.2, rain: false }));
await host.waitForTimeout(600);
const right = await host.evaluate(() => {
  const NS = window.AwsCloudQuest;
  const q = NS.questions.normalize(window.QUESTIONS, NS.config).questions.find((x) => x.id === "lambda-serverless");
  return [...document.querySelectorAll("#answers .answer-text")].findIndex((el) => el.textContent === q.options[q.answer]);
});
await host.locator(`#answers .answer[data-index="${right}"]`).click();
await host.waitForTimeout(900); // shot landed, "AI!" and the taunt sign up
await host.screenshot({ path: path.join(assets, "og-duel.png") });
console.log("✔ assets/og-duel.png");

await browser.close();
server.close();
