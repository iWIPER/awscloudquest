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

  // ── Topics ────────────────────────────────────────────────────────────
  // Questions without a known `topic` are classified from their text, so the
  // "Desempenho por área" report works for questions added later.
  const guide = root.STUDY_GUIDE || null;
  const compiledTopics = NS.topics.compile(guide);
  for (const question of questions) {
    question.topic = NS.topics.topicOf(question, guide, compiledTopics) || question.topic;
    // Official exam task statement of the topic ("2.3"), shown on the question tag.
    question.task = (guide && guide.topics[question.topic] && guide.topics[question.topic].task) || "";
  }

  /** Fills missing topics in a saved report (games played before topics existed). */
  function withTopics(report) {
    if (!report || !guide) return report;
    const log = report.log.map((entry) =>
      entry.topic && guide.topics[entry.topic]
        ? entry
        : { ...entry, topic: NS.topics.classify({ q: entry.q, options: [], answer: entry.answer, explanation: entry.explanation }, compiledTopics) || "" }
    );
    return { ...report, log };
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
    scenery: $("scenery"),
    config,
    sound,
    reducedMotion,
  });
  const visitor = NS.visitor.create($("visitors"), { sound, reducedMotion });

  const game = NS.game.create({
    config,
    questions,
    store,
    ui,
    sound,
    ambient,
    visitor,
    field,
    heroEl: $("hero"),
    world: $("world"),
    monsterEl: $("monster"),
    fxLayer: $("fx"),
    groundHeight: () => ground.offsetHeight,
    canPlay: questions.length > 0,
    guide,
  });
  NS.app = game;      // handy for debugging and the smoke test
  NS.scene = ambient; // idem: NS.scene.set({ time: 0.7, rain: true })

  // ── No zoom ─────────────────────────────────────────────────────────
  // iOS Safari ignores maximum-scale and touch-action for pinch zoom; its
  // proprietary gesture events are the only way to keep the layout at 100%.
  for (const type of ["gesturestart", "gesturechange"]) {
    document.addEventListener(type, (event) => event.preventDefault(), { passive: false });
  }

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
    if (!button) return;
    const index = Number(button.dataset.index);
    if (duel.active()) duel.answer(index);
    else game.shoot(index);
  });
  $("qpanel-toggle").addEventListener("click", () => game.togglePanel());
  $("btn-freeze").addEventListener("click", () => game.freeze());
  $("btn-skip").addEventListener("click", () => game.skip());
  $("btn-hint").addEventListener("click", () => game.openHint());
  $("btn-pause").addEventListener("click", () => game.pause());
  $("btn-resume").addEventListener("click", () => game.resume());
  $("btn-quit").addEventListener("click", () => ui.askQuit(true));
  $("btn-quit-no").addEventListener("click", () => game.resume());
  $("btn-quit-yes").addEventListener("click", () => game.quit());
  $("btn-hint-close").addEventListener("click", () => game.closeHint());
  $("weapon-box").addEventListener("click", () => game.openBox());
  $("curtain").addEventListener("click", () => game.showGameOverCard());
  document.querySelectorAll('input[name="mode"]').forEach((input) => {
    input.addEventListener("change", () => {
      game.setMode(input.value);
      ui.updateSetup();
      ui.announce(`Modo ${game.config().modeLabel} selecionado.`);
    });
  });
  document.querySelectorAll('input[name="hero"]').forEach((input) => {
    input.addEventListener("change", () => {
      game.setHero(input.value);
      ui.updateSetup();
    });
  });
  $("btn-play").addEventListener("click", () => ui.showSetup());
  $("btn-begin").addEventListener("click", () => game.start());
  $("btn-setup-back").addEventListener("click", () => ui.backToStart());
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

  function exportMarkdown(rawReport) {
    const report = withTopics(rawReport);
    if (!report) return;
    const blob = new Blob([NS.report.toMarkdown(report, guide)], { type: "text/markdown;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `aws-cloud-quest-relatorio-${NS.report.stamp(report)}.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    ui.announce("Relatório em Markdown baixado.");
  }

  /** Opens the "Relatório em PDF" card for one game: view it or download it (no print dialog). */
  function exportPdf(rawReport) {
    const report = withTopics(rawReport);
    if (!report) return;
    const bytes = NS.report.toPdf(report, guide);
    const file = `aws-cloud-quest-relatorio-${NS.report.stamp(report)}.pdf`;
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
    ui.showPdf({ url, file, sizeKb: Math.max(1, Math.round(bytes.length / 1024)) });
  }

  $("btn-pdf-close").addEventListener("click", () => ui.closePdf());

  /** "Desempenho por área" screen for one game. */
  function showAreas(rawReport) {
    const report = withTopics(rawReport);
    if (!report || !guide) return;
    ui.showAreas(NS.report.analyzeAreas(report.log, guide), report);
  }

  // Game Over: the game that just ended.
  $("btn-areas").addEventListener("click", () => showAreas(game.lastReport()));
  $("btn-home").addEventListener("click", () => ui.askLeave());
  // "Voltar ao início?" serves the solo Game Over and the duel end card.
  $("btn-leave-pdf").addEventListener("click", () => exportPdf(duel.active() ? duel.lastReport() : game.lastReport()));
  $("btn-leave-go").addEventListener("click", () => (duel.active() ? duel.leave() : game.goHome()));
  $("btn-leave-cancel").addEventListener("click", () => ui.cancelLeave());
  $("btn-md").addEventListener("click", () => exportMarkdown(game.lastReport()));
  $("btn-pdf").addEventListener("click", () => exportPdf(game.lastReport()));
  $("btn-areas-close").addEventListener("click", () => ui.closeAreas());

  // ── Duel 1×1 ──────────────────────────────────────────────────────
  const duel = NS.duel.create({
    config,
    questions,
    store,
    ui,
    sound,
    ambient,
    visitor,
    field,
    onExit: () => game.goHome(),
    onReport(kind, report) {
      if (kind === "areas") showAreas(report);
      else if (kind === "pdf") exportPdf(report);
      else exportMarkdown(report);
    },
    async copy(text, button) {
      try {
        await copyText(text);
        flashLabel(button, "Copiado!");
        ui.announce("Link copiado.");
      } catch {
        flashLabel(button, "Não deu");
      }
    },
    async share(data, button) {
      try {
        if (navigator.share) return await navigator.share(data);
        await copyText(`${data.text} ${data.url}`);
        flashLabel(button, "Link copiado!");
      } catch (error) {
        if (!error || error.name !== "AbortError") flashLabel(button, "Não deu");
      }
    },
  });
  NS.duelApp = duel; // for the smoke test
  $("btn-duel").disabled = questions.length === 0;
  $("btn-duel").addEventListener("click", () => duel.openSetup());
  const joinFromLink = () => {
    const room = NS.duelRules.roomFromHash(root.location.hash);
    if (room && questions.length > 0) duel.openSetup(room);
  };
  root.addEventListener("hashchange", joinFromLink);

  // History: any saved game, one at a time.
  $("hist-list").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-export]");
    if (!button) return;
    const report = game.reportAt(Number(button.dataset.t));
    if (button.dataset.export === "pdf") exportPdf(report);
    else if (button.dataset.export === "areas") showAreas(report);
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

    if (ui.isOpen("areas") || ui.isOpen("pdf")) {
      if (key === "Escape") (ui.isOpen("pdf") ? ui.closePdf : ui.closeAreas)();
      return; // buttons inside these screens handle Enter/Space themselves
    }

    if (game.isPaused()) {
      // Esc resumes (or closes "Encerrar a partida?"); Enter and Space press the focused button.
      if (key === "Escape") {
        if (ui.isAskingQuit()) ui.askQuit(false);
        else game.resume();
        event.preventDefault();
      }
      return;
    }

    if (ui.isOpen("hint") && key === "Escape") {
      game.closeHint();
      return;
    }

    if (ui.isOpen("leave") && key === "Escape") {
      ui.cancelLeave();
      return;
    }

    if (ui.isOpen("setup") && key === "Escape") {
      ui.backToStart();
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
      if (key === " " && event.target instanceof HTMLInputElement) return; // Space picks a radio option
      if (game.confirm()) event.preventDefault();
      return;
    }

    if (ui.anyOpen()) return;

    if (key === "Escape" && !duel.active()) {
      game.pause();
      return;
    }

    if (duel.active()) {
      // In a duel only the answer keys work (no power-ups, no panel toggle).
      const index = key.length === 1 ? Math.max("123456".indexOf(key), "abcdef".indexOf(key.toLowerCase())) : -1;
      if (index >= 0) {
        duel.answer(index);
        event.preventDefault();
      }
      return;
    }

    const lower = key.toLowerCase();
    const shortcuts = { q: game.togglePanel, g: game.freeze, p: game.skip, x: game.openBox, d: game.openHint };
    if (shortcuts[lower]) {
      shortcuts[lower]();
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
  joinFromLink();
})(typeof window !== "undefined" ? window : globalThis);
