# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- The cheering visitor tosses the hero a flower: the hero puts the weapon away for the visit, holds the flower, and takes the weapon back when the visitor leaves.

### Removed

- The cheering visitor no longer shows up in the duel: the duel is just the two players in the Wild West town.

### Fixed

- A player knocked down in the duel (special move or defeat) lay on top of their weapon; they now put it away before falling and take it back when they get up.
- The boss silhouette walked in at the size of the previous monster during its dark arrival; it now has the boss's size from the start.
- The alligator's speed badge covered its head; it now sits just above it.
- Lines now match the character: "[o herói|a heroína]" for the visitor at 100 hits, and in the duel "Campeã", "a mais forte", "Mais rápida" and "está pronta" for a woman.

## [3.0.0] - 2026-10-27

### Added

**Duel 1×1**

- Play a friend in real time: create a room, share the link, both tap **Pronto!**, and a 10-second countdown starts. The room creator picks 10 or 20 lives.
- Same question and option order for both, opened by a "ROUND N" sign with a drum hit. The first correct answer shoots the other player; a wrong answer locks that player until the round ends; both wrong or time out costs both a life; both at zero together is a draw.
- Wild West town (saloon, bank, sheriff, hotel, store) with day, night and rain shared by both screens, "PROCURADO" posters, a fast showdown theme, taunt signs and an "AI!" for each hit.
- Victory scene: the winner puts the gun away, climbs a podium beside the Brazil flag and jumps for joy (both climb a wide podium in a draw); the screen darkens with "<NOME> VENCEU!" until a tap.
- End card with a versus scoreboard (both characters and the matches each won), **Revanche**, and a report for each player: the duel result plus the usual performance by area.
- A dropped connection pauses the match for up to 2 minutes and the browser reconnects by itself; a player who leaves is announced to the other.
- Invitations link to `duelo.html`, which shows a duel preview in WhatsApp and other apps ("Jogador 1" × "Jogador 2") and forwards into the room.
- The visitor with the dog also drops by in the duel, every 7 rounds, on both screens.
- Special move, once per match: in rounds 4 to 7, the first round only one player gets right becomes a short film. The question goes away, black bars close in, the winner runs over and strikes with a cartoon knife, and the other falls to the ground and gets up.
- The loser of a match drops to their knees, then falls to the ground.
- Built without a server or account: a minimal MQTT client (`js/net.js`) over free public brokers, and pure referee rules (`js/duel-rules.js`). The room creator's browser is the referee, and "first" is measured on each player's own screen.

**Questions and study**

- 141 new practice questions: 201 in total, from four practice-exam files, with repeats skipped. Five answer keys flagged for review in the source keep their note and the suggested key.
- "Selecione DUAS" questions (`answer: ["A", "E"]`): mark both right options to bring the monster down; the first is marked "1 de 2". They get 15 extra seconds. 36 in the bank; they work in the duel too.
- Topics follow the official CLF-C02 exam guide: each topic maps to a task statement, shown on the question tag ("2.3 IAM e identidade"), and the report shows each domain's weight ("Segurança e conformidade (30% da prova)"). New topics 3.1 Implantação e operação and 3.8 Integração e outros serviços.
- **Dica** in the easy mode (key D): pauses the game and opens a study card for the question's topic, with memory tricks and a mind map of services, without giving the answer away.
- The importer reads the new practice-exam formats (options by letter, `resposta` / `resposta_correta`, `revisao`).

**Gameplay and world**

- Pause: the ⏸ button or Esc shows a dim "JOGO PAUSADO" screen; leaving the page (answering a message, switching apps) pauses by itself. **Encerrar partida** on the pause screen asks "Tem certeza que deseja encerrar?" and ends the game with a "PARTIDA ENCERRADA" summary and its report.
- Four monsters: three flying ones that hover, flap and dive (giant bat, pterodactyl, giant wasp) and a giant scorpion. The wasp and the scorpion leave the hero poisoned. The hero aims up at flying monsters.
- Two new boss species with color variants: King Kong (Kong, fire Kong, Yeti) and minotaur (minotaur, lava, ice), besides the golem (stone, lava, ice, robot, and the new Cyclops). A fight never repeats the previous species.
- Bosses roar their own way when they arrive and when hit, and threaten the hero in a speech bubble ("Eu vou acabar com você!"). Each throws its own thing (rock, boulder, fireball, snowball, barrel, laser) and finishes a won fight with its own close attack (smash, pound, horn charge, or the Cyclops swallowing the hero).
- Speech bubbles: the cheering visitor and the hero have a short conversation ("Você é minha heroína!"), with a louder dog bark and a visible "AU AU!".
- The boss arrives like a film: the screen goes dark and flickers, heavy steps shake the ground and lightning flashes while its silhouette walks in, then a flash shows it and it roars.
- A defeated boss trembles, tips over and falls apart in pieces of its own colors before the reward.
- Scenery changes are a short scene: the question goes away, the hero runs off, the new place's name shows, the scenery appears with the hero running back in, then the question.

### Changed

- More time to answer: Avançado 30 s base (was 20), Fácil 45 s (was 30, so +15 s over Avançado), reading counted at 15 characters per second (was 25), and levels shorten only the thinking time, never the reading time.
- Bosses are upright giants: head on top and the arm from the shoulder (it looked like an elephant's trunk). Against a boss, a miss only locks the answers: no speed-up, no speed badge or speed lines.
- The city is an avenue: asphalt with lane marks, sidewalk, street lamps that light up at night, and cars, taxis, vans and buses passing by day and night.
- Losing the last life fades the screen slowly to dark before "GAME OVER" appears; a new record shows as a "NOVO RECORDE!" badge on the Game Over card instead of replacing the title.
- "Segurança de rede" became "Redes e VPC" (task 3.5, domain 3), as in the exam guide.
- The README starts with a short guide for players; contributor sections come after.
- "Como jogar" and the mode cards describe the new rules: Fácil shows "+15s por pergunta" and "dicas"; there are lines for the hint, the pause and the boss.

- The duel connects to both public relays at once and sends each message through both; the first copy to arrive counts. Joining no longer waits for a slow relay, messages take the fastest path, and a relay that fails for one player no longer leaves the two in different places.
- The game loop measures the screen only after a resize and writes a style only when it changes, so still frames cost almost nothing.

### Fixed

- The screen could zoom in by itself on phones (double tap on an answer or a two-finger touch), cutting off every edge. Double-tap and pinch zoom are now disabled in the game.
- The guest's screen could stay shifted up after typing a name on iPhone (the keyboard scrolled the page).
- Speed badges and speed lines sat in the wrong place on flying and low monsters (snake, alligator); the boss showed a speed badge behind its hearts.
- Boss speech bubbles piled up; a new line now replaces the one on screen.
- The snake's speed badge covered its head; it now sits just above it.
- Reports: every question shows its exam tag (task, topic and domain) instead of the bare topic name, the PDF names the exam above the areas, and a duel report names its sections for a duel ("Acertei", "O adversário foi mais rápido") and shows the rounds played instead of a best streak that a duel does not have.

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

[Unreleased]: https://github.com/iWIPER/awscloudquest/compare/v3.0.0...HEAD
[3.0.0]: https://github.com/iWIPER/awscloudquest/compare/v2.2.0...v3.0.0
[2.2.0]: https://github.com/iWIPER/awscloudquest/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/iWIPER/awscloudquest/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/iWIPER/awscloudquest/releases/tag/v2.0.0
