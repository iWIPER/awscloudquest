#!/usr/bin/env node
/**
 * Regenerates assets/og-image.png (1200×630), the preview image shown when the
 * game's link is shared. It is a real screenshot of the game, taken with
 * Playwright (optional dev dependency):
 *
 *   node scripts/og-image.mjs
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { startServer } from "./serve.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "assets", "og-image.png");
mkdirSync(path.dirname(out), { recursive: true });

const { server, url } = await startServer();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.clock.install();
await page.goto(url);
await page.evaluate(() => localStorage.setItem("awsCloudQuestHero", JSON.stringify("female")));
await page.reload();

// A short question, the dragon halfway, daylight with a few birds.
const questionId = await page.evaluate(() => window.QUESTIONS.find((q) => q.id === "lambda-serverless").id);
await page.evaluate((id) => window.AwsCloudQuest.app.start({ questionId: id, monsterId: "dragon" }), questionId);
await page.evaluate(() => window.AwsCloudQuest.scene.set({ time: 0.15, rain: false, bird: true }));
const { travel } = await page.evaluate(() => window.AwsCloudQuest.app.snapshot());
await page.clock.runFor(travel * 1000 * 0.45);
await page.waitForTimeout(900); // let CSS animations settle (real time)

await page.screenshot({ path: out });
await browser.close();
server.close();
console.log(`✔ ${path.relative(root, out)}`);
