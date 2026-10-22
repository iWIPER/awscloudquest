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
  const store = NS.storage.store;
  const ui = NS.ui.create(config);
  const field = $("field");
  const ground = field.querySelector(".ground");
  const reducedMotion = () => (root.matchMedia ? root.matchMedia("(prefers-reduced-motion: reduce)").matches : false);

  const sound = NS.sound.create({ muted: store.getMuted() });
  const ambient = NS.ambient.create({
    world: $("world"),
    sky: $("sky"),
    critterLayer: $("critters"),
    config,
    sound,
    reducedMotion,
  });

  const game = NS.game.create({
    config,
    questions,
    store,
    ui,
    sound,
    ambient,
    field,
    heroEl: $("hero"),
    monsterEl: $("monster"),
    fxLayer: $("fx"),
    groundHeight: () => ground.offsetHeight,
    canPlay: questions.length > 0,
  });
  NS.app = game;      // handy for debugging and the smoke test
  NS.scene = ambient; // idem: NS.scene.set({ time: 0.7, rain: true })

  // ── Sound ─────────────────────────────────────────────────────────────
  // Audio may only start after a user gesture; the first one unlocks it.
  const unlockAudio = () => sound.unlock();
  ["pointerdown", "keydown"].forEach((type) => document.addEventListener(type, unlockAudio, { capture: true }));

  function toggleSound() {
    const muted = !sound.isMuted();
    sound.setMuted(muted);
    store.setMuted(muted);
    ui.setMuted(muted);
    ui.announce(muted ? "Som desligado." : "Som ligado.");
  }
  ui.setMuted(sound.isMuted());
  $("btn-sound").addEventListener("click", toggleSound);

  $("answers").addEventListener("click", (event) => {
    const button = event.target.closest("button.answer");
    if (button) game.shoot(Number(button.dataset.index));
  });
  $("qpanel-toggle").addEventListener("click", () => game.togglePanel());
  $("btn-freeze").addEventListener("click", () => game.freeze());
  $("btn-skip").addEventListener("click", () => game.skip());
  document.querySelectorAll('input[name="hero"]').forEach((input) => {
    input.addEventListener("change", () => {
      game.setHero(input.value);
      ui.setHeroChoice(input.value, questions.length > 0);
    });
  });
  $("btn-play").addEventListener("click", () => game.start());
  $("btn-continue").addEventListener("click", () => game.continueAfterLifeLost());
  $("btn-again").addEventListener("click", () => game.start());
  $("btn-history-start").addEventListener("click", () => game.openHistory());
  $("btn-history-over").addEventListener("click", () => game.openHistory());
  $("btn-history-close").addEventListener("click", () => ui.closeHistory());
  $("btn-history-clear").addEventListener("click", () => ui.setClearConfirm(true));
  $("btn-clear-cancel").addEventListener("click", () => ui.setClearConfirm(false));
  $("btn-clear-yes").addEventListener("click", () => {
    game.clearHistory();
    ui.announce("Histórico apagado.");
  });

  // ── Keyboard ──────────────────────────────────────────────────────────
  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
    const key = event.key;

    if (key === "m" || key === "M") {
      toggleSound();
      return;
    }

    if (ui.isOpen("history")) {
      if (key === "Escape") {
        if (ui.isClearConfirmOpen()) ui.setClearConfirm(false);
        else ui.closeHistory();
      }
      return; // Enter/Space never act behind the history screen
    }

    if (key === "Enter" || key === " ") {
      // A focused button handles Enter/Space by itself.
      if (event.target instanceof HTMLButtonElement) return;
      if (game.confirm()) event.preventDefault();
      return;
    }

    if (ui.anyOpen()) return;

    const lower = key.toLowerCase();
    if (lower === "q" || lower === "g" || lower === "p") {
      if (lower === "q") game.togglePanel();
      if (lower === "g") game.freeze();
      if (lower === "p") game.skip();
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
