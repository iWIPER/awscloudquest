#!/usr/bin/env node
/**
 * Duel smoke test (Playwright, optional dev dependency).
 *
 *   node scripts/duel-smoke.mjs [--browser chromium|webkit] [--shots <dir>] [--mqtt]
 *
 * Two pages of one browser play a full duel: create a room, join from the
 * link, countdown, a round won by the guest, a round both get wrong, rounds
 * won by the host until the guest is out, the victory scene and the end card,
 * a rematch, and the host leaving. By default the pages talk through the
 * local transport (BroadcastChannel); --mqtt uses the public brokers instead.
 * Timings are shortened through the window.AwsCloudQuestDuelTest hook.
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium, webkit } from "playwright";
import { startServer } from "./serve.mjs";

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
};
const shotsDir = arg("--shots") ? path.resolve(arg("--shots")) : null;
if (shotsDir) mkdirSync(shotsDir, { recursive: true });
const engineName = arg("--browser") || "chromium";
const useMqtt = process.argv.includes("--mqtt");

let failures = 0;
const check = (ok, message) => {
  console.log(`${ok ? "✔" : "✖"} ${message}`);
  if (!ok) failures += 1;
};

const { server, url } = await startServer();
const browser = await { chromium, webkit }[engineName].launch();
console.log(`Engine: ${engineName}${useMqtt ? " (public broker)" : ""}`);
const context = await browser.newContext({ viewport: { width: 390, height: 700 } });
await context.addInitScript((mqtt) => {
  window.AwsCloudQuestDuelTest = { ...(mqtt ? {} : { transport: "local" }), COUNTDOWN: 2, RESULT_MS: 900, ROUND_INTRO_MS: 400, VICTORY_MS: 2500, CURTAIN_MS: 1500,
    LIVES: 3, LIVES_OPTIONS: [3, 6], HEARTBEAT_MS: 400, PEER_SILENT_MS: 2000, RECONNECT_MS: 30000,
    SPECIAL_MS: 7000 };
}, useMqtt);

const errors = [];
const open = async (name, address) => {
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(`${name}: ${e.message}`));
  page.on("console", (m) => m.type() === "error" && errors.push(`${name}: ${m.text()}`));
  await page.goto(address);
  return page;
};
const shot = (page, name) => shotsDir && page.screenshot({ path: path.join(shotsDir, `duel-${name}.png`) });
const snap = (page) => page.evaluate(() => window.AwsCloudQuest.duelApp.snapshot());
const wait = (page, fn, arg) => page.waitForFunction(fn, arg, { timeout: useMqtt ? 30000 : 10000 });

/** Screen indexes of the correct options on this page (two in "choose two" questions). */
const rightIndexes = (page) => page.evaluate(() => {
    const NS = window.AwsCloudQuest;
    const id = NS.duelApp.snapshot().questionId;
    const q = NS.questions.normalize(window.QUESTIONS, NS.config).questions.find((x) => x.id === id);
    const texts = [...document.querySelectorAll("#answers .answer-text")].map((el) => el.textContent);
    return q.answers.map((i) => texts.indexOf(q.options[i]));
  });
const pick = (page, index) => page.locator(`#answers .answer[data-index="${index}"]`).click();
/** Marks every correct option: one click, or two in a "choose two" question. */
const answerRight = async (page) => {
  for (const index of await rightIndexes(page)) await pick(page, index);
};

// ── Host creates the room ──────────────────────────────────────────────
const host = await open("host", url);
await host.click("#btn-duel");
check(await host.locator("#ov-duel:not([hidden])").isVisible(), "Duelo opens the duel setup");
check(await host.locator("#btn-duel-go").isDisabled(), "Criar sala needs a name and a character");
check(await host.locator("#duel-rules").isHidden(), '"Como funciona o duelo" starts collapsed');
await host.click("#duel-howto-toggle");
check(await host.locator("#duel-rules li").first().isVisible(), "the duel rules open on tap");
await host.fill("#duel-name", "Wilk");
await host.click('#ov-duel .pick-card:has(input[value="male"])');
await host.click("#btn-duel-go");
await host.waitForSelector("#ov-duel-wait:not([hidden])", { timeout: 20000 });
const link = await host.inputValue("#duel-link");
check(/\/duelo\.html\?sala=[2-9a-hj-km-np-z]{12}$/.test(link), `the invitation link opens duelo.html with the room (${link.split("?")[1]})`);
check((await host.locator(".poster").count()) === 2 && /Wilk/.test(await host.textContent("#duel-posters")), "the waiting room shows the PROCURADO poster");
await shot(host, "1-wait");

// ── Guest joins from the link ──────────────────────────────────────────
const guest = await open("guest", link);
await guest.waitForSelector("#ov-duel:not([hidden])");
check(/chamado/.test(await guest.textContent("#duel-title")), "the link opens the join screen");
await guest.fill("#duel-name", "Josiane");
await guest.click('#ov-duel .pick-card:has(input[value="female"])');
await guest.click("#btn-duel-go");
await host.waitForSelector("#btn-duel-ready:not([hidden])", { timeout: useMqtt ? 30000 : 10000 });
await guest.waitForSelector("#btn-duel-ready:not([hidden])");
check((await snap(host)).peer?.name === "Josiane" && (await snap(guest)).peer?.name === "Wilk", "both players see each other and a Pronto! button");
await host.click("#btn-duel-ready");
await host.waitForTimeout(600);
check((await snap(host)).phase === "waiting" && (await snap(guest)).phase === "waiting", "one player ready: the countdown waits for the other");
await guest.click("#btn-duel-ready");
await wait(host, () => window.AwsCloudQuest.duelApp.snapshot().phase === "countdown");
check(true, "both ready: the countdown starts");
await shot(host, "2-countdown");

// ── Rounds ─────────────────────────────────────────────────────────────
await wait(guest, () => window.AwsCloudQuest.duelApp.snapshot().phase === "round");
await wait(host, () => window.AwsCloudQuest.duelApp.snapshot().phase === "round");
let s = await snap(host);
check(s.round === 1 && (await snap(guest)).questionId === s.questionId, "round 1: both players get the same question");
const order = (page) => page.evaluate(() => [...document.querySelectorAll("#answers .answer-text")].map((e) => e.textContent).join("|"));
check((await order(host)) === (await order(guest)), "…with the options in the same order");
check(await host.locator("#rival").isVisible(), "the rival stands on the right");
await shot(guest, "3-round");

// Round 1: the guest answers right first.
await answerRight(guest);
await wait(host, () => window.AwsCloudQuest.duelApp.snapshot().phase === "result");
s = await snap(host);
check(s.lives.host === 2 && s.lives.guest === 3, "the first correct answer shoots: the other player loses a life");
await host.waitForTimeout(300);
check((await host.locator(".taunt").count()) === 1, "the shooter raises a taunt sign");
// The room creator's weather is shared: night and rain on the host reach the guest with the next round.
await host.evaluate(() => window.AwsCloudQuest.scene.set({ time: 0.7, rain: true }));
await shot(host, "4-hit");

// Round 2: a wrong answer locks only that player; then both wrong → both lose a life.
await wait(host, () => window.AwsCloudQuest.duelApp.snapshot().round === 2 && window.AwsCloudQuest.duelApp.snapshot().phase === "round");
await wait(guest, () => window.AwsCloudQuest.duelApp.snapshot().round === 2);
const guestSky = await guest.evaluate(() => window.AwsCloudQuest.scene.snapshot());
check(guestSky.rain === true && guestSky.night === 1, "the guest gets the host's night and rain");
const wrongOf = async (page) => {
  const rights = await rightIndexes(page);
  const count = await page.locator("#answers .answer").count();
  return [...Array(count).keys()].find((i) => !rights.includes(i));
};
await pick(host, await wrongOf(host));
check((await snap(host)).locked && !(await snap(guest)).locked, "a wrong answer locks only that player");
await pick(guest, await wrongOf(guest));
await wait(host, () => window.AwsCloudQuest.duelApp.snapshot().phase === "result");
s = await snap(host);
check(s.lives.host === 1 && s.lives.guest === 2, "both wrong: both lose a life");

// The host wins the remaining rounds (the guest does not answer).
for (let round = 3; round < 8; round++) {
  await wait(host, (n) => ["round", "victory", "over"].includes(window.AwsCloudQuest.duelApp.snapshot().phase) && (window.AwsCloudQuest.duelApp.snapshot().round === n || window.AwsCloudQuest.duelApp.snapshot().phase !== "round"), round);
  if ((await snap(host)).phase !== "round") break;
  if (round === 3) check((await host.locator("#world").getAttribute("data-scene")) === "west", "the duel stays in the Wild West town");
  if (round === 4) {
    await answerRight(host);
    await host.waitForTimeout(1200);
    check(await host.locator("#world.is-cinema").count() === 1 && (await snap(guest)).specialDone, "round 4, only one right: the special move plays as a film on both screens");
    await shot(host, "4b-special");
    continue;
  }
  await answerRight(host);
  await wait(host, (n) => window.AwsCloudQuest.duelApp.snapshot().phase !== "round" || window.AwsCloudQuest.duelApp.snapshot().round !== n, round);
}
await wait(guest, () => ["victory", "over"].includes(window.AwsCloudQuest.duelApp.snapshot().phase));
await host.waitForTimeout(2000);
check(await host.locator("#podium").isVisible() && (await host.locator("#flagpole").isVisible()), "the winner climbs the podium beside the flag");
check((await host.locator("#hero .h-svg rect[x='38'][y='33']").count()) === 0, "the winner puts the weapon away to celebrate");
await shot(host, "5-victory");
await host.waitForSelector("#duel-curtain:not([hidden])", { timeout: 5000 });
check((await host.textContent("#duel-curtain-title")) === "WILK VENCEU!", "the screen darkens: WILK VENCEU!");
await shot(host, "5b-curtain");
await wait(host, () => window.AwsCloudQuest.duelApp.snapshot().phase === "over");
await wait(guest, () => window.AwsCloudQuest.duelApp.snapshot().phase === "over");
check(/WILK VENCEU/.test(await host.textContent("#duel-end-title")) && /WILK VENCEU/.test(await guest.textContent("#duel-end-title")), "both screens say who won");
check((await host.locator("#duel-end-score .vs-side").count()) === 2 && /Wilk.*1.*Josiane.*0/s.test(await host.textContent("#duel-end-score")), "the versus scoreboard counts the win");
await host.click("#btn-duel-leave");
check(await host.locator("#ov-leave:not([hidden])").isVisible(), "Início asks to download the report first");
await host.click("#btn-leave-cancel");
check(await host.locator("#ov-duel-end:not([hidden])").isVisible(), "Cancelar goes back to the duel end card");
// Both pages share one browser storage here (two phones would not), so read
// each player's report from its own page.
const reportOf = (page) => page.evaluate(() => window.AwsCloudQuest.duelApp.lastReport());
const guestReport = await reportOf(guest);
const hostReport = await reportOf(host);
check(guestReport?.duel.won === false && hostReport?.duel.won === true, "each player saves a duel report");
const md = await guest.evaluate((r) => window.AwsCloudQuest.report.toMarkdown(r, window.STUDY_GUIDE), guestReport);
check(/Relatório do duelo/.test(md) && /Wilk venceu o duelo/.test(md) && /Desempenho por área/.test(md), "the duel report has the result and the areas");
await host.waitForTimeout(500); // let the card finish its entrance
await shot(host, "6-end");

// ── Rematch: a dropped connection pauses the match, then a draw ────────
await guest.click("#btn-duel-rematch");
await wait(host, () => /revanche/i.test(document.getElementById("duel-end-status").textContent));
check(true, "the other player sees the rematch request");
await host.click("#btn-duel-rematch");
await wait(guest, () => window.AwsCloudQuest.duelApp.snapshot().phase === "countdown");
check((await snap(guest)).lives.guest === 3, "rematch: a new match with full lives");
await wait(host, () => window.AwsCloudQuest.duelApp.snapshot().phase === "round");

// Simulate a network drop: the guest's messages stop reaching the host for a few seconds.
await guest.evaluate(() => {
  const send = BroadcastChannel.prototype.postMessage;
  BroadcastChannel.prototype.postMessage = function () {};
  setTimeout(() => (BroadcastChannel.prototype.postMessage = send), 3500);
});
await wait(host, () => window.AwsCloudQuest.duelApp.snapshot().paused);
check(/Josiane caiu/.test(await host.textContent("#duel-wait-status")), "a dropped player pauses the match: \"Josiane caiu\"");
await shot(host, "8-paused");
await wait(host, () => !window.AwsCloudQuest.duelApp.snapshot().paused && window.AwsCloudQuest.duelApp.snapshot().phase === "round");
check(true, "when the player is back, the round starts over");

// Both answer wrong until both are out of lives at the same time: a draw.
for (let i = 0; i < 6 && (await snap(host)).phase !== "victory"; i++) {
  await wait(host, () => ["round", "victory"].includes(window.AwsCloudQuest.duelApp.snapshot().phase));
  if ((await snap(host)).phase !== "round") break;
  const n = (await snap(host)).round;
  await wait(guest, (r) => window.AwsCloudQuest.duelApp.snapshot().phase === "round" && window.AwsCloudQuest.duelApp.snapshot().round === r, n);
  await pick(host, await wrongOf(host));
  await pick(guest, await wrongOf(guest));
  // Wait for this round's result (or the end of the match) before the next one.
  await wait(host, (r) => { const s = window.AwsCloudQuest.duelApp.snapshot(); return s.round !== r || ["result", "victory"].includes(s.phase); }, n);
}
await wait(host, () => window.AwsCloudQuest.duelApp.snapshot().phase === "victory");
await host.waitForTimeout(2200);
check(await host.locator("#podium.is-wide").isVisible(), "a draw: both climb a wide podium");
await shot(host, "9-draw");
await host.waitForSelector("#duel-curtain:not([hidden])", { timeout: 15000 });
check((await host.textContent("#duel-curtain-title")) === "WILK E JOSIANE EMPATARAM!", "both out together: a draw, WILK E JOSIANE EMPATARAM!");
await wait(host, () => window.AwsCloudQuest.duelApp.snapshot().phase === "over");
check(/Wilk.*1.*Josiane.*0/s.test(await host.textContent("#duel-end-score")), "a draw does not change the room score");

// ── Início: reminder, then leaving tells the other player ────────────────
await host.click("#btn-duel-leave");
await host.click("#btn-leave-go");
await wait(guest, () => window.AwsCloudQuest.duelApp.snapshot().phase === "closed");
check(/Wilk saiu da sala/.test(await guest.textContent("#duel-end-sub")), "leaving tells the other player");
check(await host.locator("#ov-start:not([hidden])").isVisible(), "the player who left is back on the start screen");
await shot(guest, "7-left");

check(errors.length === 0, `no console errors${errors.length ? `: ${errors.join(" | ")}` : ""}`);
await browser.close();
server.close();
if (failures) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log("\nDuel smoke test passed");
