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

  function create(config) {
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
      lock: $("answers-lock"),
      lockSecs: $("lock-secs"),
      live: $("live"),
      overlays: {
        start: $("ov-start"),
        life: $("ov-life"),
        over: $("ov-over"),
        history: $("ov-history"),
      },
    };

    let answerButtons = [];
    let openOverlay = null;     // key of the overlay currently shown
    let historyReturnTo = null; // overlay to go back to when history closes
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
    function renderPowers(powers, { playing, frozen }) {
      const freezeButton = $("btn-freeze");
      const skipButton = $("btn-skip");
      $("freeze-count").textContent = String(powers.freeze);
      $("skip-count").textContent = String(powers.skip);
      freezeButton.disabled = !playing || frozen || powers.freeze <= 0;
      skipButton.disabled = !playing || powers.skip <= 0;
      freezeButton.classList.toggle("is-active", frozen);
      freezeButton.setAttribute(
        "aria-label",
        `Gelo: congela o monstro por ${config.FREEZE_SECONDS} segundos. Restam ${powers.freeze}. Tecla G.`
      );
      skipButton.setAttribute("aria-label", `Pular a pergunta sem perder vida. Restam ${powers.skip}. Tecla P.`);
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
    }

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
        ["crosshair", "Monstros vêm pela direita. Toque na alternativa certa (ou tecle 1–6 / A–F) para atirar."],
        ["lock", `Errou? Você fica ${c.WRONG_LOCK_SECONDS}s sem atirar e o monstro fica ${Math.round(c.WRONG_SPEEDUP * 100)}% mais rápido.`],
        ["heart", `Você começa com ${plural(c.START_LIVES, "vida", "vidas")} e pode ter até ${c.MAX_LIVES}.`],
        ["zap", `${c.FAST_NEEDED} acertos de primeira em até ${c.FAST_SECONDS}s = +1 vida (ou +${c.FULL_LIVES_BONUS} pontos com as vidas cheias).`],
        ["gauge", `A cada ${plural(c.QUESTIONS_PER_LEVEL, "acerto", "acertos")} você sobe de nível e os monstros aceleram.`],
        ["snowflake", `Gelo (${c.POWER_FREEZE}× por jogo): prende o monstro numa pedra de gelo por ${c.FREEZE_SECONDS}s. Tecla G.`],
        ["skip-forward", `Pular (${c.POWER_SKIP}× por jogo): troca a pergunta sem perder vida. Tecla P.`],
        ["clock", `A pergunta fecha sozinha após ${c.QUESTION_AUTOCLOSE}s; toque nela (ou tecle Q) para abrir.`],
      ];
      if (c.REVIEW_MISSED) lines.push(["rotate-ccw", "Perguntas que você erra voltam mais vezes."]);
      return lines;
    }

    /** Marks the chosen character and enables Play once there is one. */
    function setHeroChoice(hero, canPlay) {
      document.querySelectorAll('input[name="hero"]').forEach((input) => (input.checked = input.value === hero));
      $("btn-play").disabled = !canPlay || !hero;
      $("pick-hint").hidden = Boolean(hero);
    }

    function showStart({ lastGame, best, warnings, canPlay, hero }) {
      $("start-rules").replaceChildren(
        ...rulesFromConfig().map(([name, text]) => withIcon("li", "", name, text, { size: 18 }))
      );
      $("start-last").textContent = lastGame ? `${lastGame.score} pts` : "—";
      $("start-best").textContent = `${best} pts`;
      const warn = $("start-warn");
      warn.textContent = warnings.join(" ");
      warn.hidden = warnings.length === 0;
      setHeroChoice(hero, canPlay);
      show("start");
      if (!hero) document.querySelector('input[name="hero"]')?.focus({ preventScroll: true });
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

    /** Small icon button that exports one game's report (handled by main.js through data-export). */
    function exportButton(kind, t, when) {
      const button = h("button", "hist-export");
      button.type = "button";
      button.dataset.export = kind;
      button.dataset.t = String(t);
      button.innerHTML = icon(kind === "pdf" ? "file-text" : "download", { size: 16 });
      button.append(kind === "pdf" ? " PDF" : " .md");
      button.setAttribute("aria-label", `Exportar relatório de ${when} em ${kind === "pdf" ? "PDF" : "Markdown"}`);
      return button;
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
        const label = `${i === 0 ? "Último · " : ""}${formatDate(game.t)} · ${plural(game.correct, "acerto", "acertos")} · nv ${game.level}`;
        li.append(h("span", "hist-label", label), h("span", "hist-score", `${game.score} pts`));
        if (reportTimes.has(game.t)) {
          const actions = h("span", "hist-actions");
          actions.append(exportButton("pdf", game.t, formatDate(game.t)), exportButton("md", game.t, formatDate(game.t)));
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
      setMuted,
      renderQuestion,
      setPanelOpen,
      setPanelProgress,
      setTimer,
      eliminate,
      lockAnswers,
      enableAnswers,
      setLock,
      setHeroChoice,
      markRight,
      markAnswer,
      setDanger,
      announce,
      showStart,
      showLifeLost,
      showGameOver,
      showHistory,
      closeHistory,
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
