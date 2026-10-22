# Security policy

AWS Cloud Quest is a static site. It has no backend, no accounts and no runtime dependencies. Everything it stores (history, best score, preferences) stays in the player's browser `localStorage`.

## Reporting a vulnerability

Please **do not open a public issue** for security problems. Use GitHub's [private vulnerability reporting](https://github.com/iWIPER/awscloudquest/security/advisories/new) instead, and include:

- what the problem is and where (file and line, or the steps in the game);
- how to reproduce it;
- the impact you expect.

You can expect a first answer within a week. Fixes are released on `main` and deployed to GitHub Pages automatically.

## Scope

Things worth reporting include script injection through the question bank or exported reports, and anything that could leak data from the player's browser. Content issues, such as a wrong answer key, are not security issues; please use the question issue template for those.
