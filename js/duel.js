/**
 * AWS Cloud Quest — duel 1×1 (Wild West).
 *
 * One player creates a room and shares a link; the friend opens it and joins.
 * Both see the same question at the same time. The first correct answer shoots
 * the other player, who loses a life. A wrong answer locks that player until
 * the round ends; both wrong (or time out) costs both a life.
 *
 * The room creator ("host") is the referee: it picks the questions, times the
 * rounds and decides results with duel-rules.js. The other player ("guest")
 * shows what the host sends. Messages go through js/net.js.
 *
 * Messages (JSON, every one has `t` and `from`):
 *   guest → join {name, hero, bank}       host → accept {to, name, hero, lives} | reject {to, reason}
 *   any   → ready                         host → start {countdown, lives}
 *   host  → round {n, qid, order, seconds, lives, wins}
 *   any   → answer {n, correct, ms}       host → result {n, result, lives, answers}
 *   host  → over {winner | "draw"}        any  → rematch | ping | bye
 *
 * Phases: off → setup → connecting → waiting → countdown → intro → round →
 * result → (intro …) → victory → over; "paused" while a dropped player has
 * time to come back; "closed" when the room ended.
 */
(function (root) {
  "use strict";

  const NS = root.AwsCloudQuest;
  const $ = (id) => document.getElementById(id);

  /** FNV-1a hash of the question ids: both players must run the same bank. */
  function bankKey(questions) {
    let h = 0x811c9dc5;
    for (const ch of questions.map((q) => q.id).sort().join("|")) {
      h ^= ch.charCodeAt(0);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(16);
  }

  // Brazil flag on a pole beside the podium (drawn: emoji flags do not render on Windows).
  const FLAGPOLE =
    '<svg viewBox="0 0 40 96" aria-hidden="true"><rect x="2" y="2" width="3" height="94" rx="1.5" fill="#6b4a2a"/>' +
    '<circle cx="3.5" cy="3" r="3" fill="#fbd51a"/><g class="flag-cloth"><rect x="5" y="6" width="32" height="22" fill="#009c3b"/>' +
    '<path d="M21 8 34.5 17 21 26 7.5 17Z" fill="#ffdf00"/><circle cx="21" cy="17" r="4.8" fill="#002776"/>' +
    '<path d="M16.4 16q4.7-1 9.2 1.5" stroke="#fff" stroke-width=".8" fill="none"/></g></svg>';

  function create(deps) {
    const { config, questions, store, ui, sound, ambient, field, onExit, onReport } = deps;
    const D = NS.duelRules;
    const R = NS.rules;
    const Q = NS.questions;
    // Test hook: the smoke test shortens the timings and uses the local transport.
    const testHooks = root.AwsCloudQuestDuelTest || {};
    const DUEL = Object.freeze({ ...config.DUEL, ...testHooks });
    const byId = new Map(questions.map((q) => [q.id, q]));
    const bank = bankKey(questions);
    const reducedMotion = () => (root.matchMedia ? root.matchMedia("(prefers-reduced-motion: reduce)").matches : false);
    const fx = NS.effects.create($("fx"), { reducedMotion });
    // The duel draws on the solo hero's element; it keeps the current look until a duel starts.
    const me = NS.hero.create($("hero"), $("hero").dataset.variant);
    const rivalEl = $("rival");
    const rival = NS.hero.create(rivalEl, NS.hero.DEFAULT_VARIANT);
    const myId = `p-${Math.random().toString(36).slice(2, 10)}`;
    const timers = new Set();

    const fresh = () => ({
      phase: "off",
      role: null, // "host" | "guest"
      room: null,
      conn: null,
      name: "",
      hero: null,
      peer: null, // { id, name, hero }
      peerSeen: 0,
      maxLives: DUEL.LIVES, // 10 or 20, chosen by the room creator
      lives: { host: DUEL.LIVES, guest: DUEL.LIVES },
      paused: null, // { phase } while waiting for a dropped player
      reconnecting: false,
      roundNo: 0,
      round: null,
      specialDone: false, // the special move happens once per match
      wins: { host: 0, guest: 0 }, // rounds won in this match
      score: { host: 0, guest: 0 }, // matches won in this room
      rematch: { host: false, guest: false },
      ready: { host: false, guest: false }, // both tap "Pronto!" before the first countdown
      deck: [],
      log: [],
      startedAt: 0,
      lastReport: null,
    });
    let state = fresh();

    // ── Timers ──────────────────────────────────────────────────────────
    function later(fn, ms) {
      const id = setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
      return id;
    }
    function every(fn, ms) {
      const id = setInterval(fn, ms);
      timers.add(id);
      return id;
    }
    function clearTimers() {
      timers.forEach((id) => {
        clearTimeout(id);
        clearInterval(id);
      });
      timers.clear();
    }
    function cancel(id) {
      clearTimeout(id);
      clearInterval(id);
      timers.delete(id);
    }

    const myRole = () => state.role;
    const rivalRole = () => D.other(state.role);
    const nameOf = (role) => (role === state.role ? state.name : state.peer ? state.peer.name : "Adversário");
    const isHost = () => state.role === "host";
    /** True when that player plays the woman (for "[male|female]" lines). */
    const isFemale = (role) => (role === state.role ? state.hero : state.peer && state.peer.hero) === "female";

    // ── Network ─────────────────────────────────────────────────────────
    let sent = 0;
    function send(type, data = {}) {
      // The id lets the network layer drop the copies that arrive through a second broker.
      if (state.conn) state.conn.send({ t: type, from: myId, id: `${myId}-${++sent}`, ...data });
    }

    const joinRoom = () =>
      NS.net.join({
        room: state.room,
        brokers: DUEL.BROKERS,
        transport: testHooks.transport || "mqtt",
        onMessage: receive,
        onClose: connectionLost,
      });

    async function connect(room) {
      state.phase = "connecting";
      state.room = room;
      try {
        state.conn = await joinRoom();
        return true;
      } catch {
        state.conn = null;
        state.phase = "setup";
        showSetupError("Não consegui conectar ao servidor do duelo. Verifique a internet e tente de novo.");
        return false;
      }
    }

    /** This browser lost the relay: retry every few seconds while the room can still be saved. */
    async function connectionLost() {
      state.conn = null;
      if (state.phase === "closed" || state.reconnecting) return;
      state.reconnecting = true;
      const until = Date.now() + DUEL.PEER_SILENT_MS + DUEL.RECONNECT_MS;
      while (state.phase !== "closed" && !state.conn && Date.now() < until) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        if (state.phase === "closed") break;
        try {
          state.conn = await joinRoom();
        } catch {
          /* try again */
        }
      }
      state.reconnecting = false;
      if (state.conn) send("ping");
    }

    /** Validated view of an incoming message (names, heroes and numbers sanitized). */
    function receive(msg) {
      if (!msg || msg.from === myId || typeof msg.t !== "string") return;
      if (msg.to && msg.to !== myId) return;
      if (state.peer && msg.from !== state.peer.id && msg.t !== "join") return;
      if (state.peer && msg.from === state.peer.id) {
        state.peerSeen = Date.now();
        if (state.paused) resume();
      }
      const handler = HANDLERS[msg.t];
      if (handler) handler(msg);
    }

    const cleanHero = (hero) => (NS.hero.VARIANTS.includes(hero) ? hero : NS.hero.DEFAULT_VARIANT);
    const num = (value, fallback = 0) => (Number.isFinite(value) ? value : fallback);
    const cleanLives = (lives) => (DUEL.LIVES_OPTIONS.includes(lives) ? lives : DUEL.LIVES);

    /** Host: time of day and rain, so both screens share the same weather. */
    const sky = () => {
      const { time, rain } = ambient.snapshot();
      return { time, rain };
    };
    /** Guest: copies the host's weather. */
    function applySky(value) {
      if (value && Number.isFinite(value.time) && value.time >= 0 && value.time < 1) {
        ambient.set({ time: value.time, rain: value.rain === true });
      }
    }
    /** Lives or wins sent by the host, if well formed. */
    const pair = (value) =>
      value && Number.isFinite(value.host) && Number.isFinite(value.guest) ? { host: value.host, guest: value.guest } : null;

    const HANDLERS = {
      // ── Host side ──
      join(msg) {
        if (!isHost()) return;
        if (state.peer && msg.from !== state.peer.id) return send("reject", { to: msg.from, reason: "full" });
        if (msg.bank !== bank) return send("reject", { to: msg.from, reason: "bank" });
        const firstTime = !state.peer;
        state.peer = { id: msg.from, name: D.cleanName(msg.name, DUEL.NAME_MAX), hero: cleanHero(msg.hero) };
        state.peerSeen = Date.now();
        send("accept", { to: msg.from, name: state.name, hero: state.hero, lives: state.maxLives });
        if (firstTime) {
          sound.play("joined");
          renderPosters();
          showReady(`${state.peer.name} entrou no duelo! Toque em Pronto quando quiser começar.`);
        }
      },
      answer(msg) {
        if (!isHost() || !state.round || msg.n !== state.round.n) return;
        hostAnswer("guest", { correct: msg.correct === true, ms: Math.max(0, num(msg.ms, 1e9)) });
      },
      rematch() {
        state.rematch[rivalRole()] = true;
        status(`${nameOf(rivalRole())} quer revanche!`);
        if (isHost() && state.rematch.host && state.rematch.guest) startMatch();
      },

      // ── Guest side ──
      accept(msg) {
        if (isHost() || state.peer) return;
        state.peer = { id: msg.from, name: D.cleanName(msg.name, DUEL.NAME_MAX), hero: cleanHero(msg.hero) };
        state.peerSeen = Date.now();
        state.maxLives = cleanLives(msg.lives);
        sound.play("joined");
        renderPosters();
        showReady(`Você entrou no duelo contra ${state.peer.name}! Toque em Pronto quando quiser começar.`);
      },
      ready() {
        state.ready[rivalRole()] = true;
        status(state.ready[myRole()] ? "Os dois estão prontos!" : `${nameOf(rivalRole())} está ${R.gendered("[pronto|pronta]", isFemale(rivalRole()))}! Toque em Pronto.`);
        if (isHost()) startWhenReady();
      },
      reject(msg) {
        if (isHost()) return;
        const text =
          msg.reason === "bank"
            ? "Vocês estão com versões diferentes do jogo. Recarreguem a página e tentem de novo."
            : "Essa sala já tem dois jogadores.";
        close(text);
      },
      start(msg) {
        if (isHost()) return;
        applySky(msg.sky);
        beginCountdown(Math.min(30, Math.max(1, num(msg.countdown, DUEL.COUNTDOWN))), cleanLives(msg.lives));
      },
      round(msg) {
        if (isHost()) return;
        const question = byId.get(msg.qid);
        if (!question) return;
        applySky(msg.sky);
        beginRound({ n: num(msg.n), question, order: msg.order, seconds: num(msg.seconds, 30), lives: msg.lives, wins: msg.wins });
      },
      result(msg) {
        if (isHost() || !state.round || msg.n !== state.round.n) return;
        showResult(msg);
      },
      over(msg) {
        if (isHost()) return;
        if (D.ROLES.includes(msg.winner) || msg.winner === "draw") endMatch(msg.winner);
      },

      // ── Both ──
      ping() {},
      bye() {
        const who = state.peer ? state.peer.name : "O adversário";
        close(`${who} saiu da sala.`);
      },
    };

    // ── Screens ─────────────────────────────────────────────────────────
    function status(text) {
      for (const id of ["duel-wait-status", "duel-end-status"]) $(id).textContent = text;
      ui.announce(text);
    }

    function showSetupError(text) {
      const error = $("duel-error");
      error.textContent = text;
      error.hidden = !text;
      ui.showOverlay("duel");
    }

    function poster(name, hero) {
      const div = document.createElement("div");
      div.className = "poster";
      div.innerHTML =
        `<span class="poster-title">PROCURADO</span><span class="poster-photo">${NS.hero.artFor(hero)}</span>` +
        `<span class="poster-name"></span><span class="poster-label">RECOMPENSA</span>` +
        `<span class="poster-reward">${NS.icons.icon("heart", { size: 14, fill: "#c62828", className: "poster-heart" })} ${state.maxLives} vidas</span>`;
      div.querySelector(".poster-name").textContent = name; // player text: never as HTML
      return div;
    }

    function renderPosters() {
      const list = [poster(state.name, state.hero)];
      if (state.peer) list.push(poster(state.peer.name, state.peer.hero));
      else {
        const empty = document.createElement("div");
        empty.className = "poster is-empty";
        empty.textContent = "Esperando o adversário…";
        list.push(empty);
      }
      $("duel-posters").replaceChildren(...list);
      $("duel-share").hidden = !isHost() || Boolean(state.peer);
    }

    /** Both players get a "Pronto!" button; the countdown starts once both tapped it. */
    function showReady(text) {
      state.ready = { host: false, guest: false };
      const button = $("btn-duel-ready");
      button.hidden = false;
      button.disabled = false;
      $("duel-wait-title").textContent = "Duelo marcado!";
      status(text);
      button.focus({ preventScroll: true });
    }

    function markReady() {
      if (state.phase !== "waiting" || !state.peer || state.ready[myRole()]) return;
      state.ready[myRole()] = true;
      $("btn-duel-ready").disabled = true;
      send("ready");
      status(state.ready[rivalRole()] ? "Os dois estão prontos!" : `Esperando ${nameOf(rivalRole())} ficar ${R.gendered("[pronto|pronta]", isFemale(rivalRole()))}…`);
      if (isHost()) startWhenReady();
    }

    function startWhenReady() {
      if (state.ready.host && state.ready.guest) later(startMatch, 400);
    }

    /** "Como funciona o duelo": collapsible list, like "Como jogar" on the start card. */
    function rulesList() {
      const lines = [
        ["heart", `${DUEL.LIVES_OPTIONS.join(" ou ")} vidas para cada um (quem cria a sala escolhe). Quem zerar primeiro perde.`],
        ["crosshair", "Mesma pergunta para os dois: quem acertar primeiro atira e o outro perde 1 vida."],
        ["lock", "Errou? Fica travado até o fim do round."],
        ["clock", "Os dois erraram ou o tempo acabou: os dois perdem 1 vida."],
        ["zap", `Golpe especial: uma vez por partida, entre os rounds ${DUEL.SPECIAL_FROM} e ${DUEL.SPECIAL_TO}, quem acertar sozinho ataca com uma faca e derruba o outro.`],
        ["gauge", `O tempo de cada round encurta a cada ${DUEL.LEVEL_EVERY} rounds.`],
        ["trophy", "Os dois zeraram juntos? Empate: os dois sobem no pódio. No fim tem revanche e relatório."],
        ["history", `Caiu a conexão? O jogo pausa e espera ${Math.round(DUEL.RECONNECT_MS / 60000)} minutos. A sala expira em 5 minutos se o amigo não entrar.`],
      ];
      $("duel-rules").replaceChildren(
        ...lines.map(([iconName, text]) => {
          const li = document.createElement("li");
          li.innerHTML = NS.icons.icon(iconName, { size: 18 });
          li.append(` ${text}`);
          return li;
        })
      );
      setRulesOpen(false);
    }

    function setRulesOpen(open) {
      $("duel-howto-toggle").setAttribute("aria-expanded", String(open));
      $("duel-howto").classList.toggle("is-open", open);
      $("duel-rules").hidden = !open;
    }

    function updateGo() {
      const hero = document.querySelector('input[name="duel-hero"]:checked');
      $("btn-duel-go").disabled = !hero || !$("duel-name").value.trim();
    }

    /** Opens the duel setup: create a room, or join `room` from a link. */
    function openSetup(room = null) {
      if (state.phase !== "off" && state.phase !== "closed") return;
      state = fresh();
      state.phase = "setup";
      state.joinRoom = room;
      $("duel-title").textContent = room ? "Você foi chamado para um duelo!" : "Duelo 1×1";
      $("duel-lead").textContent = room
        ? "Digite seu nome, escolha seu boneco e entre na sala."
        : "Crie uma sala e mande o link para um amigo. Quem acertar primeiro atira!";
      $("duel-go-label").textContent = room ? "Entrar no duelo" : "Criar sala";
      $("duel-lives-box").hidden = Boolean(room); // the room creator picks the lives
      document.querySelectorAll('input[name="duel-lives"]').forEach((input) => (input.checked = Number(input.value) === DUEL.LIVES));
      $("duel-name").value = store.getName();
      document.querySelectorAll('input[name="duel-hero"]').forEach((input) => (input.checked = false));
      $("duel-error").hidden = true;
      rulesList();
      updateGo();
      ui.showOverlay("duel");
    }

    async function go() {
      const heroInput = document.querySelector('input[name="duel-hero"]:checked');
      if (!heroInput || state.phase !== "setup") return;
      sound.unlock();
      state.name = D.cleanName($("duel-name").value, DUEL.NAME_MAX);
      state.hero = heroInput.value;
      store.setName(state.name);
      state.role = state.joinRoom ? "guest" : "host";
      const livesInput = document.querySelector('input[name="duel-lives"]:checked');
      state.maxLives = cleanLives(livesInput ? Number(livesInput.value) : DUEL.LIVES);
      const room = state.joinRoom || D.newRoomId();

      $("duel-error").hidden = true;
      $("btn-duel-go").disabled = true;
      $("duel-go-label").textContent = "Conectando…";
      const ok = await connect(room);
      $("duel-go-label").textContent = state.joinRoom ? "Entrar no duelo" : "Criar sala";
      updateGo();
      if (!ok) return;

      enterStage();
      state.phase = "waiting";
      $("duel-count").hidden = true;
      $("duel-wait-title").textContent = isHost() ? "Sala criada!" : "Entrando na sala…";
      $("duel-link").value = linkFor(room);
      renderPosters();
      ui.showOverlay("duelWait");
      startPresence();

      if (isHost()) {
        const expires = Date.now() + DUEL.ROOM_TTL_MS;
        const tick = () => {
          if (state.peer) return;
          const left = Math.max(0, expires - Date.now());
          if (left === 0) return close("Ninguém entrou em 5 minutos. A sala expirou; crie outra quando quiser.");
          $("duel-wait-status").textContent = `Esperando o adversário… a sala expira em ${clock(left)}`;
        };
        tick();
        every(tick, 1000);
      } else {
        status("Procurando a sala…");
        // Knock until the host answers (it may still be connecting).
        const knock = () => !state.peer && send("join", { name: state.name, hero: state.hero, bank });
        knock();
        const knocker = every(knock, 2500);
        later(() => {
          cancel(knocker);
          if (!state.peer) close("Não encontrei a sala. Ela pode ter expirado; peça um link novo.");
        }, 20000);
      }
    }

    const clock = (ms) => {
      const s = Math.ceil(ms / 1000);
      return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    };

    /**
     * Invitation link. It points to duelo.html, which has its own link preview
     * (the duel, not the solo game) and forwards to index.html#duelo=<room>.
     */
    function linkFor(room) {
      const folder = root.location.href.split(/[?#]/)[0].replace(/[^/]*$/, "");
      return `${folder}duelo.html?sala=${room}`;
    }

    // ── Presence ────────────────────────────────────────────────────────
    function startPresence() {
      every(() => send("ping"), DUEL.HEARTBEAT_MS);
      every(() => {
        if (!state.peer || state.phase === "closed") return;
        // Closing the page or losing the connection does not always send "bye".
        const silent = Date.now() - state.peerSeen;
        const left = DUEL.PEER_SILENT_MS + DUEL.RECONNECT_MS - silent;
        if (left <= 0) return close(`${state.peer.name} não voltou a tempo. A sala foi encerrada.`);
        if (silent > DUEL.PEER_SILENT_MS && !["victory", "over"].includes(state.phase)) pause(left);
      }, 1000);
    }

    /** Freezes the match and shows who dropped, with the time left to come back. */
    function pause(left) {
      if (!state.paused) {
        state.paused = { phase: state.phase };
        state.phase = "paused";
        clearRoundTimers();
        world().classList.remove("is-cinema");
        ui.clearBanner();
        ui.setDanger(false);
        sound.setIntensity(0);
        ui.setEvent(true);
        $("duel-wait-title").textContent = "Conexão caiu";
        for (const id of ["duel-count", "btn-duel-ready", "duel-share"]) $(id).hidden = true;
        renderPosters();
        $("duel-share").hidden = true;
        ui.showOverlay("duelWait");
      }
      const who = state.conn ? `${state.peer.name} caiu.` : "Sua conexão caiu.";
      $("duel-wait-status").textContent = `${who} Esperando reconectar… ${clock(left)}`;
    }

    /** The other player is back: continue where the match stopped. */
    function resume() {
      const before = state.paused.phase;
      state.paused = null;
      status(`${state.peer.name} voltou!`);
      if (before === "waiting") {
        state.phase = "waiting";
        $("btn-duel-ready").hidden = false;
        return;
      }
      state.phase = "result"; // between rounds: the host sends what comes next
      ui.hide();
      if (isHost()) later(() => (state.roundNo ? hostNextRound(true) : startMatch()), 1200);
    }

    // ── Stage: the duel street, the two heroes and the scoreboard ───────
    /** Undoes any page scroll left by the phone keyboard (the layout is fixed to the viewport). */
    function resetScroll() {
      const reset = () => {
        root.scrollTo(0, 0);
        if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
      };
      reset();
      setTimeout(reset, 120); // again once the keyboard has finished closing
    }

    function enterStage() {
      resetScroll();
      $("app").classList.add("is-duel");
      ambient.setScene(NS.ambient.DUEL_SCENE.id);
      ambient.follow(!isHost()); // the room creator's weather is everyone's weather
      me.setVariant(state.hero);
      me.reset();
      rival.reset();
      rivalEl.hidden = true;
      $("tag-me").textContent = state.name;
      $("tag-me").hidden = false;
      sound.setMood(null);
      sound.startMusic();
    }

    function showRival() {
      rival.setVariant(state.peer.hero);
      rivalEl.hidden = false;
      $("tag-rival").textContent = state.peer.name;
      $("tag-rival").hidden = false;
    }

    function leaveStage() {
      $("app").classList.remove("is-duel", "is-event");
      for (const id of ["tag-me", "tag-rival", "podium"]) $(id).hidden = true;
      rivalEl.hidden = true;
      offPodium();
      world().classList.remove("is-cinema");
      me.reset();
      rival.reset();
      ambient.follow(false);
      ambient.setScene(NS.ambient.SCENES[0].id);
      ui.setDanger(false);
      ui.clearBanner();
      sound.setIntensity(0);
    }

    /** Back to the duel positions after a victory scene. */
    function offPodium() {
      for (const el of [$("hero"), rivalEl, $("tag-me"), $("tag-rival")]) {
        el.style.transition = "";
        el.style.translate = "";
        el.classList.remove("is-champion");
      }
      $("podium").classList.remove("is-wide");
      me.celebrate(false);
      rival.celebrate(false);
      $("podium").hidden = true;
      $("flagpole").hidden = true;
      $("duel-curtain").hidden = true;
    }

    function renderHud() {
      const hearts = (n) => `❤ ${n}`;
      $("duel-hud-me").textContent = state.name;
      $("duel-hud-rival").textContent = state.peer ? state.peer.name : "";
      $("duel-lives-me").textContent = hearts(state.lives[myRole()]);
      $("duel-lives-rival").textContent = hearts(state.lives[rivalRole()]);
      $("duel-round").textContent = state.roundNo ? `Round ${state.roundNo}` : "";
    }

    // ── Match ───────────────────────────────────────────────────────────
    /** Host: (re)starts a match with full lives. */
    function startMatch() {
      if (!isHost() || !state.peer) return;
      send("start", { countdown: DUEL.COUNTDOWN, lives: state.maxLives, sky: sky() });
      beginCountdown(DUEL.COUNTDOWN, state.maxLives);
    }

    function beginCountdown(seconds, lives) {
      clearRoundTimers();
      Object.assign(state, {
        phase: "countdown",
        maxLives: lives,
        lives: { host: lives, guest: lives },
        roundNo: 0,
        round: null,
        wins: { host: 0, guest: 0 },
        rematch: { host: false, guest: false },
        specialDone: false,
        log: [],
        startedAt: Date.now(),
      });
      offPodium();
      me.reset();
      rival.reset();
      showRival();
      $("btn-duel-ready").hidden = true;
      sound.startMusic(); // the victory scene stopped it (rematch)
      renderHud();
      renderPosters();
      $("duel-wait-title").textContent = "Preparem-se!";
      ui.showOverlay("duelWait");
      const count = $("duel-count");
      count.hidden = false;
      let left = seconds;
      const show = () => {
        count.textContent = String(left);
        count.classList.remove("is-tick");
        void count.offsetWidth;
        count.classList.add("is-tick");
        sound.play("tick");
      };
      show();
      const ticker = every(() => {
        left -= 1;
        if (left > 0) return show();
        cancel(ticker);
        count.hidden = true;
        ui.hide();
        ui.setEvent(true);
        ui.banner("SAQUE!", "boss");
        sound.play("draw");
        roundTimers.push(later(() => ui.clearBanner(), 900));
        if (isHost()) roundTimers.push(later(() => hostNextRound(), 1100));
      }, 1000);
      roundTimers.push(ticker); // a pause stops the countdown
    }

    // ── Rounds ──────────────────────────────────────────────────────────
    let roundTimers = [];
    function clearRoundTimers() {
      roundTimers.forEach(cancel);
      roundTimers = [];
    }

    function nextQuestionId() {
      if (testHooks.firstQuestionId && state.roundNo === 0) return testHooks.firstQuestionId; // fixed shot for the link preview
      if (state.deck.length === 0) state.deck = Q.buildDeck(questions, config, { lastId: state.lastId });
      state.lastId = state.deck.shift();
      return state.lastId;
    }

    /**
     * Host: picks a question and an option order, and opens the round for both.
     * With `replay`, the interrupted round starts over (after a reconnection).
     */
    function hostNextRound(replay = false) {
      if (state.phase === "closed" || state.paused) return;
      const question = replay && state.round ? state.round.question : byId.get(nextQuestionId());
      const order = Q.shuffle(question.options.map((_, i) => i));
      const n = replay ? state.roundNo : state.roundNo + 1;
      const level = D.levelForRound(n, DUEL);
      const seconds = Math.round(R.travelSeconds(question, level, config));
      // Lives and wins go along so a player who missed a message is back in sync.
      const round = { n, qid: question.id, order, seconds, lives: state.lives, wins: state.wins, sky: sky() };
      send("round", round);
      beginRound({ ...round, question });
    }

    /** "ROUND N" presentation (drum hit, question hidden), then the question. */
    function beginRound({ n, question, order, seconds, lives, wins }) {
      clearRoundTimers();
      const valid = Array.isArray(order) && order.length === question.options.length && order.every((i) => question.options[i] !== undefined);
      const indexes = valid ? order : question.options.map((_, i) => i);
      const correct = Q.correctIndexes(question);
      const shown = indexes.map((i) => ({ text: question.options[i], correct: correct.includes(i) }));
      state.phase = "intro";
      state.roundNo = n;
      if (pair(lives)) state.lives = pair(lives);
      if (pair(wins)) state.wins = pair(wins);
      state.round = { n, question, shown, seconds, started: 0, mine: null, picked: new Set(), answers: {}, decided: false, grace: 0 };
      renderHud();
      me.reset();
      rival.reset();
      ui.hide();
      ui.setEvent(true);
      ui.setDanger(false);
      ui.banner(`ROUND ${n}`, "round");
      sound.play("drum");
      roundTimers.push(later(() => revealRound(state.round), DUEL.ROUND_INTRO_MS));
    }

    const world = () => field.closest(".world");

    function revealRound(round) {
      if (state.phase !== "intro" || state.round !== round) return;
      state.phase = "round";
      round.started = performance.now();
      ui.clearBanner();
      ui.setEvent(false);
      ui.renderQuestion(round.question, round.shown);
      ui.setLock(0);
      ui.setPanelOpen(true);
      ui.setPanelProgress(1);
      const seconds = round.seconds;
      const tick = () => {
        const left = Math.max(0, round.seconds - (performance.now() - round.started) / 1000);
        ui.setTimer(false, left);
        const fraction = left / round.seconds;
        ui.setDanger(fraction < 0.25);
        sound.setIntensity(1 - fraction);
        if (left === 0 && !round.mine) {
          ui.lockAnswers();
          round.mine = { correct: false, ms: Infinity, timedOut: true };
        }
      };
      tick();
      roundTimers.push(every(tick, 200));
      if (isHost()) roundTimers.push(later(() => hostDecide({ timedOut: true }), seconds * 1000 + DUEL.TIMEOUT_GRACE_MS));
    }

    /** The player taps an option. */
    function answer(index) {
      const round = state.round;
      if (state.phase !== "round" || !round || round.mine) return;
      const option = round.shown[index];
      if (!option || round.picked.has(index)) return;
      const needed = R.answersNeeded(round.question);
      if (option.correct && round.picked.size + 1 < needed) {
        // "Choose two": the first right pick only counts once the second one is in.
        round.picked.add(index);
        ui.pickOption(index);
        ui.setPicked(round.picked.size, needed);
        sound.play("unlock");
        ui.announce("Certo! Marque a outra alternativa.");
        return;
      }
      if (option.correct) ui.setPicked(needed, needed);
      const ms = Math.round(performance.now() - round.started);
      round.mine = { correct: option.correct, ms, pick: option.text };
      ui.lockAnswers();
      if (option.correct) {
        ui.markRight(index);
        ui.announce("Resposta enviada!");
      } else {
        ui.eliminate(index);
        sound.play("miss");
        fx.balloon("Errou! Travado até o fim do round", calloutY(), "lock");
        ui.announce("Errou! Você está travado até o fim do round.");
      }
      send("answer", { n: round.n, correct: option.correct, ms });
      if (isHost()) hostAnswer("host", { correct: option.correct, ms });
    }

    /** Host: records an answer and decides the round when possible. */
    function hostAnswer(role, data) {
      const round = state.round;
      if (!round || round.decided || round.answers[role]) return;
      round.answers[role] = data;
      if (data.correct && !round.grace) {
        round.grace = later(() => hostDecide({ graceOver: true }), DUEL.GRACE_MS);
        roundTimers.push(round.grace);
      }
      hostDecide();
    }

    function hostDecide(flags = {}) {
      const round = state.round;
      if (!round || round.decided || state.phase !== "round") return;
      const result = D.decideRound(round.answers, flags);
      if (!result) return;
      round.decided = true;
      const special = D.isSpecialHit(round.n, result, round.answers, state.specialDone, DUEL);
      const msg = { n: round.n, result, lives: D.applyResult(state.lives, result), answers: round.answers, special };
      send("result", msg);
      showResult(msg);
    }

    // ── Results ─────────────────────────────────────────────────────────
    const geo = () => {
      const width = field.clientWidth;
      const ground = field.querySelector(".ground").offsetHeight;
      const heroTop = field.clientHeight - ground - NS.hero.HEIGHT;
      const left = Math.max(8, width * 0.035);
      return { width, heroTop, myX: left + NS.hero.MUZZLE.x, rivalX: width - left - NS.hero.MUZZLE.x, myCenter: left + NS.hero.WIDTH / 2, rivalCenter: width - left - NS.hero.WIDTH / 2 };
    };
    const calloutY = () => Math.max(8, geo().heroTop - 52);

    function taunt(role, text) {
      const g = geo();
      const sign = document.createElement("div");
      sign.className = `taunt ${role === myRole() ? "is-left" : "is-right"}`;
      sign.style.top = `${Math.max(4, g.heroTop - 64)}px`;
      sign.textContent = text;
      $("fx").appendChild(sign);
      later(() => sign.remove(), 2300);
    }

    function showResult(msg) {
      const round = state.round;
      const { result } = msg;
      state.phase = "result";
      clearRoundTimers();
      state.lives = pair(msg.lives) || state.lives;
      const answers = msg.answers || {};
      if (result.winner) state.wins[result.winner] += 1;

      // Report entry from this player's side.
      const q = round.question;
      const mine = answers[myRole()];
      state.log.push({
        id: q.id,
        q: q.q,
        topic: q.topic,
        answer: Q.answerText(q),
        explanation: q.explanation,
        wrongPicks: round.mine && round.mine.pick && !round.mine.correct ? [round.mine.pick] : [],
        outcome: D.outcomeFor(myRole(), answers, result),
        seconds: mine && Number.isFinite(mine.ms) ? Math.round(mine.ms / 1000) : round.seconds,
      });

      ui.lockAnswers();
      ui.setDanger(false);
      sound.setIntensity(0);
      round.shown.forEach((o, i) => o.correct && ui.markRight(i));

      const g = geo();
      const centerOf = (role) => (role === myRole() ? g.myCenter : g.rivalCenter);
      const heroOf = (role) => (role === myRole() ? me : rival);
      if (msg.special) state.specialDone = true;
      if (result.reason === "hit" && msg.special) {
        specialMove(result.winner);
        const target = D.other(result.winner);
        ui.announce(result.winner === myRole() ? `Golpe especial! ${nameOf(target)} foi ao chão e perdeu uma vida.` : `Golpe especial de ${nameOf(result.winner)}! Você perdeu uma vida.`);
      } else if (result.reason === "hit") {
        const shooter = result.winner;
        const target = D.other(shooter);
        const fromX = shooter === myRole() ? g.myX : g.rivalX;
        const toX = target === myRole() ? g.myCenter : g.rivalCenter;
        const y = g.heroTop + NS.hero.MUZZLE.y - 4;
        heroOf(shooter).recoil();
        fx.muzzle(fromX, y + 4);
        fx.shot(fromX, y, toX, y, config.SHOT_MS, "laser");
        sound.play("bang");
        later(() => {
          heroOf(target).flinch();
          fx.popText(centerOf(target), g.heroTop - 6, "AI!", "pop-attack");
          sound.play("ouch");
          taunt(shooter, R.gendered(D.pick(D.TAUNTS), isFemale(shooter)));
          later(() => sound.play("laugh"), 250);
        }, config.SHOT_MS);
        ui.announce(shooter === myRole() ? `Você acertou primeiro! ${nameOf(target)} perdeu uma vida.` : `${nameOf(shooter)} acertou primeiro. Você perdeu uma vida.`);
      } else {
        for (const role of D.ROLES) {
          heroOf(role).flinch();
          fx.popText(centerOf(role), g.heroTop - 6, "AI!", "pop-attack");
        }
        sound.play("ouch");
        const text = result.reason === "timeout" ? "Tempo esgotado! Os dois perdem uma vida." : "Os dois erraram! Os dois perdem uma vida.";
        fx.balloon(result.reason === "timeout" ? "Tempo esgotado!" : "Os dois erraram!", calloutY(), "clock");
        ui.announce(text);
      }
      renderHud();

      if (isHost()) {
        later(() => {
          const winner = D.matchWinner(state.lives);
          if (winner) {
            send("over", { winner });
            endMatch(winner);
          } else hostNextRound();
        }, msg.special ? DUEL.SPECIAL_MS : DUEL.RESULT_MS);
      }
    }

    /**
     * Special move (once per match, rounds SPECIAL_FROM to SPECIAL_TO), played like a
     * film: the question goes away, black bars close in, and instead of
     * shooting, the faster player runs to the other one and strikes with a
     * cartoon knife; the other falls to the ground, the striker runs back
     * laughing, and the fallen one gets up again.
     */
    const SPECIAL = Object.freeze({ run: 900, strike: 2300, fall: 2750, back: 4000, home: 5300, up: 6100, end: 6800 });

    function specialMove(striker) {
      const g = geo();
      const mine = striker === myRole();
      const runner = mine ? { el: $("hero"), tag: $("tag-me") } : { el: rivalEl, tag: $("tag-rival") };
      const victim = mine ? rival : me;
      const from = mine ? g.myCenter : g.rivalCenter;
      const to = mine ? g.rivalCenter : g.myCenter;
      const reach = to - from - Math.sign(to - from) * NS.hero.WIDTH * 0.75;
      const run = (x, ms) => {
        for (const el of [runner.el, runner.tag]) {
          el.style.transition = `translate ${ms}ms ease-in-out`;
          el.style.translate = `${x}px 0`;
        }
      };
      ui.setEvent(true); // only the scene: the question goes away
      world().classList.add("is-cinema");
      ui.banner("⚔️ GOLPE ESPECIAL!", "boss");
      sound.play("drum");
      later(() => {
        ui.clearBanner();
        runner.el.classList.add("is-running");
        run(reach, SPECIAL.strike - SPECIAL.run);
      }, SPECIAL.run);
      later(() => {
        runner.el.classList.remove("is-running");
        runner.el.classList.add("is-stabbing");
        sound.play("slash");
        ambient.flash();
        fx.popText(to, g.heroTop - 6, "ZÁS!", "pop-attack");
      }, SPECIAL.strike);
      later(() => {
        victim.setFate("fallen");
        sound.play("ouch");
        sound.play("stomp");
        field.classList.remove("is-shaking");
        void field.offsetWidth;
        field.classList.add("is-shaking");
        fx.popText(to, g.heroTop + 10, "AI!", "pop-attack");
      }, SPECIAL.fall);
      later(() => {
        runner.el.classList.remove("is-stabbing");
        runner.el.classList.add("is-running");
        run(0, SPECIAL.home - SPECIAL.back);
        taunt(striker, R.gendered(D.pick(D.TAUNTS), isFemale(striker)));
        sound.play("laugh");
      }, SPECIAL.back);
      later(() => {
        runner.el.classList.remove("is-running");
        for (const el of [runner.el, runner.tag]) {
          el.style.transition = "";
          el.style.translate = "";
        }
      }, SPECIAL.home);
      later(() => victim.reset(), SPECIAL.up); // back on its feet
      later(() => world().classList.remove("is-cinema"), SPECIAL.end);
    }

    // ── End of a match ──────────────────────────────────────────────────
    /** Big line for the curtain and the end card: "WILK VENCEU!" or "WILK E JOSE EMPATARAM!". */
    const outcomeTitle = (winner) =>
      winner === "draw" ? `${state.name} e ${nameOf(rivalRole())} empataram!`.toUpperCase() : `${nameOf(winner).toUpperCase()} VENCEU!`;

    /** winner: "host" | "guest" | "draw" */
    function endMatch(winner) {
      if (state.phase === "victory" || state.phase === "over" || state.phase === "closed") return;
      clearRoundTimers();
      state.phase = "victory";
      const draw = winner === "draw";
      if (!draw) state.score[winner] += 1;
      const won = draw ? null : winner === myRole();
      ui.setEvent(true);
      ui.setDanger(false);
      sound.setIntensity(0);
      sound.stopMusic();
      saveReport(won);

      // The winner (both, in a draw) puts the weapon away, walks to the podium
      // beside the flag and jumps for joy. Then the screen darkens with the result.
      const g = geo();
      const mine = { el: $("hero"), tag: $("tag-me"), hero: me, from: g.myCenter };
      const theirs = { el: rivalEl, tag: $("tag-rival"), hero: rival, from: g.rivalCenter };
      const climbers = draw
        ? [{ ...mine, to: g.width / 2 - 42 }, { ...theirs, to: g.width / 2 + 42 }]
        : [{ ...(won ? mine : theirs), to: g.width / 2 }];
      if (!draw) {
        // The loser drops to the knees, then falls to the ground.
        const loser = won ? rival : me;
        loser.setFate("kneel");
        later(() => loser.setFate("fallen"), 1100);
      }
      $("podium").classList.toggle("is-wide", draw);
      for (const c of climbers) {
        c.hero.celebrate(true);
        for (const el of [c.el, c.tag]) {
          el.style.transition = "translate 1.6s ease-in-out";
          el.style.translate = `${c.to - c.from}px 0`;
        }
      }
      later(() => {
        $("podium").hidden = false;
        $("flagpole").innerHTML = FLAGPOLE;
        $("flagpole").hidden = false;
        for (const c of climbers) {
          for (const el of [c.el, c.tag]) el.style.translate = `${c.to - c.from}px -34px`;
          c.el.classList.add("is-champion");
        }
        fx.confetti(g.width / 2, g.heroTop - 20, config.CONFETTI_COUNT * 2);
        sound.play(won === false ? "defeat" : "fanfare");
      }, 1700);
      const line = draw ? "Empate! Os dois são fortes!" : R.gendered(D.pick(D.VICTORY_LINES), isFemale(winner));
      later(() => fx.balloon(line, Math.max(8, g.heroTop - 110), "trophy"), 2600);
      later(() => fx.confetti(g.width / 2, g.heroTop - 20, config.CONFETTI_COUNT), 4600);
      later(() => showCurtain(winner), DUEL.VICTORY_MS);
    }

    /** The screen fades to dark and the result appears, like GAME OVER; a tap (or time) shows the end card. */
    function showCurtain(winner) {
      if (state.phase !== "victory") return;
      $("duel-curtain-title").textContent = outcomeTitle(winner);
      $("duel-curtain").hidden = false;
      state.curtainFor = winner;
      later(() => showEndCard(winner), DUEL.CURTAIN_MS);
    }

    function saveReport(won) {
      const t = Date.now();
      const correct = state.log.filter((e) => e.outcome === "first").length;
      const misses = state.log.filter((e) => e.outcome === "lost").length;
      const answered = correct + misses;
      const report = {
        t,
        mode: "duel",
        modeLabel: "Duelo",
        hero: state.hero,
        score: state.wins[myRole()] * 10, // 10 points per round won
        correct,
        misses,
        accuracy: answered ? Math.round((correct / answered) * 100) : 0,
        level: D.levelForRound(state.roundNo, DUEL),
        maxStreak: 0,
        seconds: Math.round((Date.now() - state.startedAt) / 1000),
        log: state.log.slice(),
        duel: {
          opponent: nameOf(rivalRole()),
          won,
          rounds: { me: state.wins[myRole()], rival: state.wins[rivalRole()] },
          lives: { me: state.lives[myRole()], rival: state.lives[rivalRole()] },
          score: { me: state.score[myRole()], rival: state.score[rivalRole()] },
        },
      };
      store.addHistory({ t, mode: "duel", score: report.score, correct, level: report.level }, config.HISTORY_LIMIT);
      store.addReport(report, config.REPORTS_LIMIT);
      state.lastReport = report;
    }

    /** Versus scoreboard: both characters, their names and the matches each won in this room. */
    function renderScoreboard() {
      const board = $("duel-end-score");
      if (!state.peer || !state.hero) return board.replaceChildren();
      const side = (name, hero, wins) => {
        const div = document.createElement("div");
        div.className = "vs-side";
        div.innerHTML =
          `<span class="vs-art">${NS.hero.artFor(hero)}</span><span class="vs-name"></span>` +
          `<span class="vs-wins">${NS.icons.icon("trophy", { size: 20, fill: "#fbd51a", className: "icon-trophy" })} <b>${wins}</b></span>`;
        div.querySelector(".vs-name").textContent = name;
        return div;
      };
      const x = Object.assign(document.createElement("span"), { className: "vs-x", textContent: "×" });
      board.replaceChildren(side(state.name, state.hero, state.score[myRole()]), x, side(state.peer.name, state.peer.hero, state.score[rivalRole()]));
    }

    function showEndCard(winner) {
      if (state.phase !== "victory") return;
      state.phase = "over";
      $("duel-curtain").hidden = true;
      ui.clearBanner();
      const d = state.lastReport.duel;
      $("duel-end-title").textContent = `${winner === "draw" ? "🤝" : "🏆"} ${outcomeTitle(winner)}`;
      $("duel-end-sub").textContent =
        d.won === null
          ? "Empate! Ninguém leva o troféu desta vez. Bora revanche?"
          : d.won
            ? `Você venceu o duelo contra ${d.opponent}! Seu relatório está pronto.`
            : `${d.opponent} venceu desta vez. Bora revanche?`;
      renderScoreboard();
      $("duel-end-details").textContent = `Rounds ganhos ${d.rounds.me} × ${d.rounds.rival} · vidas no fim ${d.lives.me} × ${d.lives.rival}`;
      $("duel-end-status").textContent = state.rematch[rivalRole()] ? `${d.opponent} quer revanche!` : "";
      $("btn-duel-rematch").disabled = false;
      ui.showOverlay("duelEnd");
    }

    function askRematch() {
      if (state.phase !== "over" || state.rematch[myRole()]) return;
      state.rematch[myRole()] = true;
      send("rematch");
      $("btn-duel-rematch").disabled = true;
      status(state.rematch[rivalRole()] ? "Revanche aceita!" : `Esperando ${nameOf(rivalRole())} aceitar a revanche…`);
      if (isHost() && state.rematch.guest) startMatch();
    }

    // ── Leaving ─────────────────────────────────────────────────────────
    /** Ends the room for this player. With `reason`, the room ended by itself (rival left, expired). */
    function close(reason = "") {
      if (state.phase === "off" || state.phase === "closed") return;
      const wasPlaying = ["countdown", "intro", "round", "result", "victory", "paused"].includes(state.phase);
      state.paused = null;
      clearTimers();
      clearRoundTimers();
      state.phase = "closed";
      if (state.conn) {
        if (!reason) send("bye");
        const conn = state.conn;
        state.conn = null;
        setTimeout(() => conn.close(), 200); // let "bye" leave first
      }
      if (!reason) return exit();
      // The room ended on its own: say why, keep the report buttons if a match was played.
      ui.setEvent(true);
      ui.clearBanner();
      $("duel-curtain").hidden = true;
      $("duel-end-title").textContent = wasPlaying ? "🤠 Duelo interrompido" : "🤠 Sala encerrada";
      $("duel-end-sub").textContent = reason;
      renderScoreboard();
      $("duel-end-details").textContent = "";
      $("duel-end-status").textContent = "";
      $("btn-duel-rematch").disabled = true;
      for (const id of ["btn-duel-areas", "btn-duel-pdf", "btn-duel-md"]) $(id).disabled = !state.lastReport;
      ui.showOverlay("duelEnd");
    }

    function exit() {
      leaveStage();
      state = { ...fresh(), lastReport: state.lastReport };
      state.phase = "off";
      if (/^#duelo=/.test(root.location.hash)) root.history.replaceState(null, "", root.location.pathname + root.location.search);
      onExit();
    }

    function leave() {
      if (state.phase === "closed") return exit();
      close();
    }

    // ── Wiring ──────────────────────────────────────────────────────────
    $("duel-howto-toggle").addEventListener("click", () => setRulesOpen($("duel-rules").hidden));
    $("duel-name").addEventListener("input", updateGo);
    // iOS scrolls the page up for the keyboard and may leave it there: put it back.
    $("duel-name").addEventListener("blur", resetScroll);
    document.querySelectorAll('input[name="duel-hero"]').forEach((input) => input.addEventListener("change", updateGo));
    $("btn-duel-go").addEventListener("click", go);
    $("duel-name").addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !$("btn-duel-go").disabled) go();
    });
    $("btn-duel-back").addEventListener("click", () => {
      state.phase = "off";
      exit();
    });
    $("btn-duel-cancel").addEventListener("click", leave);
    $("btn-duel-ready").addEventListener("click", markReady);
    $("duel-curtain").addEventListener("click", () => state.curtainFor && showEndCard(state.curtainFor));
    // "Início" on the end card: remind to download the report first, like the solo Game Over.
    $("btn-duel-leave").addEventListener("click", () => (state.lastReport ? ui.askLeave("duelEnd") : leave()));
    $("btn-duel-rematch").addEventListener("click", askRematch);
    for (const [id, kind] of [["btn-duel-areas", "areas"], ["btn-duel-pdf", "pdf"], ["btn-duel-md", "md"]]) {
      $(id).addEventListener("click", () => state.lastReport && onReport(kind, state.lastReport));
    }
    $("btn-duel-copy").addEventListener("click", () => deps.copy($("duel-link").value, $("btn-duel-copy")));
    $("btn-duel-share").addEventListener("click", () =>
      deps.share({ title: "Duelo no AWS Cloud Quest", text: `${state.name} te chamou para um duelo de AWS! Entre pelo link:`, url: $("duel-link").value }, $("btn-duel-share"))
    );
    // Leaving the page tells the other player right away.
    root.addEventListener("pagehide", () => state.conn && send("bye"));

    return Object.freeze({
      openSetup,
      answer,
      leave,
      /** True while a duel screen or match is on. */
      active: () => state.phase !== "off",
      playing: () => state.phase === "round",
      lastReport: () => state.lastReport,
      /** Read-only view for tests and debugging. */
      snapshot: () => ({
        phase: state.phase,
        role: state.role,
        room: state.room,
        name: state.name,
        peer: state.peer ? { name: state.peer.name, hero: state.peer.hero } : null,
        lives: { ...state.lives },
        paused: Boolean(state.paused),
        maxLives: state.maxLives,
        round: state.roundNo,
        wins: { ...state.wins },
        score: { ...state.score },
        questionId: state.round ? state.round.question.id : null,
        specialDone: state.specialDone,
        locked: Boolean(state.round && state.round.mine),
      }),
    });
  }

  NS.duel = Object.freeze({ create, bankKey });
})(typeof window !== "undefined" ? window : globalThis);
