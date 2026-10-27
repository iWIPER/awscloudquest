# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Duel 1×1**: create a room, share the link and play a friend in real time. The room creator picks 10 or 20 lives; both tap **Pronto!** before the countdown. Same question for both, opened by a "ROUND N" presentation; the first correct answer shoots the other player. A lock after a miss; both lose a life when both miss or time runs out; a draw when both reach zero together. A dropped connection pauses the match for up to 2 minutes and reconnects by itself. Wild West town with day, night and rain, "PROCURADO" posters, a fast showdown theme, taunt signs, a podium beside the Brazil flag, a dark "<NAME> VENCEU!" screen that waits for a tap, a versus scoreboard with trophies, rematch with a running score, and a report for each player with the duel result and the performance by area.
- Speech bubbles: the cheering visitor and the hero have a short conversation (the dog barks along), and the boss talks ("Eu vou destruir você!", taunts on each rock, "Nãããão!" when beaten).
- Minimal MQTT client (`js/net.js`) and pure duel rules (`js/duel-rules.js`), with unit tests and a two-page duel smoke test in CI.

### Changed

- Losing the last life fades the screen slowly to dark before "GAME OVER" appears. The dark screen always says GAME OVER; a new record shows as a "NOVO RECORDE!" badge on the Game Over card.

### Fixed

- The screen could zoom in by itself on phones (double tap on an answer or a two-finger touch), cutting off every edge. Double-tap and pinch zoom are now disabled in the game.

## [2.2.0] - 2026-10-26

### Added

- **Desempenho por área**: hits and misses per CLF-C02 domain and topic, with strengths, weak areas, what to study and links to AWS documentation. Shown in the game and included in the PDF and Markdown reports.
- Study guide in `data/study-guide.js` (4 domains, 18 topics) and a keyword classifier that assigns a topic to any question without one, including imported questions.
- PDF reports built in the browser by a small PDF writer, with **Ver** and **Baixar** options. No print dialog.
- Boss fight every 15 hits (first at 12): four looks (stone golem, lava golem, ice giant, giant robot), 3 hearts and 4 questions. Winning gives +100 points and +1 life; losing costs a life. Rocks only stagger the hero.
- Mystery box every 6–8 questions that swaps the weapon: pistol, bow, slingshot or magic wand (`X`).
- Two monsters: wolf and giant spider.
- Four sceneries that change every 15 hits (field, forest, desert, city), each with its own music, critters and backdrop.
- Cheering visitor with a dog and a sign at milestones (first after 5–7 hits, then 25, 50, 100 and 200).
- "READY? / GO!" intro, a dark "GAME OVER" screen with its own tune, and a heartbeat when the screen turns red.
- Long reads (question and options of 500+ characters) get +30 s, with an on-screen notice.
- Balloon pointing at the sound button when a game starts.
- **Antes de começar** dialog: character and mode are chosen after **Jogar**, with nothing pre-selected.
- **Início** on Game Over, with a reminder to download the report before leaving.
- `scripts/responsive.mjs`: layout checks on 10 screen sizes, from 320 px phones to Full HD.

### Changed

- Rain is 75% quieter. Speed lines are hidden while it rains.
- The dragon breathes fire from closer.
- The page is pinned to the visible viewport, so mobile browser bars no longer push the HUD or the answers off screen. The answer list got more room.
- Game Over buttons: Desempenho and Histórico on one row, Jogar de novo and Início on the next.
- Gelo and Pular are disabled during boss fights.

### Fixed

- Music could freeze the page after a long pause (hidden tab, busy phone) by scheduling every missed beat at once.

### Removed

- Print-to-PDF report and its print stylesheet, replaced by the in-browser PDF.

## [2.1.0] - 2026-10-22

### Added

- Difficulty modes, chosen on the start screen and remembered. **Fácil**: +10 s per question, 5 Gelo, 3 Pular, 5 s lockout and +30% speed after a miss. **Avançado** is the original game.
- The mode is shown on the Game Over card, in the history and in the exported reports.
- One new practice question (Amazon Personalize).
- The smoke test also runs in WebKit, the Safari / iPhone engine, locally (`--browser webkit`) and in CI.

### Changed

- Opening "Como jogar" hides the character and mode pickers, so the rules get the space.

### Fixed

- No sound on some iPhones: audio now unlocks on any tap (iOS only counts the end of a touch as a gesture), and the game requests the media playback audio session so sound plays with the ring/silent switch on. The in-game mute button still silences everything.

## [2.0.0] - 2026-10-22

First public release of the game. Earlier prototypes were never published in this repository.

### Added

- Real-time quiz gameplay: the hero on the left shoots the correct option before a monster walking in from the right reaches them.
- Character choice on the start screen (man or woman), remembered between visits.
- Five inline-SVG monsters (dinosaur, dragon, snake, alligator, gorilla), each with its own attack (chomp, fire breath, coils, death roll, punch) and a matching end state for the hero.
- Monster travel time based on question and option length, getting faster every level.
- Lives (start with 1, max. 3). Three fast first-try hits earn a life, or +50 points when lives are full.
- Wrong answers eliminate the option, lock all options for 8 s and make the monster 40% faster, with a "downgrade" sign.
- Power-ups on the ground: 3 × **Gelo** (freezes the monster in an ice cube for 15 s) and 2 × **Pular** (swaps the question) per game.
- Life-lost and Game Over cards with the question, the correct answer and the explanation. The Game Over card adds points, hits, misses, accuracy, level, best streak and time.
- Question balloon floating in the sky, which auto-collapses after 20 s and reopens with a large button or `Q`.
- Living world: day/night cycle, rain with thunder, birds, bunnies and squirrels, crickets at night.
- Synthesized sound (Web Audio): effects, rain, birdsong, adaptive suspense music and a Game Over tune, with mute (`M`) remembered.
- End-of-game reports per game, exported as Markdown or as a printable PDF with a results chart, from the Game Over card or from any game in the history.
- Share button (Web Share API with copy fallback) and link preview (Open Graph image).
- Lucide icons, embedded as inline SVG; app icon, web app manifest and favicon set.
- Search engine metadata: canonical URL, schema.org JSON-LD, Open Graph/Twitter cards, sitemap and IndexNow key.
- Security policy and Dependabot for GitHub Actions and the dev dependency.
- Spaced review: questions missed more often than answered get extra copies in the next deck. Questions never repeat back to back.
- Local history (last 50 games), best score and history screen with an in-card clear confirmation.
- Question bank in `data/questions.js` with 8 example questions and 51 imported practice questions.
- Bank validation shared by the game, `scripts/validate-questions.mjs` and the tests.
- `scripts/import-questions.mjs` for bulk import from JSON.
- Unit tests with `node:test` and a Playwright smoke test at 360 px and 1280 px.
- Local server with `--lan` to play on a phone on the same Wi-Fi during development.
- GitHub Actions CI (syntax, bank, tests, smoke) and GitHub Pages deployment.
- Keyboard play, `aria-live` feedback, focus management in dialogs, AA contrast and `prefers-reduced-motion` support.
- Documentation: README, architecture, decisions, question guide and contributing guide.

[Unreleased]: https://github.com/iWIPER/awscloudquest/compare/v2.2.0...HEAD
[2.2.0]: https://github.com/iWIPER/awscloudquest/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/iWIPER/awscloudquest/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/iWIPER/awscloudquest/releases/tag/v2.0.0
