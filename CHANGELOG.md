# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
- Lucide icons, embedded as inline SVG.
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

[Unreleased]: https://github.com/iWIPER/awscloudquest/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/iWIPER/awscloudquest/releases/tag/v2.0.0
