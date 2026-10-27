/**
 * AWS Cloud Quest — localStorage persistence.
 *
 * Every read and write is wrapped in try/catch: with storage blocked
 * (private mode, browser policies) the game still works, it just doesn't save.
 *
 * Keys:
 *   awsCloudQuestBest     number — best score
 *   awsCloudQuestHistory  [{ t, score, correct, level }] — recent games, newest first
 *   awsCloudQuestStats    { [questionId]: { w, r } } — misses and hits per question
 *   awsCloudQuestHero     "male" | "female" — chosen character
 *   awsCloudQuestMuted    boolean — sound muted
 *   awsCloudQuestMode     "easy" | "advanced" — difficulty mode
 *   awsCloudQuestReports  [{ t, …report }] — per-question reports of recent games, newest first
 */
(function (root) {
  "use strict";

  const KEYS = Object.freeze({
    best: "awsCloudQuestBest",
    history: "awsCloudQuestHistory",
    stats: "awsCloudQuestStats",
    hero: "awsCloudQuestHero",
    muted: "awsCloudQuestMuted",
    reports: "awsCloudQuestReports",
    mode: "awsCloudQuestMode",
    name: "awsCloudQuestName",
  });

  const HEROES = Object.freeze(["male", "female"]);
  const MODES = Object.freeze(["easy", "advanced"]);

  /** Creates a store over a localStorage-like backend (injectable for tests). */
  function createStore(getBackend) {
    function read(key, fallback) {
      try {
        const raw = getBackend().getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch {
        return fallback;
      }
    }

    function write(key, value) {
      try {
        getBackend().setItem(key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    }

    function remove(key) {
      try {
        getBackend().removeItem(key);
      } catch {
        /* no access: nothing to remove */
      }
    }

    const isRecord = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

    return Object.freeze({
      getBest() {
        const value = Number(read(KEYS.best, 0));
        return Number.isFinite(value) && value > 0 ? value : 0;
      },
      setBest(score) {
        return write(KEYS.best, score);
      },
      getHistory() {
        const list = read(KEYS.history, []);
        return Array.isArray(list) ? list.filter(isRecord) : [];
      },
      /** Puts the game on top and keeps only the `limit` most recent. */
      addHistory(entry, limit) {
        const list = [entry, ...this.getHistory()].slice(0, limit);
        write(KEYS.history, list);
        return list;
      },
      /** Clears history, saved reports and best score. Review stats are kept. */
      clearHistory() {
        remove(KEYS.history);
        remove(KEYS.reports);
        remove(KEYS.best);
      },
      /** Saved game reports (newest first). `t` matches the history entry's timestamp. */
      getReports() {
        const list = read(KEYS.reports, []);
        return Array.isArray(list) ? list.filter((r) => isRecord(r) && Array.isArray(r.log)) : [];
      },
      /** Saves a report on top and keeps the `limit` most recent. Returns false if storage is full or blocked. */
      addReport(report, limit) {
        return write(KEYS.reports, [report, ...this.getReports()].slice(0, limit));
      },
      getStats() {
        const stats = read(KEYS.stats, {});
        return isRecord(stats) ? stats : {};
      },
      setStats(stats) {
        return write(KEYS.stats, stats);
      },
      /** Chosen character, or null if the player has not picked one yet. */
      getHero() {
        const hero = read(KEYS.hero, null);
        return HEROES.includes(hero) ? hero : null;
      },
      setHero(hero) {
        return HEROES.includes(hero) ? write(KEYS.hero, hero) : false;
      },
      /** Chosen difficulty mode, or null if never chosen. */
      getMode() {
        const mode = read(KEYS.mode, null);
        return MODES.includes(mode) ? mode : null;
      },
      setMode(mode) {
        return MODES.includes(mode) ? write(KEYS.mode, mode) : false;
      },
      /** Player name used in duels ("" if never typed). */
      getName() {
        const name = read(KEYS.name, "");
        return typeof name === "string" ? name.slice(0, 40) : "";
      },
      setName(name) {
        return write(KEYS.name, String(name));
      },
      getMuted() {
        return read(KEYS.muted, false) === true;
      },
      setMuted(muted) {
        return write(KEYS.muted, Boolean(muted));
      },
    });
  }

  const api = Object.freeze({
    KEYS,
    createStore,
    store: createStore(() => root.localStorage),
  });

  const NS = (root.AwsCloudQuest = root.AwsCloudQuest || {});
  NS.storage = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
