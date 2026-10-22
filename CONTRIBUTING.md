# Contributing

Thanks for helping! The project works directly on `main`; keep each commit small and focused.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/), in English:

| Type | Use for |
|---|---|
| `feat` | New gameplay or UI behavior, new questions |
| `fix` | Bug fixes, wrong answer keys |
| `docs` | Documentation only |
| `test` | Tests only |
| `refactor` | Code changes that don't change behavior |
| `ci` | GitHub Actions workflows |
| `chore` | Tooling, config, maintenance |

Examples: `feat: add 10 questions about IAM`, `fix: correct answer key of clf-sim01-21`.

## Before you push

```bash
npm run ci      # syntax check + question bank validation + unit tests
```

If you changed the UI, also run the smoke test:

```bash
npm install
npx playwright install chromium
npm run smoke
```

## Questions

- Follow [docs/ADDING_QUESTIONS.md](docs/ADDING_QUESTIONS.md).
- Every new question needs an `explanation`, and the answer must be backed by current AWS documentation. Link the source in the commit or issue.
- Run `npm run validate`. It uses the same rules as the game.

## Code style

- No dependencies at runtime, and no build step.
- Code, identifiers and comments in English. Text shown to players in Portuguese (pt-BR).
- Gameplay numbers belong in `js/config.js`.
- Render bank text with `textContent`, never `innerHTML`.
- Animate with `transform` and `opacity` only, and respect `prefers-reduced-motion`.
- `.editorconfig` sets the formatting: 2 spaces, LF, UTF-8.
