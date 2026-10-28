/**
 * AWS Cloud Quest — duel rules (pure: no DOM, no network).
 *
 * The room creator ("host") is the referee. It runs these functions to decide
 * each round; the other player ("guest") only displays the results it gets.
 * Roles are the strings "host" and "guest". A match ends when someone is out
 * of lives; both out in the same round is a draw.
 */
(function (root) {
  "use strict";

  const ROLES = Object.freeze(["host", "guest"]);
  const other = (role) => (role === "host" ? "guest" : "host");

  // Room ids: 12 characters without look-alikes (0/o, 1/l/i), about 59 bits.
  const ROOM_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";
  const ROOM_PATTERN = /^[2-9a-hj-km-np-z]{12}$/;

  function newRoomId(rng = Math.random) {
    let id = "";
    for (let i = 0; i < 12; i++) id += ROOM_ALPHABET[Math.floor(rng() * ROOM_ALPHABET.length)];
    return id;
  }

  /** Room id from a link's hash ("#duelo=abc…"), or null. */
  function roomFromHash(hash) {
    const match = /^#duelo=([^&]+)/.exec(String(hash || ""));
    return match && ROOM_PATTERN.test(match[1]) ? match[1] : null;
  }

  /** Display name: trimmed, single spaces, at most `max` characters; "Jogador" when empty. */
  function cleanName(name, max = 16) {
    const text = String(name || "").replace(/\s+/g, " ").trim().slice(0, max).trim();
    return text || "Jogador";
  }

  /** Level of a round: goes up every LEVEL_EVERY rounds, like the solo levels. */
  function levelForRound(round, duel) {
    return 1 + Math.floor((Math.max(1, round) - 1) / duel.LEVEL_EVERY);
  }

  /**
   * The special move replaces the shot once per match, in a round from
   * SPECIAL_FROM to SPECIAL_TO where only one player got it right (not when
   * both were right, not when both were wrong).
   */
  function isSpecialHit(round, result, answers, done, duel) {
    if (done || !result || result.reason !== "hit") return false;
    if (round < duel.SPECIAL_FROM || round > duel.SPECIAL_TO) return false;
    const loser = answers && answers[other(result.winner)];
    return !(loser && loser.correct);
  }

  /**
   * Decides a round from the answers so far.
   * @param {{host?: {correct: boolean, ms: number}, guest?: {correct: boolean, ms: number}}} answers
   * @param {{timedOut?: boolean, graceOver?: boolean}} flags
   *   graceOver: the grace window after the first correct answer has passed
   * @returns {null | {reason: "hit"|"both-wrong"|"timeout", winner: string|null, losers: string[]}}
   *   null while the round is still open.
   */
  function decideRound(answers, { timedOut = false, graceOver = false } = {}) {
    const correct = ROLES.filter((r) => answers[r] && answers[r].correct);
    const answered = ROLES.filter((r) => answers[r]);

    if (correct.length > 0) {
      // Wait for a possibly faster answer still on its way, unless both are in.
      if (answered.length < 2 && !graceOver && !timedOut) return null;
      const winner = correct.reduce((a, b) => (answers[b].ms < answers[a].ms ? b : a));
      return { reason: "hit", winner, losers: [other(winner)] };
    }
    if (answered.length === 2) return { reason: "both-wrong", winner: null, losers: [...ROLES] };
    if (timedOut) return { reason: "timeout", winner: null, losers: [...ROLES] };
    return null;
  }

  /** Lives after a round result: each loser drops one, never below zero. */
  function applyResult(lives, result) {
    const next = { ...lives };
    for (const role of result.losers) next[role] = Math.max(0, next[role] - 1);
    return next;
  }

  /** "host" | "guest" once one player is out of lives, "draw" if both ran out together, else null. */
  function matchWinner(lives) {
    if (lives.host <= 0 && lives.guest <= 0) return "draw";
    if (lives.host <= 0) return "guest";
    if (lives.guest <= 0) return "host";
    return null;
  }

  /**
   * How a round goes into the player's report (same outcomes as the solo game):
   * a correct answer counts as known ("first"), even if the rival was faster;
   * a wrong pick or no answer before the time ran out is "lost"; no answer
   * because the rival already won the round is "skipped".
   */
  function outcomeFor(role, answers, result) {
    const mine = answers[role];
    if (mine && mine.correct) return "first";
    if (mine) return "lost";
    return result.reason === "hit" ? "skipped" : "lost";
  }

  const TAUNTS = Object.freeze([
    "HA HA HA! Sou mais forte!",
    "Hahaha! Essa foi fácil!",
    "Toma! Volta a estudar!",
    "Rá! Mais [rápido|rápida] que você!",
    "Hehehe! Pode chorar!",
  ]);

  // "[male|female]" forms: rules.gendered() keeps the one for the speaker.
  const VICTORY_LINES = Object.freeze([
    "Eu venci! Sou [o mais forte|a mais forte] do mundo, yeah!",
    "[Campeão|Campeã] da nuvem! Ninguém me segura!",
    "Venci! A AWS é minha casa!",
  ]);


  const pick = (list, rng = Math.random) => list[Math.floor(rng() * list.length)];

  const api = Object.freeze({
    ROLES,
    other,
    newRoomId,
    roomFromHash,
    cleanName,
    levelForRound,
    isSpecialHit,
    decideRound,
    applyResult,
    matchWinner,
    outcomeFor,
    TAUNTS,
    VICTORY_LINES,
    pick,
  });

  const NS = (root.AwsCloudQuest = root.AwsCloudQuest || {});
  NS.duelRules = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
