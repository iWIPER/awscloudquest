# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2026-10-21

First public release of the game. Earlier prototypes were never published in this repository.

### Added

- Real-time quiz gameplay: the hero on the left shoots the correct option before a monster walking in from the right reaches him.
- Four inline-SVG monsters (dinosaur, dragon, snake, alligator), each with its own attack (chomp, fire breath, coils, death roll) and a matching end state for the hero.
- Monster travel time based on question and option length, getting faster every level.
- Lives (start with 1, max. 3). Three fast first-try hits earn a life, or +50 points when lives are full.
- Wrong answers lock the option and push the monster forward 8%.
- Life-lost and Game Over cards with the question, the correct answer and the explanation.
- Question panel that auto-collapses after 20 s and reopens on tap or `Q`.
- Spaced review: questions missed more often than answered get extra copies in the next deck. Questions never repeat back to back.
- Local history (last 50 games), best score and history screen.
- Question bank in `data/questions.js` with 8 example questions and 51 imported practice questions.
- Bank validation shared by the game, `scripts/validate-questions.mjs` and the tests.
- `scripts/import-questions.mjs` for bulk import from JSON.
- Unit tests with `node:test` and a Playwright smoke test at 360 px and 1280 px.
- GitHub Actions CI (syntax, bank, tests, smoke) and GitHub Pages deployment.
- Keyboard play, `aria-live` feedback, focus management in dialogs, AA contrast and `prefers-reduced-motion` support.
- Documentation: README, architecture, decisions, question guide and contributing guide.

[Unreleased]: https://github.com/iWIPER/awscloudquest/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/iWIPER/awscloudquest/releases/tag/v2.0.0
