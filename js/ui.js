/**
 * AWS Cloud Quest — DOM rendering: HUD, question balloon, answers, overlays.
 *
 * The UI never decides game rules; game.js calls these functions with the
 * data to show. All user-facing text is Portuguese (pt-BR). Text that comes
 * from the question bank is always written with textContent, never innerHTML;
 * innerHTML is only used for our own icon markup.
 */
(function (root) {
  "use strict";

  const LETTERS = "ABCDEF";
  const $ = (id) => document.getElementById(id);
  const icon = (...args) => root.AwsCloudQuest.icons.icon(...args);

  /** Creates a DOM element with optional class and text. */
  function h(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  /** Element whose content is an icon followed by plain text. */
  function withIcon(tag, className, iconName, text, iconOpts) {
    const el = h(tag, className);
    el.innerHTML = icon(iconName, iconOpts);
    el.append(` ${text}`);
    return el;
  }

  const formatDate = (t) => {
    const d = new Date(t);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  /** 42 → "42s", 93 → "1:33". */
  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${s}s`;
  };

  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  /**
   * @param {object} baseConfig the base CONFIG (with MODES). The effective
   *   config of the chosen mode is set later with setConfig().
   */
  function create(baseConfig) {
    let config = baseConfig;
    const modeConfig = (mode) => root.AwsCloudQuest.rules.configFor(baseConfig, mode);
    const modeLabel = (mode) => (baseConfig.MODES[mode] ? baseConfig.MODES[mode].label : "");
    const el = {
      app: $("app"),
      world: $("world"),
      lives: $("hud-lives"),
      score: $("hud-score"),
      fast: $("hud-fast"),
      level: $("hud-level"),
      best: $("hud-best"),
      bestItem: $("hud-best-item"),
      sound: $("btn-sound"),
      panel: $("qpanel"),
      panelToggle: $("qpanel-toggle"),
      panelArrow: $("qpanel-arrow"),
      panelBar: $("qpanel-bar"),
      topic: $("q-topic"),
      timer: $("q-timer"),
      text: $("q-text"),
      answers: $("answers"),
      answersWrap: $("answers").parentElement,
      lock: $("answers-lock"),
      lockSecs: $("lock-secs"),
      live: $("live"),
      overlays: {
        start: $("ov-start"),
        setup: $("ov-setup"),
        leave: $("ov-leave"),
        life: $("ov-life"),
        over: $("ov-over"),
        history: $("ov-history"),
        areas: $("ov-areas"),
        pdf: $("ov-pdf"),
      },
    };

    let answerButtons = [];
    const SOUND_HINT_MS = 6500;
    let soundHintTimer = 0;
    let openOverlay = null;     // key of the overlay currently shown
    let historyReturnTo = null; // overlay to go back to when history closes
    let areasReturnTo = null;   // overlay to go back to when the areas screen closes
    let pdfReturnTo = null;     // overlay to go back to when the PDF card closes
    let pdfUrl = null;          // object URL of the current PDF (revoked on close)
    let lastFocus = null;
    let lastTimerKey = "";
    let lastLockText = "";

    // Static icons and character previews.
    document.querySelectorAll("[data-icon]").forEach((slot) => {
      slot.innerHTML = icon(slot.dataset.icon, {
        size: Number(slot.dataset.size) || 20,
        fill: slot.dataset.fill || "none",
      });
    });
    document.querySelectorAll("[data-hero-art]").forEach((slot) => {
      slot.innerHTML = root.AwsCloudQuest.hero.artFor(slot.dataset.heroArt);
    });

    // "Como jogar" accordion on the start card (closed by default).
    const howtoToggle = $("howto-toggle");
    howtoToggle.addEventListener("click", () => {
      const open = howtoToggle.getAttribute("aria-expanded") !== "true";
      howtoToggle.setAttribute("aria-expanded", String(open));
      $("howto").classList.toggle("is-open", open);
      $("start-rules").hidden = !open;
    });

    // ── HUD ─────────────────────────────────────────────────────────────
    function renderHud({ lives, score, fast, level, best, isRecord = false }) {
      el.lives.innerHTML = Array.from({ length: config.MAX_LIVES }, (_, i) =>
        icon("heart", { size: 18, className: i < lives ? "heart-full" : "heart-empty", fill: i < lives ? "currentColor" : "none" })
      ).join("");
      el.lives.setAttribute("aria-label", `Vidas: ${lives} de ${config.MAX_LIVES}`);
      el.score.textContent = String(score);
      el.fast.replaceChildren(
        ...Array.from({ length: config.FAST_NEEDED }, (_, i) => h("span", i < fast ? "dot is-on" : "dot"))
      );
      el.fast.setAttribute("aria-label", `Acertos rápidos: ${fast} de ${config.FAST_NEEDED}`);
      el.level.textContent = String(level);
      el.best.textContent = String(best);
      el.bestItem.classList.toggle("is-record", isRecord);
    }

    /** Power-up buttons on the ground: remaining uses, enabled only while playing. */
    function renderPowers(powers, { playing, frozen, boss = false }) {
      const freezeButton = $("btn-freeze");
      const skipButton = $("btn-skip");
      $("freeze-count").textContent = String(powers.freeze);
      $("skip-count").textContent = String(powers.skip);
      // No Gelo or Pular against the boss.
      freezeButton.disabled = !playing || boss || frozen || powers.freeze <= 0;
      skipButton.disabled = !playing || boss || powers.skip <= 0;
      freezeButton.classList.toggle("is-active", frozen);
      freezeButton.setAttribute(
        "aria-label",
        `Gelo: congela o monstro por ${config.FREEZE_SECONDS} segundos. Restam ${powers.freeze}. Tecla G.`
      );
      skipButton.setAttribute("aria-label", `Pular a pergunta sem perder vida. Restam ${powers.skip}. Tecla P.`);
    }

    // ── Scripted moments ────────────────────────────────────────────────
    /** Big centred message (READY? / GO! / boss / scenery). kind picks the style. */
    function banner(text, kind = "") {
      const el = $("banner");
      el.className = `banner banner-${kind}`;
      el.textContent = text;
      void el.offsetWidth; // restart the animation for back-to-back banners
      el.classList.add("is-on");
    }

    function clearBanner() {
      $("banner").classList.remove("is-on");
    }

    /** Hides the question and the answers while a scripted moment plays. */
    function setEvent(on) {
      el.app.classList.toggle("is-event", on);
    }

    /** Shows or hides the mystery box next to the hero. */
    function setBox(visible) {
      const box = $("weapon-box");
      box.hidden = !visible;
      if (visible) {
        box.classList.remove("is-new");
        void box.offsetWidth;
        box.classList.add("is-new");
      }
    }

    /** Dark "GAME OVER" (or "NOVO RECORDE!") screen before the summary card. */
    function showDeath(newRecord) {
      $("curtain-title").textContent = newRecord ? "NOVO RECORDE!" : "GAME OVER";
      $("curtain").hidden = false;
      el.app.inert = true;
    }

    function hideDeath() {
      $("curtain").hidden = true;
      if (!openOverlay) el.app.inert = false;
    }

    /**
     * Short balloon under the sound button ("Ligar som" / "Desligar som") with
     * a speaker icon that flips between on and off, so players notice the button.
     */
    function soundHint(muted) {
      const hint = $("sound-hint");
      const button = $("btn-sound");
      hint.innerHTML =
        `<span class="sh-icons">${icon("volume-2", { size: 18, className: "sh-on" })}${icon("volume-x", { size: 18, className: "sh-off" })}</span>` +
        `<span>${muted ? "Ligar som" : "Desligar som"}</span>`;
      hint.hidden = false;
      for (const target of [hint, button]) {
        target.classList.remove("is-hinting");
        void target.offsetWidth;
        target.classList.add("is-hinting");
      }
      clearTimeout(soundHintTimer);
      soundHintTimer = setTimeout(() => {
        hint.hidden = true;
        button.classList.remove("is-hinting");
      }, SOUND_HINT_MS);
    }

    function setMuted(muted) {
      el.sound.innerHTML = icon(muted ? "volume-x" : "volume-2", { size: 20 });
      el.sound.setAttribute("aria-label", muted ? "Ligar som" : "Desligar som");
      el.sound.classList.toggle("is-muted", muted);
    }

    // ── Question balloon ────────────────────────────────────────────────
    function renderQuestion(question, shown) {
      el.text.textContent = question.q;
      el.text.scrollTop = 0;
      el.topic.textContent = question.topic;
      el.topic.hidden = !question.topic;

      answerButtons = shown.map((option, i) => {
        const button = h("button", `answer answer-${i}`);
        button.type = "button";
        button.dataset.index = String(i);
        button.append(h("span", "answer-key", LETTERS[i]), h("span", "answer-text", option.text));
        button.setAttribute("aria-label", `${LETTERS[i]}: ${option.text}`);
        return button;
      });
      el.answers.replaceChildren(...answerButtons);
      el.answers.scrollTop = 0;
      updateMoreHint();
    }

    /** Shows "▼ mais alternativas" while some options are hidden below the scroll area. */
    function updateMoreHint() {
      const a = el.answers;
      const hidden = a.scrollHeight - a.scrollTop - a.clientHeight > 4;
      el.answersWrap.classList.toggle("has-more", hidden);
    }
    el.answers.addEventListener("scroll", updateMoreHint, { passive: true });
    root.addEventListener("resize", updateMoreHint);

    function setPanelOpen(open) {
      el.panel.classList.toggle("is-closed", !open);
      el.panelToggle.setAttribute("aria-expanded", String(open));
      el.panelArrow.innerHTML = icon(open ? "chevron-up" : "chevron-down", { size: 20, strokeWidth: 3 });
      el.panelArrow.append(open ? " Fechar" : " Abrir");
    }

    /** Auto-close bar: 1 = full, 0 = empty. */
    function setPanelProgress(fraction) {
      el.panelBar.style.transform = `scaleX(${Math.max(0, Math.min(1, fraction))})`;
    }

    /** Timer chip: ⚡ countdown while a fast hit is possible, then a clock until the monster arrives. */
    function setTimer(fastStill, seconds) {
      const value = Math.max(0, Math.ceil(seconds));
      const key = `${fastStill}:${value}`;
      if (key === lastTimerKey) return;
      lastTimerKey = key;
      el.timer.innerHTML = icon(fastStill ? "zap" : "clock", { size: 14, fill: fastStill ? "currentColor" : "none" });
      el.timer.append(` ${value}s`);
      el.timer.classList.toggle("is-fast", fastStill);
      el.timer.title = fastStill ? "Tempo para um acerto rápido" : "Tempo até o monstro chegar";
    }

    // ── Answers ─────────────────────────────────────────────────────────
    function eliminate(index) {
      const button = answerButtons[index];
      if (!button) return;
      button.classList.add("is-out");
      button.disabled = true;
      button.setAttribute("aria-label", `${LETTERS[index]} (eliminada): ${button.querySelector(".answer-text").textContent}`);
    }

    function lockAnswers() {
      answerButtons.forEach((b) => (b.disabled = true));
    }

    /** Re-enables every option that has not been eliminated. */
    function enableAnswers() {
      answerButtons.forEach((b) => (b.disabled = b.classList.contains("is-out")));
    }

    /** Post-miss lockout banner over the answers (0 hides it). */
    function setLock(seconds) {
      const locked = seconds > 0;
      el.lock.hidden = !locked;
      el.answers.classList.toggle("is-locked", locked);
      const text = locked ? String(Math.ceil(seconds)) : "";
      if (text !== lastLockText) {
        lastLockText = text;
        el.lockSecs.textContent = text;
      }
    }

    function markRight(index) {
      answerButtons[index]?.classList.add("is-right");
    }

    /** Highlights the correct option behind the Game Over card. */
    function markAnswer(index) {
      answerButtons[index]?.classList.add("is-answer");
    }

    // ── World ───────────────────────────────────────────────────────────
    function setDanger(on) {
      el.world.classList.toggle("is-danger", on);
    }

    // ── Live region ─────────────────────────────────────────────────────
    function announce(text) {
      el.live.textContent = "";
      // A separate task makes screen readers announce repeated messages too.
      setTimeout(() => (el.live.textContent = text), 30);
    }

    // ── Overlays ────────────────────────────────────────────────────────
    function show(key) {
      if (openOverlay && openOverlay !== key) el.overlays[openOverlay].hidden = true;
      if (!openOverlay) lastFocus = document.activeElement;
      openOverlay = key;
      const overlay = el.overlays[key];
      overlay.hidden = false;
      overlay.querySelector(".card").scrollTop = 0;
      el.app.inert = true;
      const target = overlay.querySelector("[data-autofocus]:not([disabled])") || overlay.querySelector("button:not([disabled])");
      target?.focus({ preventScroll: true });
    }

    function hide() {
      if (!openOverlay) return;
      el.overlays[openOverlay].hidden = true;
      openOverlay = null;
      el.app.inert = false;
      if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
      lastFocus = null;
    }

    const isOpen = (key) => openOverlay === key;
    const anyOpen = () => openOverlay !== null;

    /** Fills a "PERGUNTA / RESPOSTA CERTA / POR QUÊ" block. */
    function fillAnswerBlock(prefix, { question, answerText }) {
      $(`${prefix}-q`).textContent = question.q;
      $(`${prefix}-a`).textContent = answerText;
      $(`${prefix}-why`).textContent = question.explanation;
      $(`${prefix}-why-wrap`).hidden = !question.explanation;
    }

    /** "How to play" lines, generated from CONFIG so they never go stale. */
    function rulesFromConfig() {
      const c = config;
      const lines = [
        ["shield", "Monstros estão invadindo a cidade. Cada resposta certa é um tiro: salve a cidade!"],
        ["crosshair", "Monstros vêm pela direita. Toque na alternativa certa (ou tecle 1–6 / A–F) para atirar."],
        ["lock", `Errou? Você fica ${c.WRONG_LOCK_SECONDS}s sem atirar e o monstro fica ${Math.round(c.WRONG_SPEEDUP * 100)}% mais rápido.`],
        ["heart", `Você começa com ${plural(c.START_LIVES, "vida", "vidas")} e pode ter até ${c.MAX_LIVES}.`],
        ["zap", `${c.FAST_NEEDED} acertos de primeira em até ${c.FAST_SECONDS}s = +1 vida (ou +${c.FULL_LIVES_BONUS} pontos com as vidas cheias).`],
        ["gauge", `A cada ${plural(c.QUESTIONS_PER_LEVEL, "acerto", "acertos")} você sobe de nível e os monstros aceleram.`],
        ["snowflake", `Gelo (${c.POWER_FREEZE}× por jogo): prende o monstro numa pedra de gelo por ${c.FREEZE_SECONDS}s. Tecla G.`],
        ["skip-forward", `Pular (${c.POWER_SKIP}× por jogo): troca a pergunta sem perder vida. Tecla P.`],
        ["crosshair", `Caixa misteriosa: aparece de vez em quando ao lado da personagem e troca a arma. Toque nela ou tecle X.`],
        ["trophy", `Chefão: ${c.BOSS_ROUNDS} perguntas; acerte ${c.BOSS_HP} para vencer (+${c.BOSS_BONUS} pontos e +1 vida). Se perder, ele tira uma vida. Sem Gelo nem Pular contra ele.`],
        ["clock", `Questão de leitura longa ganha +${c.LONG_READ_BONUS}s.`],
        ["clock", `A pergunta fecha sozinha após ${c.QUESTION_AUTOCLOSE}s; toque nela (ou tecle Q) para abrir.`],
      ];
      if (c.REVIEW_MISSED) lines.push(["rotate-ccw", "Perguntas que você erra voltam mais vezes."]);
      return lines;
    }

    /** Short summary of a mode's helps and penalties, e.g. "+6s por pergunta · 5 gelos · 3 pulos · erro: 5s, +30%". */
    function modeSummary(mode) {
      const c = modeConfig(mode);
      const extra = c.THINK_SECONDS - baseConfig.THINK_SECONDS;
      const time = extra > 0 ? `+${extra}s por pergunta · ` : "";
      return `${time}${c.POWER_FREEZE} gelos · ${c.POWER_SKIP} pulos · erro: ${c.WRONG_LOCK_SECONDS}s, +${Math.round(c.WRONG_SPEEDUP * 100)}%`;
    }

    document.querySelectorAll("[data-mode-summary]").forEach((slot) => {
      slot.textContent = modeSummary(slot.dataset.modeSummary);
    });

    /** Switches the effective rules (difficulty mode) shown by the UI. */
    function setConfig(next) {
      config = next;
      $("start-rules").replaceChildren(
        ...rulesFromConfig().map(([name, text]) => withIcon("li", "", name, text, { size: 18 }))
      );
    }

    /** "Antes de começar": nothing comes pre-selected; Começar unlocks once both choices are made. */
    function showSetup() {
      document.querySelectorAll('#ov-setup input[type="radio"]').forEach((input) => (input.checked = false));
      updateSetup();
      show("setup");
      document.querySelector('#ov-setup input[name="hero"]').focus({ preventScroll: true });
    }

    /** Enables Começar when a character and a mode are chosen; returns whether both are. */
    function updateSetup() {
      const chosen = (name) => document.querySelector(`#ov-setup input[name="${name}"]:checked`) !== null;
      const ready = chosen("hero") && chosen("mode");
      $("btn-begin").disabled = !ready;
      $("setup-hint").hidden = ready;
      return ready;
    }

    function showStart({ lastGame, best, warnings, canPlay }) {
      setConfig(config);
      $("start-last").textContent = lastGame ? `${lastGame.score} pts` : "—";
      $("start-best").textContent = `${best} pts`;
      const warn = $("start-warn");
      warn.textContent = warnings.join(" ");
      warn.hidden = warnings.length === 0;
      $("btn-play").disabled = !canPlay;
      show("start");
    }

    function showLifeLost({ monster, lives, question, answerText }) {
      $("life-title").textContent = `${monster.icon} ${monster.lossTitle}`;
      const livesEl = $("life-lives");
      livesEl.textContent = "Vidas restantes: ";
      const hearts = h("span", "lives-hearts");
      hearts.innerHTML = Array.from({ length: config.MAX_LIVES }, (_, i) =>
        icon("heart", { size: 20, className: i < lives ? "heart-full" : "heart-empty", fill: i < lives ? "currentColor" : "none" })
      ).join("");
      livesEl.append(hearts);
      fillAnswerBlock("life", { question, answerText });
      show("life");
    }

    function showGameOver(data) {
      const title = $("over-title");
      title.innerHTML = data.newRecord
        ? icon("trophy", { size: 34, className: "icon-trophy", fill: "#fbd51a" })
        : icon("skull", { size: 34 });
      title.append(data.newRecord ? " NOVO RECORDE!" : " GAME OVER");
      title.classList.toggle("is-record", data.newRecord);
      $("over-mode").textContent = `Modo ${modeLabel(data.mode)}`;

      $("over-score").textContent = String(data.score);
      $("over-correct").textContent = String(data.correct);
      $("over-misses").textContent = String(data.misses);
      $("over-accuracy").textContent = `${data.accuracy}%`;
      $("over-level").textContent = String(data.level);
      $("over-streak").textContent = String(data.maxStreak);
      $("over-time").textContent = formatDuration(data.seconds);
      $("over-previous").textContent = data.previous ? `${data.previous.score} pts` : "—";
      $("over-best").textContent = `${data.best} pts`;
      fillAnswerBlock("over", data);
      show("over");
    }

    /** Small icon button for one saved game (handled by main.js through data-export). */
    function exportButton(kind, t, when) {
      const kinds = {
        areas: { icon: "target", text: " Áreas", label: `Ver desempenho por área de ${when}` },
        pdf: { icon: "file-text", text: " PDF", label: `Exportar relatório de ${when} em PDF` },
        md: { icon: "download", text: " .md", label: `Exportar relatório de ${when} em Markdown` },
      };
      const button = h("button", "hist-export");
      button.type = "button";
      button.dataset.export = kind;
      button.dataset.t = String(t);
      button.innerHTML = icon(kinds[kind].icon, { size: 16 });
      button.append(kinds[kind].text);
      button.setAttribute("aria-label", kinds[kind].label);
      return button;
    }

    /** "Desempenho por área" screen: bars per domain/topic, strengths, and weak areas that open on tap. */
    function showAreas(analysis, report) {
      if (openOverlay !== "areas") areasReturnTo = openOverlay;
      const mode = report.modeLabel ? ` · Modo ${report.modeLabel}` : "";
      $("areas-meta").textContent = `${formatDate(report.t)} · ${plural(analysis.total, "pergunta", "perguntas")}${mode}`;
      $("areas-body").replaceChildren(root.AwsCloudQuest.report.buildAreas(analysis, { interactive: true }));
      show("areas");
    }

    /** "Relatório em PDF" card: view (opens the browser's PDF viewer) or download. */
    function showPdf({ url, file, sizeKb }) {
      if (openOverlay !== "pdf") pdfReturnTo = openOverlay;
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      pdfUrl = url;
      $("pdf-meta").textContent = `${file} · ${sizeKb} KB`;
      $("pdf-view").href = url;
      const download = $("pdf-download");
      download.href = url;
      download.download = file;
      show("pdf");
    }

    function closePdf() {
      const back = pdfReturnTo;
      pdfReturnTo = null;
      // Keep the URL alive a moment in case the viewer tab is still loading it.
      const old = pdfUrl;
      pdfUrl = null;
      if (old) setTimeout(() => URL.revokeObjectURL(old), 60000);
      if (back) show(back);
      else hide();
    }

    function closeAreas() {
      const back = areasReturnTo;
      areasReturnTo = null;
      if (back) show(back);
      else hide();
    }

    function showHistory({ history, best, reportTimes = new Set() }) {
      // Re-rendering (after "Apagar") must keep the original screen to go back to.
      if (openOverlay !== "history") historyReturnTo = openOverlay;
      const games = history.length;
      const average = games ? Math.round(history.reduce((s, g) => s + (Number(g.score) || 0), 0) / games) : 0;
      $("hist-games").textContent = String(games);
      $("hist-best").textContent = String(best);
      $("hist-avg").textContent = String(average);

      const items = history.slice(0, config.HISTORY_SHOWN).map((game, i) => {
        const li = h("li", i === 0 ? "hist-item is-latest" : "hist-item");
        const mode = game.mode ? ` · ${modeLabel(game.mode)}` : "";
        const label = `${i === 0 ? "Último · " : ""}${formatDate(game.t)} · ${plural(game.correct, "acerto", "acertos")} · nv ${game.level}${mode}`;
        li.append(h("span", "hist-label", label), h("span", "hist-score", `${game.score} pts`));
        if (reportTimes.has(game.t)) {
          const actions = h("span", "hist-actions");
          const when = formatDate(game.t);
          actions.append(exportButton("areas", game.t, when), exportButton("pdf", game.t, when), exportButton("md", game.t, when));
          li.append(actions);
        }
        return li;
      });
      $("hist-list").replaceChildren(...items);
      $("hist-empty").hidden = games > 0;
      $("btn-history-clear").disabled = games === 0 && best === 0;
      $("hist-confirm").hidden = true;
      $("hist-actions").hidden = false;
      show("history");
    }

    /** Shows or hides the in-card "clear history?" confirmation. */
    function setClearConfirm(open) {
      $("hist-confirm").hidden = !open;
      $("hist-actions").hidden = open;
      $(open ? "btn-clear-cancel" : "btn-history-clear").focus({ preventScroll: true });
    }

    const isClearConfirmOpen = () => !$("hist-confirm").hidden;

    /** Closes history and returns to the overlay that opened it. */
    function closeHistory() {
      $("hist-confirm").hidden = true;
      $("hist-actions").hidden = false;
      const back = historyReturnTo;
      historyReturnTo = null;
      if (back) show(back);
      else hide();
    }

    return Object.freeze({
      el,
      renderHud,
      renderPowers,
      soundHint,
      banner,
      clearBanner,
      setEvent,
      setBox,
      showDeath,
      hideDeath,
      setConfig,
      setMuted,
      renderQuestion,
      setPanelOpen,
      setPanelProgress,
      setTimer,
      eliminate,
      lockAnswers,
      enableAnswers,
      setLock,
      showSetup,
      updateSetup,
      backToStart: () => show("start"),
      /** "Início" on Game Over: reminds the player to download the report first. */
      askLeave: () => show("leave"),
      cancelLeave: () => show("over"),
      markRight,
      markAnswer,
      setDanger,
      announce,
      showStart,
      showLifeLost,
      showGameOver,
      showHistory,
      closeHistory,
      showAreas,
      closeAreas,
      showPdf,
      closePdf,
      setClearConfirm,
      isClearConfirmOpen,
      hide,
      isOpen,
      anyOpen,
    });
  }

  const NS = (root.AwsCloudQuest = root.AwsCloudQuest || {});
  NS.ui = Object.freeze({ create });
})(typeof window !== "undefined" ? window : globalThis);
