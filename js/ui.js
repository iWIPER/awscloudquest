/**
 * AWS Cloud Quest — DOM rendering: HUD, question panel, answers, overlays.
 *
 * The UI never decides game rules; game.js calls these functions with the
 * data to show. All user-facing text is Portuguese (pt-BR) and is written
 * with textContent (never innerHTML) because it comes from the question bank.
 */
(function (root) {
  "use strict";

  const LETTERS = "ABCDEF";
  const $ = (id) => document.getElementById(id);

  /** Creates a DOM element with optional class and text. */
  function h(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  const formatDate = (t) => {
    const d = new Date(t);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  function create(config) {
    const el = {
      app: $("app"),
      lives: $("hud-lives"),
      score: $("hud-score"),
      fast: $("hud-fast"),
      level: $("hud-level"),
      best: $("hud-best"),
      panel: $("qpanel"),
      panelToggle: $("qpanel-toggle"),
      panelArrow: $("qpanel-arrow"),
      panelBar: $("qpanel-bar"),
      topic: $("q-topic"),
      timer: $("q-timer"),
      text: $("q-text"),
      answers: $("answers"),
      field: $("field"),
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
    let lastTimerText = "";

    // ── HUD ─────────────────────────────────────────────────────────────
    function renderHud({ lives, score, fast, level, best }) {
      el.lives.textContent = "❤️".repeat(lives) + "🤍".repeat(Math.max(0, config.MAX_LIVES - lives));
      el.lives.setAttribute("aria-label", `Vidas: ${lives} de ${config.MAX_LIVES}`);
      el.score.textContent = String(score);
      el.fast.replaceChildren(
        ...Array.from({ length: config.FAST_NEEDED }, (_, i) => h("span", i < fast ? "dot is-on" : "dot"))
      );
      el.fast.setAttribute("aria-label", `Acertos rápidos: ${fast} de ${config.FAST_NEEDED}`);
      el.level.textContent = String(level);
      el.best.textContent = String(best);
    }

    // ── Question panel ──────────────────────────────────────────────────
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
      el.panelArrow.textContent = open ? "▲ Fechar" : "▼ Abrir";
    }

    /** Auto-close bar: 1 = full, 0 = empty. */
    function setPanelProgress(fraction) {
      el.panelBar.style.transform = `scaleX(${Math.max(0, Math.min(1, fraction))})`;
    }

    /** Timer chip: ⚡ countdown while a fast hit is possible, then ⏱ until the monster arrives. */
    function setTimer(fastStill, seconds) {
      const text = `${fastStill ? "⚡" : "⏱"} ${Math.max(0, Math.ceil(seconds))}s`;
      if (text === lastTimerText) return;
      lastTimerText = text;
      el.timer.textContent = text;
      el.timer.classList.toggle("is-fast", fastStill);
      el.timer.title = fastStill ? "Tempo para um acerto rápido" : "Tempo até o monstro chegar";
    }

    // ── Answers ─────────────────────────────────────────────────────────
    function eliminate(index) {
      const button = answerButtons[index];
      if (!button) return;
      button.classList.add("is-out");
      button.disabled = true;
      button.setAttribute("aria-label", `${LETTERS[index]} (eliminada): ${button.textContent.slice(1)}`);
    }

    function lockAnswers() {
      answerButtons.forEach((b) => (b.disabled = true));
    }

    function markRight(index) {
      answerButtons[index]?.classList.add("is-right");
    }

    /** Highlights the correct option behind the Game Over card. */
    function markAnswer(index) {
      answerButtons[index]?.classList.add("is-answer");
    }

    function clearAnswers() {
      answerButtons = [];
      el.answers.replaceChildren();
    }

    // ── Field ───────────────────────────────────────────────────────────
    function setDanger(on) {
      el.field.classList.toggle("is-danger", on);
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
      el.overlays[key].hidden = false;
      el.app.inert = true;
      const focusTarget = el.overlays[key].querySelector("[data-autofocus]:not([disabled])") || el.overlays[key].querySelector("button:not([disabled])");
      focusTarget?.focus();
    }

    function hide() {
      if (!openOverlay) return;
      el.overlays[openOverlay].hidden = true;
      openOverlay = null;
      el.app.inert = false;
      if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
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

    function rulesFromConfig() {
      const c = config;
      const lines = [
        "Monstros vêm pela direita. Toque na alternativa certa (ou tecle 1–6 / A–F) para atirar.",
        `Errou? A alternativa trava e o monstro avança ${Math.round(c.WRONG_PUSH * 100)}% do caminho.`,
        `Você começa com ${plural(c.START_LIVES, "vida", "vidas")} e pode ter até ${c.MAX_LIVES}.`,
        `Acerte de primeira em até ${c.FAST_SECONDS}s: ${c.FAST_NEEDED} acertos rápidos = +1 vida ` +
          `(ou +${c.FULL_LIVES_BONUS} pontos com as vidas no máximo).`,
        `A cada ${plural(c.QUESTIONS_PER_LEVEL, "acerto", "acertos")} você sobe de nível e os monstros ficam mais rápidos.`,
        `A pergunta fecha sozinha após ${c.QUESTION_AUTOCLOSE}s; toque nela (ou tecle Q) para abrir de novo.`,
      ];
      if (c.REVIEW_MISSED) lines.push("Perguntas que você erra voltam mais vezes.");
      return lines;
    }

    function showStart({ lastGame, best, warnings, canPlay }) {
      $("start-rules").replaceChildren(...rulesFromConfig().map((line) => h("li", "", line)));
      $("start-meta").textContent = lastGame
        ? `Último jogo: ${lastGame.score} pts · Recorde: ${best}`
        : `Recorde: ${best}`;
      const warn = $("start-warn");
      warn.textContent = warnings.join(" ");
      warn.hidden = warnings.length === 0;
      $("btn-play").disabled = !canPlay;
      show("start");
    }

    function showLifeLost({ monster, lives, question, answerText }) {
      $("life-title").textContent = `${monster.icon} ${monster.lossTitle}`;
      $("life-lives").textContent =
        `Vidas restantes: ${"❤️".repeat(lives)}${"🤍".repeat(Math.max(0, config.MAX_LIVES - lives))}`;
      fillAnswerBlock("life", { question, answerText });
      show("life");
    }

    function showGameOver({ newRecord, score, correct, previous, best, question, answerText }) {
      $("over-title").textContent = newRecord ? "🏆 NOVO RECORDE!" : "💥 GAME OVER";
      $("over-score").textContent = `${score} pts · ${plural(correct, "acerto", "acertos")}`;
      $("over-meta").textContent = `Jogo anterior: ${previous ? `${previous.score} pts` : "—"} · Recorde: ${best}`;
      fillAnswerBlock("over", { question, answerText });
      show("over");
    }

    function showHistory({ history, best }) {
      historyReturnTo = openOverlay;
      const games = history.length;
      const average = games ? Math.round(history.reduce((s, g) => s + (Number(g.score) || 0), 0) / games) : 0;
      $("hist-games").textContent = String(games);
      $("hist-best").textContent = String(best);
      $("hist-avg").textContent = String(average);

      const items = history.slice(0, config.HISTORY_SHOWN).map((game, i) => {
        const li = h("li", i === 0 ? "hist-item is-latest" : "hist-item");
        const label = `${i === 0 ? "Último · " : ""}${formatDate(game.t)} · ${plural(game.correct, "acerto", "acertos")} · nv ${game.level}`;
        li.append(h("span", "hist-label", label), h("span", "hist-score", `${game.score} pts`));
        return li;
      });
      $("hist-list").replaceChildren(...items);
      $("hist-empty").hidden = games > 0;
      $("btn-history-clear").disabled = games === 0 && best === 0;
      show("history");
    }

    /** Closes history and returns to the overlay that opened it. */
    function closeHistory() {
      const back = historyReturnTo;
      historyReturnTo = null;
      if (back) show(back);
      else hide();
    }

    return Object.freeze({
      el,
      renderHud,
      renderQuestion,
      setPanelOpen,
      setPanelProgress,
      setTimer,
      eliminate,
      lockAnswers,
      markRight,
      markAnswer,
      clearAnswers,
      setDanger,
      announce,
      showStart,
      showLifeLost,
      showGameOver,
      showHistory,
      closeHistory,
      hide,
      isOpen,
      anyOpen,
    });
  }

  const NS = (root.AwsCloudQuest = root.AwsCloudQuest || {});
  NS.ui = Object.freeze({ create });
})(typeof window !== "undefined" ? window : globalThis);
