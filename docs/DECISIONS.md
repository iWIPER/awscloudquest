# Decisions

A log of the choices made while building v2.0.0, in the order they came up. Each entry says what was decided and why.

## 1. Classic scripts with one namespace, not ES modules

The spec asked for ES modules, but also for the game to work when `index.html` is opened directly. Chromium-based browsers block `<script type="module">` on `file://` (CORS), so modules would break that requirement. Each file is a classic script that attaches itself to `window.AwsCloudQuest`, loaded in a fixed order. The only other global is `window.QUESTIONS`.

## 2. Pure modules double as CommonJS

`config.js`, `questions.js`, `rules.js` and `storage.js` end with `if (typeof module === "object") module.exports = …`. Node's test runner and the CLI scripts `require()` the same files the browser runs. This needs no bundler or transpiler, and there is no second copy of the rules.

## 3. Extra module: `rules.js`

The spec's module list puts travel time, scoring and the fast-hit rule nowhere in particular. They live in `rules.js` so they can be unit-tested without the DOM.

## 4. No rule numbers outside `CONFIG`

The spec's `CONFIG` sketch was extended with every number the rules use: `FULL_LIVES_BONUS`, `WRONG_PUSH_CAP`, `DANGER_AT`, the score terms (`POINTS_BASE`, `POINTS_PER_STREAK`, `STREAK_CAP`, `POINTS_FAST`), `REVIEW_MAX_COPIES`, option limits and history sizes. Per-monster attack durations stay in `monsters.js` because they are animation timings, not rules.

## 5. "Streak" in the score formula means hits before this one

`points = 10 + min(streak, 10) × 2 + fast`. The first hit of a streak scores 10 (20 if fast), the second 12, and so on. Counting the current hit as well would make the minimum 12, which the spec's base of 10 suggests was not intended.

## 6. Stats: one result per showing

A showing records `w + 1` on the first miss or when the monster arrives, whichever comes first, and never twice. It records `r + 1` only on a first-try hit. A hit after a miss counts as a miss for review purposes, because the player did not know the answer.

## 7. Extra review copies may be dropped

When review copies cannot be spread out (for example, one question with three copies in a two-question bank), the copies that would have to be adjacent are dropped instead of breaking the "never back to back" rule. Every question still appears at least once per deck.

## 8. Missing or empty bank: Play is disabled

The spec allowed either disabling Play or falling back to sample questions. Sample questions would mix content the player did not choose into their study session, so the game disables **Jogar** and explains what to fix.

## 9. Timer chip semantics

The chip shows **⚡ N s** (green) while a fast hit is still possible, counting down to 0. Once the bonus is lost, through a miss or time running out, it turns grey and shows **⏱ N s**, the time left until the monster arrives. That is the number a player needs at that point.

## 10. Text colors on the candy palette (AA contrast)

Measured contrast against white text: red `#e8272d` 4.41, orange 2.30, gold 1.43, green 2.22, blue 2.96 and purple 4.99. To reach WCAG AA (4.5:1):

- Answer A uses a darker red (`#c41e24`, 5.90) with white text, and answer F stays purple with white text.
- Answers B–E (orange, gold, green, blue) use dark ink text `#3a1459` (6.4, 10.3, 6.6 and 5.0).
- The question header is orange with ink text, and the green buttons use a darker green with white text.
- The overlay cards run from pink `#c2459b` (4.55) to purple `#7a2d8c` (8.13), instead of the light `#ff8fd0`, which is only 2:1 with white.

## 11. Burned hero falls forward

The dragon attack ends with the hero falling over. Falling backwards pushed the sprite off the left edge of the field on narrow screens, so the hero falls forward, towards the dragon.

## 12. "Limpar" keeps review stats

Clearing the history removes the history list and the best score. Per-question `{w, r}` stats are kept, because they are what makes the game drill weak spots. There is no in-game way to reset them yet. They can be removed by clearing the site's data.

## 13. Smoke test uses Playwright's fake clock

Real games take minutes, since monsters walk for 25 s or more at level 1. `page.clock` drives `requestAnimationFrame` and timers, so the smoke test plays several full games in seconds and is deterministic. The game exposes `AwsCloudQuest.app.start({ questionId, monsterId })` and `snapshot()` for this purpose. Neither changes the rules.

## 14. Imported practice questions keep their answer key

The 51 questions with ids `clf-sim01-*` were imported with `scripts/import-questions.mjs` from the maintainer's practice-exam notes. Following the "never fix answers" rule, answer keys were copied as recorded. Items whose source carried a warning keep it as `note` for the maintainer to review. Questions with two correct answers were not imported, because multi-answer questions are on the roadmap.

## 15. Code and docs in English, game in Portuguese

The interface text is pt-BR, matching the audience. Code, comments, commit messages and documentation are in English.
