/**
 * AWS Cloud Quest — game state machine and main loop.
 *
 * Phases:
 *   idle   → start screen, nothing moves
 *   play   → monster walks, timers run, the player can shoot
 *   dying  → monster hit; next question after NEXT_AFTER_HIT_MS
 *   attack → monster reached the hero; attack animation runs
 *   modal  → "life lost" card (and the hero's respawn blink)
 *   over   → Game Over card; hero stays in its final state
 *
 *   idle → play → dying → play …
 *   play → attack → modal → play
 *   play → attack → over
 *
 * A single requestAnimationFrame loop runs all the time; only `play`
 * advances game time (monster progress, question timers).
 */
(function (root) {
  "use strict";

  const NS = root.AwsCloudQuest;

  /**
   * @param {object} deps
   *   config, questions (normalized list), store, ui, heroEl, monsterEl, fxLayer, field
   */
  function create(deps) {
    const { config, questions, store, ui, field, monsterEl } = deps;
    const Q = NS.questions;
    const R = NS.rules;
    const Monsters = NS.monsters;
    const hero = NS.hero.create(deps.heroEl);
    const fx = NS.effects.create(deps.fxLayer, { reducedMotion });

    const byId = new Map(questions.map((q) => [q.id, q]));
    const timers = new Set();

    const state = {
      phase: "idle",
      lives: config.START_LIVES,
      score: 0,
      streak: 0,
      fast: 0,
      correct: 0,
      level: 1,
      best: store.getBest(),
      stats: store.getStats(),
      deck: [],
      lastId: null,
      current: null,
      panelOpen: true,
      panelLeft: config.QUESTION_AUTOCLOSE,
      shotInFlight: false,
      respawning: false,
    };

    // Field geometry, measured every frame and on resize.
    const geo = { width: 0, height: 0, ground: 0, heroLeft: 0, size: 0, monsterHeight: 0 };

    let lastFrame = null;

    function reducedMotion() {
      return root.matchMedia ? root.matchMedia("(prefers-reduced-motion: reduce)").matches : false;
    }

    /** setTimeout tracked so a restart can cancel everything still pending. */
    function later(fn, ms) {
      const id = setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
    }

    function clearTimers() {
      timers.forEach(clearTimeout);
      timers.clear();
    }

    // ── Geometry & rendering ────────────────────────────────────────────
    function measure() {
      geo.width = field.clientWidth;
      geo.height = field.clientHeight;
      geo.ground = deps.groundHeight();
      geo.heroLeft = Math.max(8, geo.width * 0.035);
      geo.size = Math.min(150, Math.max(96, geo.width * 0.26));
      geo.monsterHeight = geo.size * (100 / 120);
    }

    const heroTop = () => geo.height - geo.ground - hero.HEIGHT;
    const heroRight = () => geo.heroLeft + hero.WIDTH;

    /** Monster left edge for a progress value (0 = off the right edge, 1 = at the hero). */
    function monsterX(progress, monster) {
      const start = geo.width;
      const end = heroRight() - geo.size * 0.1 + monster.stopGap(geo.width);
      return start + (end - start) * progress;
    }

    function placeMonster(x) {
      monsterEl.style.transform = `translate3d(${x}px, 0, 0)`;
    }

    function render() {
      deps.heroEl.style.left = `${geo.heroLeft}px`;
      monsterEl.style.width = `${geo.size}px`;
      monsterEl.style.height = `${geo.monsterHeight}px`;
      const cur = state.current;
      if (cur && (state.phase === "play" || state.phase === "dying")) placeMonster(monsterX(cur.prog, cur.monster));
    }

    function renderHud() {
      ui.renderHud({
        lives: state.lives,
        score: state.score,
        fast: state.fast,
        level: state.level,
        best: Math.max(state.best, state.score),
      });
    }

    // ── Loop ────────────────────────────────────────────────────────────
    function frame(now) {
      const dtMs = lastFrame === null ? 0 : Math.min(now - lastFrame, config.MAX_DT_MS);
      lastFrame = now;
      measure();
      if (state.phase === "play") step(dtMs / 1000);
      render();
      root.requestAnimationFrame(frame);
    }

    function step(dt) {
      const cur = state.current;
      cur.elapsed += dt;
      cur.prog = Math.min(1, cur.prog + dt / cur.travel);

      if (state.panelOpen) {
        state.panelLeft -= dt;
        ui.setPanelProgress(state.panelLeft / config.QUESTION_AUTOCLOSE);
        if (state.panelLeft <= 0) setPanel(false);
      }

      const fastStill = !cur.hadError && cur.elapsed <= config.FAST_SECONDS;
      ui.setTimer(fastStill, fastStill ? config.FAST_SECONDS - cur.elapsed : (1 - cur.prog) * cur.travel);
      ui.setDanger(cur.prog > config.DANGER_AT);

      if (cur.prog >= 1) startAttack();
    }

    // ── Question flow ───────────────────────────────────────────────────
    function nextQuestion(forced = {}) {
      if (state.deck.length === 0) {
        state.deck = Q.buildDeck(questions, config, { stats: state.stats, lastId: state.lastId });
      }
      let id = state.deck.shift();
      if (forced.questionId && byId.has(forced.questionId)) id = forced.questionId;
      const question = byId.get(id);
      state.lastId = id;

      const previous = state.current ? state.current.monster.id : null;
      const monster = (forced.monsterId && Monsters.byId(forced.monsterId)) || Monsters.pick(previous);

      state.current = {
        question,
        shown: Q.shuffledOptions(question),
        eliminated: new Set(),
        hadError: false,
        elapsed: 0,
        prog: 0,
        travel: R.travelSeconds(question, state.level, config),
        monster,
      };

      spawnMonster(monster);
      ui.renderQuestion(question, state.current.shown);
      ui.setDanger(false);
      setPanel(true);
      state.shotInFlight = false;
      state.phase = "play";
    }

    function spawnMonster(monster) {
      monsterEl.className = `monster monster-${monster.id}`;
      monsterEl.style.transition = "";
      monsterEl.innerHTML = `<div class="m-art">${monster.svg}</div>`;
      monsterEl.hidden = false;
      measure();
      placeMonster(monsterX(0, monster));
    }

    function artEl() {
      return monsterEl.querySelector(".m-art");
    }

    function correctIndex(cur) {
      return cur.shown.findIndex((o) => o.correct);
    }

    function recordStat(id, correct) {
      state.stats = Q.recordResult(state.stats, id, correct);
      store.setStats(state.stats);
    }

    function setPanel(open) {
      state.panelOpen = open;
      if (open) state.panelLeft = config.QUESTION_AUTOCLOSE;
      ui.setPanelOpen(open);
      ui.setPanelProgress(open ? 1 : 0);
    }

    // ── Shooting ────────────────────────────────────────────────────────
    function shoot(index) {
      const cur = state.current;
      if (state.phase !== "play" || state.shotInFlight || !cur) return;
      const option = cur.shown[index];
      if (!option || cur.eliminated.has(index)) return;

      state.shotInFlight = true;
      hero.recoil();
      const fromX = geo.heroLeft + hero.MUZZLE.x;
      const fromY = heroTop() + hero.MUZZLE.y - 4;
      const toX = monsterX(cur.prog, cur.monster) + geo.size * 0.3;
      const toY = geo.height - geo.ground - geo.monsterHeight * 0.55;
      fx.shot(fromX, fromY, toX, toY, config.SHOT_MS);

      later(() => {
        state.shotInFlight = false;
        if (state.phase !== "play" || state.current !== cur) return; // monster arrived mid-flight
        if (option.correct) onHit(index);
        else onMiss(index);
      }, config.SHOT_MS);
    }

    function monsterCenter() {
      const cur = state.current;
      return {
        x: monsterX(cur.prog, cur.monster) + geo.size * 0.45,
        y: geo.height - geo.ground - geo.monsterHeight * 0.6,
      };
    }

    function onHit(index) {
      const cur = state.current;
      const fast = R.isFastHit(cur.elapsed, cur.hadError, config);
      const points = R.pointsFor(state.streak, fast, config);
      const previousLevel = state.level;

      state.streak += 1;
      state.correct += 1;
      state.score += points;
      state.level = R.levelFor(state.correct, config);
      if (!cur.hadError) recordStat(cur.question.id, true);

      ui.markRight(index);
      ui.lockAnswers();
      ui.setDanger(false);
      monsterEl.classList.add("is-dying");
      const center = monsterCenter();
      fx.confetti(center.x, center.y, config.CONFETTI_COUNT);
      fx.popText(center.x, center.y - 30, `+${points}`, "pop-points");

      const messages = [`Acertou! +${points} pontos.`];
      if (fast) {
        const result = R.applyFastHit({ lives: state.lives, fast: state.fast }, config);
        state.lives = result.lives;
        state.fast = result.fast;
        if (result.gainedLife) {
          fx.balloon("❤️ Você ganhou uma vida!");
          messages.push("Você ganhou uma vida!");
        } else if (result.bonusPoints) {
          state.score += result.bonusPoints;
          fx.balloon(`⭐ +${result.bonusPoints} pontos (vidas no máximo)`);
          messages.push(`Mais ${result.bonusPoints} pontos de bônus.`);
        }
      }
      if (state.level > previousLevel) messages.push(`Nível ${state.level}!`);

      renderHud();
      ui.announce(messages.join(" "));
      state.phase = "dying";
      later(() => nextQuestion(), config.NEXT_AFTER_HIT_MS);
    }

    function onMiss(index) {
      const cur = state.current;
      cur.eliminated.add(index);
      ui.eliminate(index);
      if (!cur.hadError) {
        cur.hadError = true;
        recordStat(cur.question.id, false);
      }
      state.streak = 0;
      cur.prog = R.pushAfterWrong(cur.prog, config);

      const art = artEl();
      art.classList.remove("is-jolt");
      void art.offsetWidth; // restart the jolt animation
      art.classList.add("is-jolt");
      const center = monsterCenter();
      fx.popText(center.x, center.y - 30, "✖", "pop-miss");
      ui.announce("Errou! O monstro avançou.");
      renderHud();
    }

    // ── Attack, life lost, Game Over ────────────────────────────────────
    function buildAttackContext() {
      const cur = state.current;
      const art = artEl();
      return {
        art,
        hero,
        fx,
        later,
        size: geo.size,
        monsterX: monsterX(cur.prog, cur.monster),
        heroLeft: geo.heroLeft,
        heroWidth: hero.WIDTH,
        heroCenterX: geo.heroLeft + hero.WIDTH / 2,
        heroTop: heroTop(),
        moveTo(x, ms) {
          monsterEl.style.transition = `transform ${ms}ms ease-in`;
          placeMonster(x);
        },
        mouthPoint() {
          const rect = art.getBoundingClientRect();
          const fieldRect = field.getBoundingClientRect();
          return {
            x: rect.left - fieldRect.left + rect.width * cur.monster.mouth.x,
            y: rect.top - fieldRect.top + rect.height * cur.monster.mouth.y,
          };
        },
      };
    }

    function startAttack() {
      const cur = state.current;
      state.phase = "attack";
      if (!cur.hadError) {
        cur.hadError = true;
        recordStat(cur.question.id, false);
      }
      state.streak = 0;
      state.lives -= 1;
      ui.lockAnswers();
      ui.setDanger(false);
      renderHud();

      cur.monster.attack(buildAttackContext());
      ui.announce(cur.monster.lossTitle);
      later(() => (state.lives <= 0 ? gameOver() : lifeLost()), cur.monster.attackMs);
    }

    function lifeLost() {
      const cur = state.current;
      state.phase = "modal";
      ui.showLifeLost({
        monster: cur.monster,
        lives: state.lives,
        question: cur.question,
        answerText: cur.question.options[cur.question.answer],
      });
    }

    /** "Continuar": hero respawns blinking, then the next question comes. */
    function continueAfterLifeLost() {
      if (state.phase !== "modal" || state.respawning) return;
      state.respawning = true;
      ui.hide();
      monsterEl.hidden = true;
      fx.clear();
      hero.reset(config.HERO_BLINK_MS);
      later(() => {
        state.respawning = false;
        nextQuestion();
      }, config.HERO_BLINK_MS);
    }

    function gameOver() {
      const cur = state.current;
      state.phase = "over";

      const previous = store.getHistory()[0] || null;
      const newRecord = state.score > state.best && state.score > 0;
      if (newRecord) store.setBest(state.score);
      store.addHistory({ t: Date.now(), score: state.score, correct: state.correct, level: state.level }, config.HISTORY_LIMIT);
      state.best = Math.max(state.best, state.score);

      ui.markAnswer(correctIndex(cur));
      renderHud();
      ui.showGameOver({
        newRecord,
        score: state.score,
        correct: state.correct,
        previous,
        best: state.best,
        question: cur.question,
        answerText: cur.question.options[cur.question.answer],
      });
    }

    // ── Public actions ──────────────────────────────────────────────────
    /**
     * Starts a new game. `options` exists for automated tests only:
     * { questionId, monsterId } force the first question / monster.
     */
    function start(options = {}) {
      clearTimers();
      fx.clear();
      hero.reset();
      Object.assign(state, {
        lives: config.START_LIVES,
        score: 0,
        streak: 0,
        fast: 0,
        correct: 0,
        level: 1,
        best: store.getBest(),
        stats: store.getStats(),
        deck: [],
        current: null,
        shotInFlight: false,
        respawning: false,
      });
      ui.hide();
      renderHud();
      nextQuestion(options);
    }

    function togglePanel() {
      if (state.current) setPanel(!state.panelOpen);
    }

    /** Enter/Space outside a button: start, continue or restart depending on the phase. */
    function confirm() {
      if (ui.isOpen("start") && deps.canPlay) return start(), true;
      if (ui.isOpen("life")) return continueAfterLifeLost(), true;
      if (ui.isOpen("over")) return start(), true;
      return false;
    }

    function showStartScreen(warnings) {
      state.phase = "idle";
      renderHud();
      ui.showStart({
        lastGame: store.getHistory()[0] || null,
        best: store.getBest(),
        warnings,
        canPlay: deps.canPlay,
      });
    }

    function openHistory() {
      ui.showHistory({ history: store.getHistory(), best: store.getBest() });
    }

    function clearHistory() {
      store.clearHistory();
      state.best = 0;
      renderHud();
      openHistory();
    }

    function boot(warnings) {
      measure();
      monsterEl.hidden = true;
      showStartScreen(warnings);
      root.requestAnimationFrame(frame);
      // The loop's dt cap already avoids jumps; resetting the clock also
      // keeps the first frame after returning from a hidden tab at dt = 0.
      document.addEventListener("visibilitychange", () => {
        lastFrame = null;
      });
      root.addEventListener("resize", measure);
    }

    return Object.freeze({
      boot,
      start,
      shoot,
      togglePanel,
      confirm,
      continueAfterLifeLost,
      openHistory,
      clearHistory,
      /** Read-only snapshot for tests and debugging. */
      snapshot: () => ({
        phase: state.phase,
        lives: state.lives,
        score: state.score,
        fast: state.fast,
        level: state.level,
        correct: state.correct,
        questionId: state.current ? state.current.question.id : null,
        monsterId: state.current ? state.current.monster.id : null,
        progress: state.current ? state.current.prog : 0,
        travel: state.current ? state.current.travel : 0,
        panelOpen: state.panelOpen,
      }),
    });
  }

  NS.game = Object.freeze({ create });
})(typeof window !== "undefined" ? window : globalThis);
