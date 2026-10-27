/**
 * AWS Cloud Quest — game state machine and main loop.
 *
 * Phases:
 *   idle   → start screen, nothing moves
 *   event  → a scripted moment with no question on screen: the "READY? GO!"
 *            intro, the boss announcement or the cheering visitor
 *   play   → monster walks, timers run, the player can shoot (except during
 *            the WRONG_LOCK_SECONDS lockout that follows a miss)
 *   dying  → monster hit (or question skipped); next step after NEXT_AFTER_HIT_MS
 *   attack → monster reached the hero; attack animation runs
 *            (in a boss round: the boss throws a rock, no life is lost)
 *   modal  → "life lost" card (and the hero's respawn blink)
 *   dead   → dark "GAME OVER" screen
 *   over   → Game Over card; hero stays in its final state
 *
 *   idle → event → play → dying → (event →) play …
 *   play → attack → modal → play
 *   play → attack → dead → over
 *
 * After every question, questionDone() decides what comes next, in this order:
 * boss fight, cheering visitor, next question (with a scenery change when due).
 *
 * A single requestAnimationFrame loop runs all the time; only `play`
 * advances game time (monster progress, question timers).
 */
(function (root) {
  "use strict";

  const NS = root.AwsCloudQuest;

  /**
   * @param {object} deps
   *   config, questions (normalized list), store, ui, sound, ambient, visitor,
   *   field, heroEl, monsterEl, fxLayer, groundHeight(), canPlay
   */
  function create(deps) {
    const { questions, store, ui, field, monsterEl, sound, ambient, visitor } = deps;
    const Q = NS.questions;
    const R = NS.rules;
    // Effective rules for the chosen difficulty mode (base CONFIG + mode overrides).
    let config = R.configFor(deps.config, store.getMode() || deps.config.DEFAULT_MODE);
    const Monsters = NS.monsters;
    const SCENES = NS.ambient.SCENES;
    const WEAPONS = NS.hero.WEAPONS;
    const hero = NS.hero.create(deps.heroEl, store.getHero() || NS.hero.DEFAULT_VARIANT);
    const fx = NS.effects.create(deps.fxLayer, { reducedMotion });

    const byId = new Map(questions.map((q) => [q.id, q]));
    const timers = new Set();

    /** Values reset at the start of every game. */
    const freshGame = () => ({
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
      finished: 0, // questions finished (hit, lost or skipped)
      boxAt: R.nextBoxAt(0, config),
      boxReady: false,
      cheers: R.cheerMilestones(config),
      boss: null, // { hp, hits, round, pos } during a boss fight
      scene: SCENES[0].id,
      gameOverData: null,
    });

    const state = {
      phase: "idle",
      lastId: null,
      panelOpen: true,
      panelLeft: config.QUESTION_AUTOCLOSE,
      lastReport: null, // data of the last finished game
      ...freshGame(),
    };

    // Field geometry, measured every frame and on resize.
    const geo = { width: 0, height: 0, ground: 0, heroLeft: 0, size: 0, monsterHeight: 0 };

    let lastFrame = null;
    const pick = (list) => list[Math.floor(Math.random() * list.length)];
    const HERO_LINES = ["Eu vou salvar todo mundo!", "Pode deixar, eu protejo a cidade!", "Ninguém vai machucar essa cidade!"];
    const BOSS_THREATS = ["Eu vou acabar com você!", "Grrr! Agora você me irritou!", "Isso não vai ficar assim!"];
    /** Which roar a boss uses: the robot has its own, the others roar by species. */
    const bossVoice = (boss) => (boss.kind === "robot" ? "robot" : boss.species);
    const BOSS_TAUNTS = ["Toma essa!", "Hahaha! Errou!", "Mais uma pedra pra você!"];
    let bootWarnings = [];
    let lastBossKind = null; // the next boss fight shows a different look
    let soundHintShown = false; // the sound-button hint appears once per visit

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

    // The loop re-measures only after a resize: reading the layout every frame costs time.
    let sizeChanged = true;
    if (root.ResizeObserver) {
      const observer = new root.ResizeObserver(() => (sizeChanged = true));
      observer.observe(field);
      const ground = field.querySelector(".ground");
      if (ground) observer.observe(ground);
    }

    // Style writes from the loop happen only when the value changes (no work on still frames).
    const written = new Map();
    function setStyle(el, prop, value) {
      const key = `${el.id}:${prop}`;
      if (written.get(key) === value) return;
      written.set(key, value);
      if (prop.startsWith("--")) el.style.setProperty(prop, value);
      else el.style[prop] = value;
    }

    const heroTop = () => geo.height - geo.ground - hero.HEIGHT;
    /**
     * Height for callouts (balloons, penalty sign). Anchored to the ground,
     * just above the hero's head, so the floating question balloon (which
     * covers the top of the field) never hides them.
     */
    const calloutY = () => Math.max(8, geo.height - geo.ground - hero.HEIGHT - 52);
    const heroRight = () => geo.heroLeft + hero.WIDTH;
    const scaleOf = (monster) => monster.scale || 1;

    /** Monster left edge for a progress value (0 = off the right edge, 1 = at the hero). */
    function monsterX(progress, monster) {
      const start = geo.width;
      const end = heroRight() - geo.size * 0.1 + monster.stopGap(geo.width);
      return start + (end - start) * progress;
    }

    /** Boss left edge for its position (0 = right edge, fully visible; BOSS_LIMIT = closest it gets). */
    function bossX(pos) {
      const width = geo.size * Monsters.boss.scale;
      const far = geo.width - width - 6;
      const near = heroRight() + 24;
      return far + (near - far) * pos;
    }

    const currentX = () => {
      const cur = state.current;
      return cur.isBoss ? bossX(state.boss ? state.boss.pos : config.BOSS_LIMIT) : monsterX(cur.prog, cur.monster);
    };

    function placeMonster(x) {
      setStyle(monsterEl, "transform", `translate3d(${x}px, 0, 0)`);
    }

    function render() {
      setStyle(deps.heroEl, "left", `${geo.heroLeft}px`);
      const cur = state.current;
      const scale = cur ? scaleOf(cur.monster) : 1;
      setStyle(monsterEl, "width", `${geo.size * scale}px`);
      setStyle(monsterEl, "height", `${geo.monsterHeight * scale}px`);
      // Flying monsters hover this many px above the ground (art, speed badge, speed lines, ice).
      const lift = cur && cur.monster.lift ? cur.monster.lift * geo.monsterHeight * scale : 0;
      setStyle(monsterEl, "--lift-px", `${-lift}px`);
      const live = cur && (state.phase === "play" || state.phase === "dying");
      setStyle(deps.heroEl, "--aim", `${live ? aimAngle(cur) : 0}deg`);
      if (live) placeMonster(currentX());
    }

    const heroShoulder = () => ({ x: geo.heroLeft + NS.hero.SHOULDER.x, y: heroTop() + NS.hero.SHOULDER.y });

    /** Degrees the weapon arm turns to aim at the monster: up for flying ones (negative), level otherwise. */
    function aimAngle(cur) {
      if (!cur.monster.flying) return 0;
      const target = monsterCenter();
      const shoulder = heroShoulder();
      const degrees = (Math.atan2(target.y - shoulder.y, target.x - shoulder.x) * 180) / Math.PI;
      return Math.max(-50, Math.min(0, degrees));
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
      if (sizeChanged || !root.ResizeObserver) {
        sizeChanged = false;
        measure();
      }
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
        // Frozen in ice: the monster (or the boss's throw) waits.
        cur.frozenLeft = Math.max(0, cur.frozenLeft - dt);
        updateIceTimer(cur.frozenLeft);
        if (cur.frozenLeft === 0) thaw();
      } else {
        cur.prog = Math.min(1, cur.prog + (dt * cur.speed) / cur.travel);
      }
      sound.setIntensity(cur.frozenLeft > 0 ? 0 : cur.isBoss ? cur.prog * 0.6 : cur.prog);

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
      // The boss never reaches the hero, so no red "danger" vignette in boss rounds.
      ui.setDanger(!cur.isBoss && cur.prog > config.DANGER_AT);

      if (cur.prog >= 1) {
        if (cur.isBoss) bossRoundTimeout();
        else startAttack();
      }
    }

    // ── Question flow ───────────────────────────────────────────────────
    function nextQuestion(forced = {}) {
      // A new scenery comes with its own little scene before the question.
      if (!state.boss && !forced.sceneReady) {
        const scene = R.sceneFor(state.correct, config, SCENES.map((s) => s.id));
        if (scene !== state.scene) return changeScene(scene, () => nextQuestion({ ...forced, sceneReady: true }));
      }
      if (state.deck.length === 0) {
        state.deck = Q.buildDeck(questions, config, { stats: state.stats, lastId: state.lastId });
      }
      let id = state.deck.shift();
      if (forced.questionId && byId.has(forced.questionId)) id = forced.questionId;
      const question = byId.get(id);
      state.lastId = id;

      const isBoss = Boolean(state.boss);
      const previous = state.current ? state.current.monster.id : null;
      const monster = isBoss
        ? Monsters.bosses.find((b) => b.kind === state.boss.kind)
        : (forced.monsterId && Monsters.byId(forced.monsterId)) || Monsters.pick(previous);

      state.current = {
        question,
        isBoss,
        shown: Q.shuffledOptions(question),
        eliminated: new Set(),
        picked: new Set(), // correct options already marked ("choose two" questions)
        hadError: false,
        elapsed: 0,
        prog: 0, // walking progress; in boss rounds, the time until it throws a rock
        travel: R.travelSeconds(question, state.level, config),
        speed: 1, // multiplier; each miss makes this monster (or throw) faster
        lockLeft: 0, // seconds left in the post-miss lockout
        frozenLeft: 0, // seconds left frozen in ice (power-up)
        wrongPicks: [], // texts of the wrong options shot (for the report)
        monster,
      };

      spawnMonster(monster);
      ui.setEvent(false);
      ui.setLock(0);
      ui.renderQuestion(question, state.current.shown);
      ui.setDanger(false);
      setPanel(true);
      state.shotInFlight = false;
      state.phase = "play";
      syncPowers();
      if (R.isLongRead(question, config)) {
        fx.balloon(`Leitura longa: +${config.LONG_READ_BONUS}s`, calloutY(), "clock");
        ui.announce(`Questão de leitura longa: você ganhou mais ${config.LONG_READ_BONUS} segundos.`);
      }
    }

    /**
     * A question ended (hit, skip, or a life lost and the player continued).
     * Counts it, maybe brings the mystery box, then picks the next step.
     */
    function questionDone(wasHit) {
      // Boss rounds count themselves as they finish; don't count the last one twice.
      if (!state.current || !state.current.counted) state.finished += 1;
      if (!state.boxReady && state.finished >= state.boxAt) showBox();

      if (wasHit && R.isBossDue(state.correct, config)) return startBoss();
      const cheer = wasHit && state.cheers.find((c) => c.at === state.correct);
      if (cheer) return startCheer(cheer.text);
      nextQuestion();
    }

    /** Changes the scenery when the number of correct answers calls for it. */
    /**
     * Scenery change: the question goes away, the hero runs off to the right,
     * the new place's name shows on a dimmed screen, the new scenery appears
     * with the hero running in from the left, and then the next question comes.
     */
    function changeScene(scene, done) {
      state.phase = "event";
      ui.setEvent(true);
      ui.setDanger(false);
      monsterEl.hidden = true;
      syncPowers();
      sound.setIntensity(0);
      const heroEl = deps.heroEl;
      const run = (x, ms) => {
        heroEl.style.transition = ms ? `translate ${ms}ms ease-in-out` : "none";
        heroEl.style.translate = `${x}px 0`;
      };
      heroEl.classList.add("is-running");
      run(geo.width + 40, 1100);
      const info = SCENES.find((s) => s.id === scene);
      later(() => {
        deps.world.classList.add("is-traveling"); // dim while only the name shows
        ui.banner(`${info.icon} ${info.label}`, "scene");
        sound.play("scene");
        ui.announce(`Novo cenário: ${info.label}.`);
      }, 1100);
      later(() => {
        state.scene = scene;
        ambient.setScene(scene);
        deps.world.classList.remove("is-traveling");
        run(-(geo.heroLeft + hero.WIDTH + 20), 0);
        void heroEl.offsetWidth;
        run(0, 900);
      }, 2500);
      later(() => {
        heroEl.classList.remove("is-running");
        heroEl.style.transition = "";
        heroEl.style.translate = "";
        ui.clearBanner();
        done();
      }, 3500);
    }

    /** Closes the current question in the report log: "first" | "late" | "lost" | "skipped". */
    function logOutcome(outcome) {
      const cur = state.current;
      const q = cur.question;
      state.log.push({
        id: q.id,
        q: q.q,
        topic: q.topic,
        answer: Q.answerText(q),
        explanation: q.explanation,
        wrongPicks: cur.wrongPicks.slice(),
        outcome,
        seconds: Math.round(cur.elapsed),
      });
    }

    // ── Scripted moments: intro and cheering visitor ────────────────────
    function startIntro(options) {
      state.phase = "event";
      ui.setEvent(true);
      monsterEl.hidden = true;
      ui.banner("READY?", "intro");
      sound.play("ready");
      later(() => {
        ui.banner("GO!", "intro-go");
        sound.play("go");
      }, Math.round(config.INTRO_MS * 0.5));
      later(() => {
        ui.clearBanner();
        nextQuestion(options);
      }, config.INTRO_MS);
    }

    function startCheer(text) {
      state.phase = "event";
      ui.setEvent(true);
      monsterEl.hidden = true;
      ui.setDanger(false);
      syncPowers();
      sound.setIntensity(0);
      sound.setMood("happy");
      ui.announce(text);
      // A short conversation: the hero promises to protect the city, the visitor thanks them.
      const heroine = deps.heroEl.dataset.variant === "female";
      visitor.play(
        text,
        later,
        () => {
          sound.setMood(null);
          nextQuestion();
        },
        {
          onHeroLine: () => fx.speech(geo.heroLeft + hero.WIDTH / 2, heroTop() - 8, pick(HERO_LINES), 2600),
          onReply: (head) => fx.speech(head.x, head.y, heroine ? "Você é minha heroína!" : "Você é o meu herói!", 2400),
        }
      );
    }

    // ── Mystery box: swaps the hero's weapon ────────────────────────────
    function showBox() {
      state.boxReady = true;
      ui.setBox(true);
    }

    function openBox() {
      if (!state.boxReady || !["play", "dying"].includes(state.phase)) return;
      const options = Object.keys(WEAPONS).filter((w) => w !== hero.weapon());
      const weapon = options[Math.floor(Math.random() * options.length)];
      hero.setWeapon(weapon);
      state.boxReady = false;
      state.boxAt = R.nextBoxAt(state.finished, config);
      ui.setBox(false);
      const x = heroRight() + 18;
      fx.sparkle(x, geo.height - geo.ground - 16);
      fx.balloon(`Nova arma: ${WEAPONS[weapon].label}!`, calloutY(), "zap");
      sound.play("box");
      later(() => sound.play("equip"), 350);
      ui.announce(`Caixa aberta! Nova arma: ${WEAPONS[weapon].label}.`);
    }

    // ── Power-ups ───────────────────────────────────────────────────────
    function syncPowers() {
      const cur = state.current;
      ui.setPausable(state.phase === "play");
      ui.renderPowers(state.powers, {
        playing: state.phase === "play",
        frozen: Boolean(cur && cur.frozenLeft > 0),
        boss: Boolean(state.boss),
      });
    }

    function updateIceTimer(seconds) {
      const label = monsterEl.querySelector(".m-ice-time");
      if (label) label.textContent = `${Math.ceil(seconds)}s`;
    }

    /** "Gelo": traps the monster in an ice cube for FREEZE_SECONDS. */
    function freeze() {
      const cur = state.current;
      if (state.phase !== "play" || !cur || cur.isBoss || cur.frozenLeft > 0 || state.powers.freeze <= 0) return;
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

    /** "Pular": swaps the question. No life lost, no score, streak and stats untouched. Not in boss fights. */
    /** Pauses a game in progress: nothing moves and the music stops until resume(). */
    function pause() {
      if (state.phase !== "play") return false;
      state.phase = "paused";
      sound.stopMusic();
      ui.setPaused(true);
      ui.announce("Jogo pausado.");
      return true;
    }

    function resume() {
      if (state.phase !== "paused") return;
      ui.setPaused(false);
      state.phase = "play";
      lastFrame = null; // no jump for the time spent paused
      sound.startMusic();
      ui.announce("Jogo retomado.");
    }

    /** "Encerrar partida" on the pause screen (after "Tem certeza?"): ends the game now, with its summary and report. */
    function quit() {
      if (state.phase !== "paused") return;
      ui.setPaused(false);
      clearTimers();
      gameOver({ quit: true });
    }

    const togglePause = () => (state.phase === "paused" ? resume() : pause());

    /** Easy mode: pauses the game and opens the study card of the question's topic. */
    function openHint() {
      const cur = state.current;
      if (!config.HINTS || state.phase !== "play" || !cur) return;
      const guide = deps.guide || { topics: {}, tasks: {} };
      const info = guide.topics[cur.question.topic];
      state.phase = "hint"; // nothing moves until the card closes
      sound.setIntensity(0);
      const task = info && info.task ? `${info.task} ` : "";
      ui.showHint({
        title: info ? `${task}${cur.question.topic} · ${info.domain}` : "Tema geral",
        tips: info ? info.tips : ["Leia com calma: a pergunta diz qual problema precisa ser resolvido. Procure o serviço que faz exatamente isso."],
        map: info ? info.map : [],
      });
      ui.announce("Jogo pausado. Dica de estudo aberta.");
    }

    function closeHint() {
      if (state.phase !== "hint") return;
      ui.hide();
      state.phase = "play";
      ui.announce("De volta ao jogo.");
    }

    function skip() {
      const cur = state.current;
      if (state.phase !== "play" || !cur || state.boss || state.shotInFlight || state.powers.skip <= 0) return;
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
      later(() => questionDone(false), config.NEXT_AFTER_HIT_MS);
    }

    function spawnMonster(monster) {
      monsterEl.className = `monster monster-${monster.id}${monster.species ? ` boss-${monster.species}` : ""}${monster.flying ? " is-flying" : ""}`;
      monsterEl.innerHTML =
        `<div class="m-art">${monster.svg}</div><span class="m-speed" hidden></span>` +
        (state.boss ? `<span class="boss-hp" role="img"></span>` : "");
      monsterEl.style.setProperty("--lift", String(monster.lift || 0)); // flying monsters hover this high
      monsterEl.hidden = false;
      measure();
      if (state.boss) {
        // The boss slides in (or steps closer) smoothly; regular monsters move every frame.
        monsterEl.style.transition = "transform 900ms ease-out";
        updateBossHp();
      } else {
        monsterEl.style.transition = "";
        placeMonster(monsterX(0, monster));
      }
    }

    function artEl() {
      return monsterEl.querySelector(".m-art");
    }

    /** Marks every correct option (one, or two in "choose two" questions). */
    function markCorrect(cur) {
      cur.shown.forEach((o, i) => o.correct && ui.markAnswer(i));
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
      if (!option || cur.eliminated.has(index) || cur.picked.has(index)) return;

      const projectile = WEAPONS[hero.weapon()].projectile;
      state.shotInFlight = true;
      hero.recoil();
      sound.play("shoot", projectile);
      // The shot leaves the muzzle of the (possibly raised) weapon arm.
      const angle = (aimAngle(cur) * Math.PI) / 180;
      const shoulder = heroShoulder();
      const dx = hero.MUZZLE.x - NS.hero.SHOULDER.x;
      const dy = hero.MUZZLE.y - 4 - NS.hero.SHOULDER.y;
      const fromX = shoulder.x + dx * Math.cos(angle) - dy * Math.sin(angle);
      const fromY = shoulder.y + dx * Math.sin(angle) + dy * Math.cos(angle);
      fx.muzzle(fromX, fromY + 4);
      const scale = scaleOf(cur.monster);
      const toX = currentX() + geo.size * scale * 0.3;
      const toY = geo.height - geo.ground - geo.monsterHeight * scale * (0.55 + (cur.monster.lift || 0));
      fx.shot(fromX, fromY, toX, toY, config.SHOT_MS, projectile);

      later(() => {
        state.shotInFlight = false;
        if (state.phase !== "play" || state.current !== cur) return; // monster arrived mid-flight
        if (option.correct && cur.picked.size + 1 < R.answersNeeded(cur.question)) onPartialHit(index);
        else if (option.correct) onHit(index);
        else onMiss(index);
      }, config.SHOT_MS);
    }

    function monsterCenter() {
      const cur = state.current;
      const scale = scaleOf(cur.monster);
      return {
        x: currentX() + geo.size * scale * 0.45,
        y: geo.height - geo.ground - geo.monsterHeight * scale * (0.6 + (cur.monster.lift || 0)),
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
      const center = monsterCenter();
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

      if (cur.isBoss) {
        bossHit();
        return;
      }
      monsterEl.classList.add("is-dying");
      fx.confetti(center.x, center.y, config.CONFETTI_COUNT);
      later(() => questionDone(true), config.NEXT_AFTER_HIT_MS);
    }

    /**
     * A right option in a "choose two" question, but not the last one: the shot
     * lands and the monster staggers, but only the final right answer kills it.
     */
    function onPartialHit(index) {
      const cur = state.current;
      const needed = R.answersNeeded(cur.question);
      cur.picked.add(index);
      ui.pickOption(index);
      ui.setPicked(cur.picked.size, needed);
      sound.play("hit");
      const art = artEl();
      art.classList.remove("is-jolt");
      void art.offsetWidth;
      art.classList.add("is-jolt");
      const center = monsterCenter();
      fx.popText(center.x, center.y - 30, `${cur.picked.size} de ${needed}!`, "pop-points");
      const left = needed - cur.picked.size;
      ui.announce(`Certo! Falta ${left === 1 ? "mais uma alternativa" : `mais ${left} alternativas`}.`);
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

      // Penalty: lockout, plus a faster monster for the rest of this question.
      // The boss stands still, so against it a miss only locks the answers (and it throws).
      cur.lockLeft = config.WRONG_LOCK_SECONDS;
      ui.lockAnswers();
      ui.setLock(cur.lockLeft);
      const boost = Math.round(config.WRONG_SPEEDUP * 100);
      if (!cur.isBoss) {
        cur.speed = R.speedAfterWrong(cur.speed, config);
        monsterEl.classList.add("is-enraged");
        const badge = monsterEl.querySelector(".m-speed");
        badge.textContent = `▲ ${Math.round(cur.speed * 100)}%`;
        badge.hidden = false;
      }

      const art = artEl();
      art.classList.remove("is-jolt");
      field.classList.remove("is-shaking");
      void art.offsetWidth; // restart the jolt and shake animations
      art.classList.add("is-jolt");
      field.classList.add("is-shaking");

      fx.penalty(geo.width / 2, calloutY() + 30, cur.isBoss ? "" : `VELOCIDADE +${boost}%`);
      ui.announce(
        cur.isBoss
          ? `Errou! Aguarde ${config.WRONG_LOCK_SECONDS} segundos para atirar de novo.`
          : `Errou! O monstro ficou ${boost}% mais rápido. Aguarde ${config.WRONG_LOCK_SECONDS} segundos para atirar de novo.`
      );
      if (cur.isBoss) bossThrow();
      renderHud();
    }

    // ── Boss fight: a bonus round of BOSS_ROUNDS questions ──────────────
    // The boss stands still, takes one heart per hit, throws rocks on misses
    // and timeouts (the hero staggers, no life is lost) and steps closer each
    // round it is not hit, never past BOSS_LIMIT.
    //
    // Its arrival is a little film: the screen goes dark and flickers, heavy
    // steps shake the ground and lightning flashes while its dark silhouette
    // walks in; then a big flash shows it, it roars, and the fight starts.
    const BOSS_SCENE = Object.freeze({ steps: [500, 1300, 2100, 2900], lightning: [1000, 2500], walk: [700, 3300], reveal: 3600, fight: 5200 });

    function startBoss() {
      state.phase = "event";
      ui.setEvent(true);
      monsterEl.hidden = true;
      ui.setDanger(false);
      syncPowers();
      sound.setIntensity(0);
      sound.play("bossIntro");
      const look = Monsters.pickBoss(lastBossKind);
      lastBossKind = look.kind;
      ui.announce(`Hora do chefão: ${look.name}! Acerte ${config.BOSS_HP} de ${config.BOSS_ROUNDS} perguntas para derrotá-lo. As pedras não tiram vidas, mas se ele vencer você perde uma.`);
      state.boss = { hp: config.BOSS_HP, hits: 0, round: 1, pos: 0, kind: look.kind };
      deps.world.classList.add("is-boss-coming");

      // The silhouette walks in from off screen to where the boss stands.
      later(() => {
        spawnMonster(look);
        monsterEl.classList.add("is-silhouette");
        monsterEl.style.transition = "none";
        placeMonster(geo.width);
        void monsterEl.offsetWidth;
        const [from, to] = BOSS_SCENE.walk;
        monsterEl.style.transition = `transform ${to - from}ms linear`;
        placeMonster(bossX(0));
      }, BOSS_SCENE.walk[0]);
      for (const at of BOSS_SCENE.steps) {
        later(() => {
          sound.play("stomp");
          shakeField();
        }, at);
      }
      for (const at of BOSS_SCENE.lightning) later(() => ambient.flash(), at);

      later(() => {
        ambient.flash();
        deps.world.classList.remove("is-boss-coming");
        monsterEl.classList.remove("is-silhouette");
        ui.banner("👑 HORA DO CHEFÃO!", "boss");
        sound.play("roar", bossVoice(look));
        shakeField();
      }, BOSS_SCENE.reveal);
      later(() => {
        ui.clearBanner();
        nextQuestion(); // the boss is already in place
        bossSays("Eu vou destruir você!", 2600);
      }, BOSS_SCENE.fight);
    }

    function shakeField() {
      field.classList.remove("is-shaking");
      void field.offsetWidth;
      field.classList.add("is-shaking");
    }

    function updateBossHp() {
      const el = monsterEl.querySelector(".boss-hp");
      if (!el || !state.boss) return;
      el.textContent = "❤".repeat(state.boss.hp) + "♡".repeat(config.BOSS_HP - state.boss.hp);
      el.setAttribute("aria-label", `Vida do chefão: ${state.boss.hp} de ${config.BOSS_HP}`);
    }

    /** Speech bubble over the boss's head. */
    function bossSays(text, ms = 2000) {
      if (!state.current || !state.current.isBoss) return;
      const scale = Monsters.boss.scale;
      const head = state.current.monster.head || { x: 0.5, y: 0.08 };
      // A new line replaces the one still on screen, so bubbles never pile up.
      document.querySelectorAll("#fx .speech.is-boss").forEach((el) => el.remove());
      fx.speech(currentX() + geo.size * scale * head.x, geo.height - geo.ground - geo.monsterHeight * scale * (1 - head.y), text, ms).classList.add("is-boss");
    }

    /** Rock throw animation: no damage, the hero just staggers. */
    function bossThrow() {
      const art = artEl();
      if (!art) return;
      art.classList.remove("atk-throw");
      void art.offsetWidth;
      art.classList.add("atk-throw");
      const scale = Monsters.boss.scale;
      const fromX = currentX() + geo.size * scale * 0.2;
      const fromY = geo.height - geo.ground - geo.monsterHeight * scale * 0.4;
      const toX = geo.heroLeft + hero.WIDTH * 0.4;
      const toY = heroTop() + 12;
      // Each boss throws its own thing; the robot fires a laser instead.
      const thing = state.current.monster.throws || "rock";
      const flight = thing === "laser" ? 300 : 650;
      if (thing === "laser") {
        fx.shot(fromX, fromY, toX, toY, flight, "laser");
        sound.play("shoot", "laser");
      } else {
        fx.rock(fromX, fromY, toX, toY, flight, thing);
        sound.play("rockThrow");
      }
      bossSays(pick(BOSS_TAUNTS), 1600);
      const impact = { rock: "TUM!", boulder: "TUM!", fireball: "FOOSH!", snowball: "PLOFT!", barrel: "BOOM!", laser: "ZAP!" };
      later(() => {
        hero.flinch();
        sound.play("rockHit");
        fx.popText(geo.heroLeft + hero.WIDTH / 2, heroTop() - 6, impact[thing] || "TUM!", "pop-attack");
      }, flight);
    }

    function bossHit() {
      const boss = state.boss;
      boss.hits += 1;
      boss.hp -= 1;
      updateBossHp();
      const art = artEl();
      art.classList.remove("is-hurt");
      void art.offsetWidth;
      art.classList.add("is-hurt");
      sound.play("bossHurt");
      if (boss.hp > 0) {
        // It roars back and threatens the hero.
        later(() => sound.play("roar", bossVoice(state.current.monster)), 200);
        bossSays(pick(BOSS_THREATS), 1600);
      }
      later(() => {
        countBossRound();
        if (boss.hp <= 0) bossEnd();
        else nextBossRound();
      }, config.NEXT_AFTER_HIT_MS);
    }

    function bossRoundTimeout() {
      const cur = state.current;
      state.phase = "attack";
      if (!cur.hadError) {
        cur.hadError = true;
        recordStat(cur.question.id, false);
      }
      state.streak = 0;
      logOutcome("lost");
      cur.lockLeft = 0;
      ui.setLock(0);
      ui.lockAnswers();
      syncPowers();
      bossThrow();
      sound.play("bossGrowl");
      ui.announce("O chefão jogou uma pedra! Você não perdeu vida.");
      later(() => {
        countBossRound();
        state.boss.pos = R.bossStep(state.boss.pos, config);
        nextBossRound();
      }, 1100);
    }

    function countBossRound() {
      state.finished += 1;
      state.current.counted = true;
    }

    function nextBossRound() {
      state.boss.round += 1;
      if (state.boss.round > config.BOSS_ROUNDS) bossEnd();
      else nextQuestion();
    }

    function bossEnd() {
      const boss = state.boss;
      const center = monsterCenter(); // before the fight state goes away (it places the boss)
      const reward = R.bossReward({ hits: boss.hits, lives: state.lives }, config);
      state.score += reward.points;
      const gotLife = reward.lives > state.lives;
      state.lives = reward.lives;
      state.boss = null;
      state.phase = "event";
      ui.setEvent(true);
      renderHud();
      if (!reward.defeated) {
        bossFinalSmash(reward.points);
        return;
      }
      // A little film: the boss trembles and flashes, cries out, tips over and
      // falls apart in chunks of its own colors; then the confetti and the reward.
      const monster = state.current.monster;
      fx.speech(center.x, center.y - geo.monsterHeight * 0.9, "Nãããão!", 1500);
      monsterEl.classList.add("is-breaking");
      sound.play("bossHurt");
      later(() => sound.play("roar", bossVoice(monster)), 250);
      later(() => {
        monsterEl.classList.add("is-falling");
        fx.debris(center.x, center.y, bossColors(), 16);
        sound.play("rockHit");
      }, BOSS_FALL.tip);
      later(() => {
        sound.play("stomp");
        shakeField();
        fx.debris(center.x, geo.height - geo.ground - 20, bossColors(), 10);
      }, BOSS_FALL.ground);
      later(() => {
        fx.confetti(center.x, center.y, config.CONFETTI_COUNT * 2);
        fx.balloon(`Chefão derrotado! +${reward.points} pontos${gotLife ? " e +1 vida" : ""}`, calloutY(), "trophy");
        sound.play("bossDefeated");
        ui.announce(`Chefão derrotado! Mais ${reward.points} pontos${gotLife ? " e uma vida" : ""}.`);
      }, BOSS_FALL.reward);
      later(() => {
        monsterEl.classList.remove("is-breaking", "is-falling");
        const cheer = state.cheers.find((c) => c.at === state.correct);
        if (cheer) startCheer(cheer.text);
        else nextQuestion();
      }, BOSS_FALL.next);
    }

    // Defeated boss scene (ms): trembling, tipping over in pieces, hitting the ground, reward, next question.
    const BOSS_FALL = Object.freeze({ tip: 1000, ground: 1700, reward: 2300, next: 4600 });

    /** The boss's main colors, read from its drawing (for the flying chunks). */
    function bossColors() {
      const count = new Map();
      monsterEl.querySelectorAll(".m-art [fill]").forEach((el) => {
        const fill = el.getAttribute("fill");
        if (/^#[0-9a-f]{3,6}$/i.test(fill)) count.set(fill, (count.get(fill) || 0) + 1);
      });
      const colors = [...count].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([c]) => c);
      return colors.length ? colors : ["#8a8f98", "#5c6168"];
    }

    /**
     * Fewer than BOSS_HP hits: the boss walks up and crushes the hero (−1 life;
     * Game Over if it was the last one). Points for each hit are kept.
     */
    function bossFinalSmash(points) {
      state.phase = "attack";
      ui.setEvent(false);
      ui.lockAnswers();
      fx.balloon(`O chefão venceu! +${points} pontos pelos acertos`, calloutY(), "star");
      ui.announce(`O chefão venceu esta rodada. Você perdeu uma vida. Mais ${points} pontos pelos acertos.`);
      // The close attack depends on the boss: smash, pound, charge (fast, horns first) or swallow.
      const finale = state.current.monster.finale || "smash";
      const charge = finale === "charge";
      monsterEl.style.transition = `transform ${charge ? 450 : 700}ms ease-in`;
      placeMonster(heroRight() - geo.size * Monsters.boss.scale * (finale === "swallow" ? 0.15 : 0.35));
      sound.play("bossGrowl");
      later(() => bossSays(finale === "swallow" ? "Hora do lanche!" : "Eu avisei!", 1500), 300);
      const finish = {
        smash: { cls: "atk-smash", fate: "bonked", word: "BLAM!" },
        pound: { cls: "atk-smash", fate: "bonked", word: "BUM BUM!" },
        charge: { cls: "atk-jump", fate: "bonked", word: "MUUU!" },
        swallow: { cls: "atk-chomp", fate: "eaten", word: "NHAM!" },
      }[finale];
      later(() => {
        const art = artEl();
        if (art) art.classList.add(finish.cls);
        hero.setFate(finish.fate);
        field.classList.remove("is-shaking");
        void field.offsetWidth;
        field.classList.add("is-shaking");
        fx.popText(geo.heroLeft + hero.WIDTH / 2, heroTop() - 6, finish.word, "pop-attack");
        sound.play("rockHit");
      }, charge ? 500 : 750);
      later(() => {
        state.lives -= 1;
        state.streak = 0;
        renderHud();
        if (state.lives <= 0) gameOver();
        else lifeLost();
      }, 1700);
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
        monsterX: currentX(),
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
        answerText: Q.answerText(cur.question),
      });
    }

    /** "Continuar": hero respawns blinking, then the game goes on. */
    function continueAfterLifeLost() {
      if (state.phase !== "modal" || state.respawning) return;
      state.respawning = true;
      ui.hide();
      monsterEl.hidden = true;
      fx.clear();
      hero.reset(config.HERO_BLINK_MS);
      later(() => {
        state.respawning = false;
        questionDone(false);
      }, config.HERO_BLINK_MS);
    }

    /** Saves the game, then shows the dark "GAME OVER" screen before the summary card. */
    function gameOver({ quit = false } = {}) {
      const cur = state.current;
      state.phase = "dead";

      const previous = store.getHistory()[0] || null;
      const newRecord = state.score > state.best && state.score > 0;
      if (newRecord) store.setBest(state.score);

      // One timestamp links the history row to its saved report (exported from the history screen).
      const t = Date.now();
      const shots = state.correct + state.misses;
      const report = {
        t,
        mode: config.mode,
        modeLabel: config.modeLabel,
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
      store.addHistory({ t, mode: config.mode, score: state.score, correct: state.correct, level: state.level }, config.HISTORY_LIMIT);
      store.addReport(report, config.REPORTS_LIMIT);
      state.lastReport = report;
      state.best = Math.max(state.best, state.score);

      sound.stopMusic();
      if (newRecord || !quit) sound.play(newRecord ? "record" : "gameOver");
      ui.setBox(false);
      markCorrect(cur);
      renderHud();

      state.gameOverData = {
        ...report,
        newRecord,
        previous,
        best: state.best,
        question: cur.question,
        answerText: Q.answerText(cur.question),
        quit,
      };
      if (quit) return showGameOverCard(); // straight to the summary, no dark screen
      ui.showDeath();
      later(showGameOverCard, config.DEATH_SCREEN_MS);
    }

    /** Ends the dark screen early (tap) or on time, and shows the summary. */
    function showGameOverCard() {
      if (state.phase !== "dead") return;
      state.phase = "over";
      ui.hideDeath();
      ui.showGameOver(state.gameOverData);
    }

    // ── Public actions ──────────────────────────────────────────────────
    /**
     * Starts a new game. `options` exists for automated tests only:
     * { questionId, monsterId } force the first question / monster;
     * skipIntro skips "READY? GO!".
     */
    /** Undoes the dimmed screens of the scripted scenes (a new game or "Início" can cut them short). */
    function clearScenes() {
      deps.world.classList.remove("is-boss-coming", "is-traveling");
      monsterEl.classList.remove("is-silhouette", "is-breaking", "is-falling");
    }

    function start(options = {}) {
      clearTimers();
      clearScenes();
      fx.clear();
      visitor.remove();
      hero.reset();
      hero.setWeapon(NS.hero.DEFAULT_WEAPON);
      Object.assign(state, freshGame());
      ambient.setScene(state.scene);
      ui.hide();
      ui.hideDeath();
      ui.setBox(false);
      renderHud();
      sound.stopMusic();
      sound.setMood(null);
      sound.startMusic();
      if (!soundHintShown) {
        soundHintShown = true;
        ui.soundHint(sound.isMuted());
      }
      if (options.skipIntro) nextQuestion(options);
      else startIntro(options);
    }

    function togglePanel() {
      if (state.current && state.phase === "play") setPanel(!state.panelOpen);
    }

    /** Switches the difficulty mode ("easy" | "advanced"), remembers it and updates the UI. */
    function setMode(mode) {
      config = R.configFor(deps.config, mode);
      store.setMode(config.mode);
      state.powers = { freeze: config.POWER_FREEZE, skip: config.POWER_SKIP };
      ui.setConfig(config);
      syncPowers();
    }

    /** Switches the playable character ("male" | "female") and remembers it. */
    function setHero(variant) {
      store.setHero(variant);
      hero.setVariant(variant);
    }

    /** Enter/Space outside a button: start, continue or restart depending on the phase. */
    function confirm() {
      if (state.phase === "dead") return showGameOverCard(), true;
      if (ui.isOpen("start")) {
        if (deps.canPlay) ui.showSetup();
        return true;
      }
      if (ui.isOpen("setup")) {
        if (ui.updateSetup()) start();
        return true;
      }
      if (ui.isOpen("life")) return continueAfterLifeLost(), true;
      if (ui.isOpen("hint")) return closeHint(), true;
      if (ui.isOpen("over")) return start(), true;
      return false;
    }

    /** "Voltar ao início": clears the field and shows the start card (character and mode are chosen again). */
    function goHome() {
      clearTimers();
      clearScenes();
      fx.clear();
      visitor.remove();
      ui.hideDeath();
      ui.setBox(false);
      monsterEl.hidden = true;
      hero.reset();
      hero.setVariant(store.getHero() || NS.hero.DEFAULT_VARIANT); // a duel may have drawn another look
      hero.setWeapon(NS.hero.DEFAULT_WEAPON);
      sound.stopMusic();
      showStartScreen(bootWarnings);
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
      bootWarnings = warnings;
      measure();
      ui.setConfig(config);
      monsterEl.hidden = true;
      showStartScreen(warnings);
      root.requestAnimationFrame(frame);
      // The loop's dt cap already avoids jumps; resetting the clock also
      // keeps the first frame after returning from a hidden tab at dt = 0.
      document.addEventListener("visibilitychange", () => {
        lastFrame = null;
        // Leaving the page (answering a message, switching apps) pauses the game.
        if (document.hidden) pause();
      });
      root.addEventListener("resize", measure);
    }

    /**
     * For automated tests only: triggers a scripted moment right away
     * ("boss", "cheer", "box") without playing up to it.
     */
    function trigger(event) {
      if (event === "boss") startBoss();
      else if (event === "cheer") startCheer(config.CHEER_FIRST_TEXT);
      else if (event === "box") showBox();
    }

    return Object.freeze({
      boot,
      start,
      shoot,
      togglePanel,
      freeze,
      skip,
      openHint,
      closeHint,
      pause,
      resume,
      togglePause,
      quit,
      /** True while the "JOGO PAUSADO" screen is up. */
      isPaused: () => state.phase === "paused",
      openBox,
      showGameOverCard,
      goHome,
      setMode,
      setHero,
      /** Effective rules of the current mode (for the UI and tests). */
      config: () => config,
      confirm,
      /** Data of the last finished game, for the report (null before the first Game Over). */
      lastReport: () => state.lastReport,
      reportAt,
      continueAfterLifeLost,
      openHistory,
      clearHistory,
      trigger,
      /** Read-only snapshot for tests and debugging. */
      snapshot: () => ({
        phase: state.phase,
        lives: state.lives,
        score: state.score,
        fast: state.fast,
        level: state.level,
        correct: state.correct,
        finished: state.finished,
        questionId: state.current ? state.current.question.id : null,
        monsterId: state.current ? state.current.monster.id : null,
        isBoss: Boolean(state.current && state.current.isBoss),
        boss: state.boss ? { ...state.boss } : null,
        progress: state.current ? state.current.prog : 0,
        travel: state.current ? state.current.travel : 0,
        speed: state.current ? state.current.speed : 1,
        lockLeft: state.current ? state.current.lockLeft : 0,
        frozenLeft: state.current ? state.current.frozenLeft : 0,
        powers: { ...state.powers },
        boxReady: state.boxReady,
        weapon: hero.weapon(),
        scene: state.scene,
        hero: deps.heroEl.dataset.variant,
        mode: config.mode,
        misses: state.misses,
        ambient: ambient.snapshot(),
        muted: sound.isMuted(),
        panelOpen: state.panelOpen,
      }),
    });
  }

  NS.game = Object.freeze({ create });
})(typeof window !== "undefined" ? window : globalThis);
