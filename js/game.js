/**
 * AWS Cloud Quest — game state machine and main loop.
 *
 * Phases:
 *   idle   → start screen, nothing moves
 *   play   → monster walks, timers run, the player can shoot (except during
 *            the WRONG_LOCK_SECONDS lockout that follows a miss)
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
    const { config, questions, store, ui, field, monsterEl, sound, ambient } = deps;
    const Q = NS.questions;
    const R = NS.rules;
    const Monsters = NS.monsters;
    const hero = NS.hero.create(deps.heroEl, store.getHero() || NS.hero.DEFAULT_VARIANT);
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
      // Per-game numbers for the Game Over summary.
      misses: 0,
      maxStreak: 0,
      playTime: 0,
      powers: { freeze: config.POWER_FREEZE, skip: config.POWER_SKIP },
      log: [],          // one entry per question shown (for the end-of-game report)
      lastReport: null, // data of the last finished game
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
    /**
     * Height for callouts (balloons, penalty sign). Anchored to the ground,
     * just above the hero's head, so the floating question balloon (which
     * covers the top of the field) never hides them.
     */
    const calloutY = () => Math.max(8, geo.height - geo.ground - hero.HEIGHT - 52);
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
        isRecord: state.score > state.best && state.score > 0,
      });
    }

    // ── Loop ────────────────────────────────────────────────────────────
    function frame(now) {
      const dtMs = lastFrame === null ? 0 : Math.min(now - lastFrame, config.MAX_DT_MS);
      lastFrame = now;
      measure();
      ambient.update(dtMs / 1000);
      if (state.phase === "play") step(dtMs / 1000);
      render();
      root.requestAnimationFrame(frame);
    }

    function step(dt) {
      const cur = state.current;
      cur.elapsed += dt;
      state.playTime += dt;
      if (cur.frozenLeft > 0) {
        // Frozen in ice: the monster does not move.
        cur.frozenLeft = Math.max(0, cur.frozenLeft - dt);
        updateIceTimer(cur.frozenLeft);
        if (cur.frozenLeft === 0) thaw();
      } else {
        cur.prog = Math.min(1, cur.prog + (dt * cur.speed) / cur.travel);
      }
      sound.setIntensity(cur.frozenLeft > 0 ? 0 : cur.prog);

      if (cur.lockLeft > 0) {
        cur.lockLeft = Math.max(0, cur.lockLeft - dt);
        ui.setLock(cur.lockLeft);
        if (cur.lockLeft === 0) {
          ui.enableAnswers();
          sound.play("unlock");
          ui.announce("Pode atirar de novo.");
        }
      }

      if (state.panelOpen) {
        state.panelLeft -= dt;
        ui.setPanelProgress(state.panelLeft / config.QUESTION_AUTOCLOSE);
        if (state.panelLeft <= 0) setPanel(false);
      }

      const fastStill = !cur.hadError && cur.elapsed <= config.FAST_SECONDS;
      ui.setTimer(fastStill, fastStill ? config.FAST_SECONDS - cur.elapsed : R.secondsLeft(cur.prog, cur.travel, cur.speed));
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
        speed: 1,      // multiplier; each miss makes this monster faster
        lockLeft: 0,   // seconds left in the post-miss lockout
        frozenLeft: 0, // seconds left frozen in ice (power-up)
        wrongPicks: [], // texts of the wrong options shot (for the report)
        monster,
      };

      spawnMonster(monster);
      ui.setLock(0);
      ui.renderQuestion(question, state.current.shown);
      ui.setDanger(false);
      setPanel(true);
      state.shotInFlight = false;
      state.phase = "play";
      syncPowers();
    }

    /** Closes the current question in the report log: "first" | "late" | "lost" | "skipped". */
    function logOutcome(outcome) {
      const cur = state.current;
      const q = cur.question;
      state.log.push({
        id: q.id,
        q: q.q,
        topic: q.topic,
        answer: q.options[q.answer],
        explanation: q.explanation,
        wrongPicks: cur.wrongPicks.slice(),
        outcome,
        seconds: Math.round(cur.elapsed),
      });
    }

    // ── Power-ups ───────────────────────────────────────────────────────
    function syncPowers() {
      const cur = state.current;
      ui.renderPowers(state.powers, {
        playing: state.phase === "play",
        frozen: Boolean(cur && cur.frozenLeft > 0),
      });
    }

    function updateIceTimer(seconds) {
      const label = monsterEl.querySelector(".m-ice-time");
      if (label) label.textContent = `${Math.ceil(seconds)}s`;
    }

    /** "Gelo": traps the monster in an ice cube for FREEZE_SECONDS. */
    function freeze() {
      const cur = state.current;
      if (state.phase !== "play" || !cur || cur.frozenLeft > 0 || state.powers.freeze <= 0) return;
      state.powers.freeze -= 1;
      cur.frozenLeft = config.FREEZE_SECONDS;

      const ice = document.createElement("div");
      ice.className = "m-ice";
      ice.innerHTML = '<span class="m-ice-time"></span>';
      monsterEl.appendChild(ice);
      monsterEl.classList.add("is-frozen");
      updateIceTimer(cur.frozenLeft);

      ui.setDanger(false);
      sound.play("freeze");
      ui.announce(`Monstro congelado por ${config.FREEZE_SECONDS} segundos.`);
      syncPowers();
    }

    function thaw() {
      monsterEl.classList.remove("is-frozen");
      const ice = monsterEl.querySelector(".m-ice");
      if (ice) {
        ice.classList.add("is-cracking");
        later(() => ice.remove(), 400);
      }
      sound.play("thaw");
      ui.announce("O gelo quebrou! O monstro voltou a andar.");
      syncPowers();
    }

    /** "Pular": swaps the question. No life lost, no score, streak and stats untouched. */
    function skip() {
      const cur = state.current;
      if (state.phase !== "play" || !cur || state.shotInFlight || state.powers.skip <= 0) return;
      state.powers.skip -= 1;
      logOutcome("skipped");
      state.phase = "dying";
      cur.lockLeft = 0;
      ui.setLock(0);
      ui.lockAnswers();
      ui.setDanger(false);
      monsterEl.classList.add("is-skipped");
      const center = monsterCenter();
      fx.popText(center.x, center.y - 30, "PULOU!", "pop-skip");
      sound.play("skip");
      ui.announce("Pergunta pulada.");
      syncPowers();
      later(() => nextQuestion(), config.NEXT_AFTER_HIT_MS);
    }

    function spawnMonster(monster) {
      monsterEl.className = `monster monster-${monster.id}`;
      monsterEl.style.transition = "";
      monsterEl.innerHTML = `<div class="m-art">${monster.svg}</div><span class="m-speed" hidden></span>`;
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
      if (state.phase !== "play" || state.shotInFlight || !cur || cur.lockLeft > 0) return;
      const option = cur.shown[index];
      if (!option || cur.eliminated.has(index)) return;

      state.shotInFlight = true;
      hero.recoil();
      sound.play("shoot");
      const fromX = geo.heroLeft + hero.MUZZLE.x;
      const fromY = heroTop() + hero.MUZZLE.y - 4;
      fx.muzzle(fromX, fromY + 4);
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
      state.maxStreak = Math.max(state.maxStreak, state.streak);
      state.correct += 1;
      state.score += points;
      logOutcome(cur.hadError ? "late" : "first");
      sound.play("hit");
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
          fx.balloon("Você ganhou uma vida!", calloutY(), "heart");
          sound.play("life");
          messages.push("Você ganhou uma vida!");
        } else if (result.bonusPoints) {
          state.score += result.bonusPoints;
          fx.balloon(`+${result.bonusPoints} pontos (vidas no máximo)`, calloutY(), "star");
          sound.play("bonus");
          messages.push(`Mais ${result.bonusPoints} pontos de bônus.`);
        }
      }
      if (state.level > previousLevel) {
        messages.push(`Nível ${state.level}!`);
        sound.play("levelUp");
      }

      renderHud();
      ui.announce(messages.join(" "));
      state.phase = "dying";
      syncPowers();
      later(() => nextQuestion(), config.NEXT_AFTER_HIT_MS);
    }

    function onMiss(index) {
      const cur = state.current;
      cur.eliminated.add(index);
      cur.wrongPicks.push(cur.shown[index].text);
      ui.eliminate(index);
      if (!cur.hadError) {
        cur.hadError = true;
        recordStat(cur.question.id, false);
      }
      state.streak = 0;
      state.misses += 1;
      sound.play("miss");

      // Penalty: lockout + a faster monster for the rest of this question.
      cur.speed = R.speedAfterWrong(cur.speed, config);
      cur.lockLeft = config.WRONG_LOCK_SECONDS;
      ui.lockAnswers();
      ui.setLock(cur.lockLeft);

      const percent = Math.round(cur.speed * 100);
      const boost = Math.round(config.WRONG_SPEEDUP * 100);
      monsterEl.classList.add("is-enraged");
      const badge = monsterEl.querySelector(".m-speed");
      badge.textContent = `▲ ${percent}%`;
      badge.hidden = false;

      const art = artEl();
      art.classList.remove("is-jolt");
      field.classList.remove("is-shaking");
      void art.offsetWidth; // restart the jolt and shake animations
      art.classList.add("is-jolt");
      field.classList.add("is-shaking");

      fx.penalty(geo.width / 2, calloutY() + 30, `VELOCIDADE +${boost}%`);
      ui.announce(
        `Errou! O monstro ficou ${boost}% mais rápido. Aguarde ${config.WRONG_LOCK_SECONDS} segundos para atirar de novo.`
      );
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
        shake() {
          field.classList.remove("is-shaking");
          void field.offsetWidth; // restart the animation
          field.classList.add("is-shaking");
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
      logOutcome("lost");
      cur.lockLeft = 0;
      ui.setLock(0);
      ui.lockAnswers();
      ui.setDanger(false);
      renderHud();

      syncPowers();
      cur.monster.attack(buildAttackContext());
      sound.play("attack", cur.monster.id);
      sound.setIntensity(0);
      ui.announce(cur.monster.lossTitle);
      later(() => (state.lives <= 0 ? gameOver() : lifeLost()), cur.monster.attackMs);
    }

    function lifeLost() {
      const cur = state.current;
      state.phase = "modal";
      sound.play("lifeLost");
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

      // One timestamp links the history row to its saved report (exported from the history screen).
      const t = Date.now();
      const shots = state.correct + state.misses;
      const report = {
        t,
        hero: deps.heroEl.dataset.variant,
        score: state.score,
        correct: state.correct,
        misses: state.misses,
        accuracy: shots ? Math.round((state.correct / shots) * 100) : 0,
        level: state.level,
        maxStreak: state.maxStreak,
        seconds: Math.round(state.playTime),
        log: state.log.slice(),
      };
      store.addHistory({ t, score: state.score, correct: state.correct, level: state.level }, config.HISTORY_LIMIT);
      store.addReport(report, config.REPORTS_LIMIT);
      state.lastReport = report;
      state.best = Math.max(state.best, state.score);

      sound.stopMusic();
      sound.play(newRecord ? "record" : "gameOver");

      ui.markAnswer(correctIndex(cur));
      renderHud();
      ui.showGameOver({
        ...report,
        newRecord,
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
        misses: 0,
        maxStreak: 0,
        playTime: 0,
        powers: { freeze: config.POWER_FREEZE, skip: config.POWER_SKIP },
        log: [],
      });
      ui.hide();
      renderHud();
      sound.stopMusic();
      sound.startMusic();
      nextQuestion(options);
    }

    function togglePanel() {
      if (state.current) setPanel(!state.panelOpen);
    }

    /** Switches the playable character ("male" | "female") and remembers it. */
    function setHero(variant) {
      store.setHero(variant);
      hero.setVariant(variant);
    }

    /** Enter/Space outside a button: start, continue or restart depending on the phase. */
    function confirm() {
      if (ui.isOpen("start")) {
        if (deps.canPlay && store.getHero()) start();
        return true;
      }
      if (ui.isOpen("life")) return continueAfterLifeLost(), true;
      if (ui.isOpen("over")) return start(), true;
      return false;
    }

    function showStartScreen(warnings) {
      state.phase = "idle";
      renderHud();
      syncPowers();
      ui.showStart({
        lastGame: store.getHistory()[0] || null,
        best: store.getBest(),
        warnings,
        canPlay: deps.canPlay,
        hero: store.getHero(),
      });
    }

    function openHistory() {
      const reports = store.getReports();
      ui.showHistory({
        history: store.getHistory(),
        best: store.getBest(),
        reportTimes: new Set(reports.map((r) => r.t)),
      });
    }

    /** Saved report of the game finished at time `t`, or null. */
    function reportAt(t) {
      return store.getReports().find((r) => r.t === t) || null;
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
      freeze,
      skip,
      setHero,
      confirm,
      /** Data of the last finished game, for the report (null before the first Game Over). */
      lastReport: () => state.lastReport,
      reportAt,
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
        speed: state.current ? state.current.speed : 1,
        lockLeft: state.current ? state.current.lockLeft : 0,
        frozenLeft: state.current ? state.current.frozenLeft : 0,
        powers: { ...state.powers },
        hero: deps.heroEl.dataset.variant,
        misses: state.misses,
        ambient: ambient.snapshot(),
        muted: sound.isMuted(),
        panelOpen: state.panelOpen,
      }),
    });
  }

  NS.game = Object.freeze({ create });
})(typeof window !== "undefined" ? window : globalThis);
