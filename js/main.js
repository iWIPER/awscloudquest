/**
 * AWS Cloud Quest — bootstrap: validates the bank, wires input and starts the loop.
 */
(function (root) {
  "use strict";

  const NS = root.AwsCloudQuest;
  const config = NS.config;
  const $ = (id) => document.getElementById(id);

  // ── Question bank ─────────────────────────────────────────────────────
  const bankLoaded = Array.isArray(root.QUESTIONS);
  const { questions, problems } = NS.questions.normalize(root.QUESTIONS, config);
  problems.forEach((p) => console.warn(`[AWS Cloud Quest] ${NS.questions.formatProblem(p)}`));

  const warnings = [];
  if (!bankLoaded) {
    warnings.push("⚠ Não encontrei o banco de perguntas (data/questions.js). Verifique se o arquivo existe.");
  } else if (questions.length === 0) {
    warnings.push("⚠ Nenhuma pergunta válida no banco. Corrija o data/questions.js para jogar.");
  } else if (problems.length > 0) {
    warnings.push(`⚠ ${problems.length === 1 ? "1 pergunta ignorada" : `${problems.length} perguntas ignoradas`} por erro de formato (detalhes no console).`);
  }

  // ── Wiring ────────────────────────────────────────────────────────────
  const ui = NS.ui.create(config);
  const field = $("field");
  const ground = field.querySelector(".ground");

  const game = NS.game.create({
    config,
    questions,
    store: NS.storage.store,
    ui,
    field,
    heroEl: $("hero"),
    monsterEl: $("monster"),
    fxLayer: $("fx"),
    groundHeight: () => ground.offsetHeight,
    canPlay: questions.length > 0,
  });
  NS.app = game; // handy for debugging and the smoke test

  $("answers").addEventListener("click", (event) => {
    const button = event.target.closest("button.answer");
    if (button) game.shoot(Number(button.dataset.index));
  });
  $("qpanel-toggle").addEventListener("click", () => game.togglePanel());
  $("btn-play").addEventListener("click", () => game.start());
  $("btn-continue").addEventListener("click", () => game.continueAfterLifeLost());
  $("btn-again").addEventListener("click", () => game.start());
  $("btn-history-start").addEventListener("click", () => game.openHistory());
  $("btn-history-over").addEventListener("click", () => game.openHistory());
  $("btn-history-close").addEventListener("click", () => ui.closeHistory());
  $("btn-history-clear").addEventListener("click", () => {
    if (root.confirm("Apagar o histórico e o recorde? As estatísticas de revisão das perguntas são mantidas.")) {
      game.clearHistory();
    }
  });

  // ── Keyboard ──────────────────────────────────────────────────────────
  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
    const key = event.key;

    if (ui.isOpen("history")) {
      if (key === "Escape") ui.closeHistory();
      return; // Enter/Space never act behind the history screen
    }

    if (key === "Enter" || key === " ") {
      // A focused button handles Enter/Space by itself.
      if (event.target instanceof HTMLButtonElement) return;
      if (game.confirm()) event.preventDefault();
      return;
    }

    if (ui.anyOpen()) return;

    if (key === "q" || key === "Q") {
      game.togglePanel();
      event.preventDefault();
      return;
    }

    if (key.length === 1) {
      const digit = "123456".indexOf(key);
      const letter = "abcdef".indexOf(key.toLowerCase());
      const index = digit >= 0 ? digit : letter;
      if (index >= 0) {
        game.shoot(index);
        event.preventDefault();
      }
    }
  });

  game.boot(warnings);
})(typeof window !== "undefined" ? window : globalThis);
