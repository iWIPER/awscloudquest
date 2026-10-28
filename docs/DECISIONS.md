# Decisions

A log of the choices made since v2.0.0, in the order they came up. Each entry says what was decided and why.

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

Clearing the history removes the history list, the saved reports and the best score. Per-question `{w, r}` stats are kept, because they are what makes the game drill weak spots. There is no in-game way to reset them yet. They can be removed by clearing the site's data. The confirmation is shown inside the card instead of the browser's `confirm()`, which looked out of place, especially on phones.

## 13. Smoke test uses Playwright's fake clock

Real games take minutes, since monsters walk for 25 s or more at level 1. `page.clock` drives `requestAnimationFrame` and timers, so the smoke test plays several full games quickly. The fake clock also flows in real time during screenshot pauses, so timing checks read the remaining time from `snapshot()` instead of assuming it. The game exposes `AwsCloudQuest.app.start({ questionId, monsterId })`, `snapshot()` and `AwsCloudQuest.scene.set({ time, rain, bird, critter })` for this purpose. None of them changes the rules.

## 14. Imported practice questions keep their answer key

The 51 questions with ids `clf-sim01-*` were imported with `scripts/import-questions.mjs` from the maintainer's practice-exam notes. Following the "never fix answers" rule, answer keys were copied as recorded. Items whose source carried a warning keep it as `note` for the maintainer to review. Questions with two correct answers were left out at first; they were imported later, with all their answers, once multi-answer questions were supported (see #37).

## 15. Code and docs in English, game in Portuguese

The interface text is pt-BR, matching the audience. Code, comments, commit messages and documentation are in English.

## 16. A miss locks the answers and speeds the monster up (replaces the 8% push)

The original spec pushed the monster 8% closer on a miss. In play-testing, guessing was still cheap: players could tap every option in a row. A miss now locks all options for `WRONG_LOCK_SECONDS` (8 s) and makes that monster `WRONG_SPEEDUP` (40%) faster, up to `MAX_SPEED`, with a visible "downgrade" sign. `WRONG_PUSH` and `WRONG_PUSH_CAP` were removed.

## 17. Sound is synthesized and on by default

The spec's backlog suggested sound off by default. The maintainer asked for music and ambient sound as part of the experience, so sound is on, with a mute button and the `M` key, and the choice is remembered. Everything is generated with the Web Audio API: no audio files to download or license, and the music can react to the game (tempo and heartbeat follow the monster). Audio starts on the first user gesture, as browsers require.

## 18. Lucide icons, embedded

Emoji render differently on every platform and looked inconsistent next to each other. The UI uses [Lucide](https://lucide.dev) icons (ISC). Only the icons used are copied into `js/icons.js` as inline SVG, so there is no runtime dependency or CDN request. License texts are in `THIRD_PARTY_NOTICES.md`. Monster names in titles keep their emoji, because they are the monster's identity.

## 19. The question balloon floats over the world

The question panel used to push the field down. It is now absolutely positioned over a single sky that fills the space between the HUD and the answers. The effects layer (penalty sign, balloons) sits above the balloon, so callouts are never hidden even when a long question covers most of the field.

## 20. Cards never scroll as a whole

Overlay cards are flex columns capped at the viewport height. The long parts (the question/answer block, the "Como jogar" list and the history list) take the leftover height and scroll inside themselves. Numbers and buttons stay on screen. "Como jogar" is a custom accordion (button + list) instead of `<details>`, because `<details>` cannot shrink as a flex item in every browser.

## 21. Power-ups: 3 Gelo, 2 Pular

**Gelo** freezes the monster for 15 s and cannot be stacked. **Pular** swaps the question without touching lives, score, streak or review stats, so skipping is neither a reward nor a penalty. Counts are per game and live in `CONFIG`.

## 22. Reports: one game at a time, Markdown and print-to-PDF

> Superseded in 2.2.0 by [#28](#28-pdf-written-in-the-browser): the print dialog was replaced by a generated PDF.

A combined report of every game would grow without bound and mix separate study sessions, so reports are per game. The Game Over card exports the game that just ended, and the history screen exports any of the last 20. PDF uses the browser's print dialog ("Salvar como PDF") on a print-only page. Generating PDF bytes in JavaScript would need a library, and the browser's output has selectable text and prints well. The outcome chart is a single 100% bar. The outcomes are states, so they use the reference status palette, with a symbol and a label in the legend so color is never the only cue. The question list doubles as the table view.

## 23. Link preview from a real screenshot

`assets/og-image.png` is produced by `scripts/og-image.mjs` from the actual game, at the 1200×630 size used by link previews. It is deployed with the site because preview crawlers need an absolute URL.

## 24. A gorilla, and critters that run away from the hero

The fifth monster, a gorilla, punches the hero on the head; the hero ends flattened with dizzy stars. The decorative bunnies and squirrels always run left to right, away from the hero, so they never read as a threat.

## 25. Difficulty modes as configuration overrides

*Fácil* and *Avançado* differ only in numbers. Each mode is therefore a list of `CONFIG` overrides, and `rules.configFor()` merges them into one frozen object that the whole game reads. Adding a mode, or tuning one, means editing `CONFIG.MODES`, with no code changes. Since 2.2.0 the player picks a character and a mode in the **Antes de começar** dialog every session, with nothing pre-selected ([#33](#33-nothing-pre-selected)).

## 26. iPhone sound with the silent switch on

An iPhone 14 played no sound while an iPhone 17 Pro Max did. There were two causes:

- iOS treats Web Audio as ambient sound, which the ring/silent switch mutes. Newer iPhones replace the switch with the Action button, so they are rarely in silent mode.
- On touch screens iOS only accepts the end of a tap as the gesture that unlocks audio, so unlocking on `pointerdown` alone could fail on some iOS versions.

The game now unlocks on every gesture type until audio runs. It also asks for the media playback audio session, so sound plays with the switch on, like a video player. The in-game mute button is the player's control.

## 27. Topics from a keyword classifier, not a model

Questions need a CLF-C02 topic for **Desempenho por área**, and the bank will keep growing. Tagging by hand does not scale, and calling an AI service would break the "no external calls" rule. `topics.js` scores each question against the keyword lists in `data/study-guide.js`: hits in the answer weigh 3, in the question 2, in the explanation 1. It agreed with the manual tags on 56 of 60 questions. A manual `topic` always wins, and the validator rejects topics that are not in the guide.

## 28. PDF written in the browser

The print dialog looked out of place on phones and did not let players simply view or download a file. PDF libraries add hundreds of KB. The report only needs text, boxes and links, so `pdf.js` writes PDF 1.4 directly with the built-in Helvetica font and WinAnsi encoding (Portuguese accents included). Characters outside WinAnsi fall back to close equivalents.

## 29. Scripted events between questions

Box, boss, visitor and scenery all happen between questions, decided in one place (`questionDone()`), in a fixed order. They never interrupt a running question, so the timer and the lockout rules stay simple. The schedule is pure functions in `rules.js` and is unit-tested.

## 30. The boss does not take lives with rocks

A boss that drains lives on every miss would end most games at level 4. Rocks only stagger the hero and bring the boss one step closer, so the fight builds tension without punishing every miss. The cost comes at the end: losing the fight costs one life. With 3 hearts and 4 rounds, the player can miss once and still win. Gelo and Pular are disabled, so the fight cannot be skipped.

## 31. Music stays soft

Background music plays for a long time. Square and sawtooth waves (or car-like noises in the city) get tiring fast, so every theme uses only sine and triangle waves, with a low-pass pad. Rain sits at a quarter of its original level so it never covers the effects.

## 32. The page never scrolls

Mobile browsers resize the viewport as their bars appear and hide, and a page that can scroll ends up with the HUD or the last answer off screen. `body` is fixed to the visible viewport and `.app` fills it. Only the question panel, the answer list and dialog cards scroll inside. `scripts/responsive.mjs` checks this on 10 screen sizes.

## 33. Nothing pre-selected

A remembered character and mode looked like a choice the player had already made, and players tapped Play without noticing the mode. **Jogar** now opens **Antes de começar** with nothing selected, and **Começar** unlocks once both are chosen. **Jogar de novo** keeps the current choices; **Início** returns to the start screen to choose again, after a reminder to download the report.

## 34. No zoom on the game screen

Quick taps on answers triggered double-tap zoom on phones, and a stray two-finger touch did the same. With the page pinned to the viewport ([#32](#32-the-page-never-scrolls)), a zoomed screen cut off every edge and could not be panned back. The page now sets `touch-action: pan-x pan-y` (no double-tap or pinch zoom, scrolling inside panels still works) and `maximum-scale=1`. iOS Safari ignores both for pinch zoom, so `main.js` also cancels its `gesturestart` and `gesturechange` events. The trade-off is losing pinch zoom inside the game. Text is sized for phones, and the layout is tested from 320 px up.

## 35. Duel over a public MQTT relay

Two phones need a relay to find each other, and the game has no server. The options were WebRTC peer-to-peer (still needs a signaling server and often fails behind mobile NATs without a TURN relay), a hosted backend such as Firebase or a Cloudflare Worker (needs an account and keys), or a public message broker. The players asked for "no account, as simple as possible", so the duel uses free public MQTT brokers over secure WebSocket, all of them at once (see #43). The client is about 200 lines in `net.js`, so no library is added. The trade-offs: the relay is shared and unencrypted at the application level, and it can be down. The room id is random and only lives in the link. Only names, answers and results are sent, and the game says so when no broker answers.

## 36. The room creator is the referee, timing is per player

Someone must decide who answered first. Letting each side decide would let the two screens disagree. The host decides every round, but it compares the time each player took on their own screen, not the arrival time. A player on a slow connection does not lose a round they answered faster. Among friends, trusting the guest's reported time is acceptable; cheat-proofing is a non-goal.

## 37. Multi-answer questions: every right option, one kill

The CLF-C02 exam has "multiple response" questions (two or more right answers out of five or more). They are kept in the bank as `answer: ["A", "E"]`; the single-answer format did not change. In play, the first right option is marked and the monster only staggers, so the player has to know both answers; a wrong option is a normal miss. They get 15 extra seconds because reading and checking five options takes longer.

## 38. Topics mapped to the exam guide's task statements

The official score report shows performance by section, and the exam guide splits each domain into numbered task statements. Topics stay as the study units (they carry the keywords, notes and links), but each one now names its task statement and each domain its weight, so the game's report reads like the real one. Network topics moved to domain 3, where the guide puts them (task 3.5).

## 39. Study hints per topic, not per question

The easy mode's **Dica** shows memory tricks and a mind map for the question's topic. Writing a hint for each of 201 questions (and every future one) would not scale and could easily leak the answer. A topic card works for any new question the classifier places, teaches the neighboring services that make the distractors plausible, and does not point at an option.

## 40. Reading time never shrinks

With the bank at 201 questions, the old formula left 17 s at level 10 in Avançado for a typical question that takes about 19 s just to read: players lost for not finishing the text, not for not knowing. The base times went up (Avançado 20 → 30 s, Fácil 30 → 45 s), reading is now counted at 15 characters per second instead of 25, and levels shorten only the thinking part. The game still speeds up with each level, and Avançado at high levels stays close to the real exam's pace (90 minutes for 65 questions).

## 41. Film-like scenes for the big moments

The boss arrival, the boss's defeat and the duel's special move are short scripted scenes instead of a banner: the screen dims, the question goes away and the moment plays out for a few seconds. They happen rarely (a boss every 15 hits, the special move once per match), so the pause feels like a reward, not a delay. The questions never run during a scene, so no time is lost.

## 42. The duel stays a duel

A scenery change and the cheering visitor were tried in the duel and dropped: the Wild West town is the duel's identity, and a visitor walking between the two players got in the way of the showdown. The duel keeps day, night and rain (from the room creator) and the special move, which the referee decides and sends in the result, because only it knows both answers.

## 43. Every broker at once, first copy wins

Trying the brokers one after another made joining wait up to 8 s per broker that did not answer, and if the first broker failed for only one player, the two ended up on different brokers and never met. Now each browser connects to every broker in parallel, publishes through all of them and keeps the first copy of each message (messages carry an id). This costs one extra small message per broker, and gives the lowest latency of the relays and no single point of failure.
