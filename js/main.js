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
  // Audio may only start inside a user gesture. On touch screens iOS only counts
  // the end of a tap (touchend/click), not pointerdown, so listen to all of them
  // until audio is actually running.
  const GESTURES = ["pointerdown", "pointerup", "touchend", "click", "keydown"];
  const unlockAudio = () => {
    sound.unlock();
    if (sound.isRunning()) GESTURES.forEach((type) => document.removeEventListener(type, unlockAudio, true));
  };
  GESTURES.forEach((type) => document.addEventListener(type, unlockAudio, true));
  // iOS may suspend audio when the tab goes to the background; the next tap resumes it.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && !sound.isRunning()) GESTURES.forEach((type) => document.addEventListener(type, unlockAudio, true));
  });

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

  // ── Report and sharing (Game Over card) ───────────────────────────────
  const SITE_URL = "https://iwiper.github.io/awscloudquest/";
  const shareUrl = () => (/^https?:$/.test(root.location.protocol) && !/^(localhost|127\.|192\.168\.)/.test(root.location.hostname) ? root.location.href.split("#")[0] : SITE_URL);

  /** Briefly swaps a button's label to confirm an action. */
  function flashLabel(button, text) {
    const label = button.querySelector(".btn-label") || button.lastElementChild;
    const original = label.textContent;
    label.textContent = text;
    setTimeout(() => (label.textContent = original), 1800);
  }

  /** Copies text; falls back to a hidden textarea where the Clipboard API is unavailable (plain http). */
  async function copyText(text) {
    if (navigator.clipboard && root.isSecureContext) return navigator.clipboard.writeText(text);
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.cssText = "position:fixed;opacity:0;pointer-events:none";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    if (!ok) throw new Error("copy failed");
  }

  $("btn-share").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    const report = game.lastReport();
    const text = report
      ? `Fiz ${report.score} pontos e acertei ${report.correct} perguntas no AWS Cloud Quest! Consegue me superar?`
      : "Estude AWS jogando no AWS Cloud Quest!";
    const data = { title: "AWS Cloud Quest", text, url: shareUrl() };
    try {
      if (navigator.share) {
        await navigator.share(data);
        return;
      }
      await copyText(`${text} ${data.url}`);
      flashLabel(button, "Link copiado!");
      ui.announce("Link copiado para a área de transferência.");
    } catch (error) {
      if (error && error.name === "AbortError") return; // the player closed the share sheet
      flashLabel(button, "Não deu");
      ui.announce("Não foi possível compartilhar.");
    }
  });

  function exportMarkdown(report) {
    if (!report) return;
    const blob = new Blob([NS.report.toMarkdown(report)], { type: "text/markdown;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `aws-cloud-quest-relatorio-${NS.report.stamp(report)}.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    ui.announce("Relatório em Markdown baixado.");
  }

  function exportPdf(report) {
    if (!report) return;
    NS.report.renderPrintable($("report"), report);
    // The print dialog offers "Salvar como PDF"; css/style.css shows only the report when printing.
    root.print();
  }

  // Game Over: the game that just ended.
  $("btn-md").addEventListener("click", () => exportMarkdown(game.lastReport()));
  $("btn-pdf").addEventListener("click", () => exportPdf(game.lastReport()));

  // History: any saved game, one at a time.
  $("hist-list").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-export]");
    if (!button) return;
    const report = game.reportAt(Number(button.dataset.t));
    if (button.dataset.export === "pdf") exportPdf(report);
    else exportMarkdown(report);
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
