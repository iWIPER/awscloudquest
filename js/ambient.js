/**
 * AWS Cloud Quest — ambience: day/night cycle, rain with thunder, birds
 * crossing the sky, bunnies and squirrels hopping along the ground, and
 * crickets at night, each with its matching sound.
 *
 * Purely decorative: it never touches game rules. It is driven by the main
 * loop through update(dt) in every phase, so the world keeps living on the
 * start and Game Over screens too. Timings are in CONFIG (AMBIENT_*).
 */
(function (root) {
  "use strict";

  const BIRD_SVG =
    '<svg viewBox="0 0 20 10" aria-hidden="true"><path class="bird-wing" d="M1 6Q5 1 10 6Q15 1 19 6" ' +
    'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

  // Small ground critters. Both face right: they always run left → right,
  // away from the hero, so they never look like a threat.
  const CRITTERS = {
    bunny:
      '<svg viewBox="0 0 28 22" aria-hidden="true">' +
      '<ellipse cx="8" cy="5" rx="2.2" ry="5.5" transform="rotate(-18 8 5)" fill="#f4eee8"/>' +
      '<ellipse cx="12" cy="5" rx="2.2" ry="5.5" transform="rotate(8 12 5)" fill="#f4eee8"/>' +
      '<ellipse cx="12" cy="5.5" rx="1" ry="3.6" transform="rotate(8 12 5.5)" fill="#ffb3d1"/>' +
      '<ellipse cx="13" cy="15" rx="9" ry="6.5" fill="#f4eee8"/>' +
      '<circle cx="20" cy="11" r="5" fill="#f4eee8"/>' +
      '<circle cx="4.5" cy="14" r="2.6" fill="#fff"/>' +
      '<circle cx="21.5" cy="10" r="1" fill="#3a1459"/>' +
      '<circle cx="24.6" cy="12" r="1" fill="#ff8fd0"/>' +
      '<ellipse cx="18" cy="21" rx="3" ry="1.2" fill="#d9cfc6"/>' +
      "</svg>",
    squirrel:
      '<svg viewBox="0 0 28 22" aria-hidden="true">' +
      '<path d="M9 17C2 17 0 9 4 4C6 1 10 2 9 6C8 9 4 9 6 13Z" fill="#b8642c"/>' +
      '<path d="M8 6C7 9 5 10 6 12" stroke="#d98a4a" stroke-width="1.4" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="14" cy="15.5" rx="6.5" ry="5" fill="#c97436"/>' +
      '<circle cx="20" cy="11.5" r="4.2" fill="#c97436"/>' +
      '<path d="M18.5 7.5l1-3 1.6 2.8z" fill="#c97436"/>' +
      '<ellipse cx="15" cy="17" rx="3.4" ry="2.4" fill="#f0c9a0"/>' +
      '<circle cx="21.4" cy="10.6" r="0.95" fill="#3a1459"/>' +
      '<circle cx="24" cy="12.3" r="0.8" fill="#3a1459"/>' +
      "</svg>",
  };

  // More passers-by, one set per scenery (all face right and move left → right).
  Object.assign(CRITTERS, {
    deer:
      '<svg viewBox="0 0 34 30" aria-hidden="true">' +
      '<path d="M25 6l2-5M25 6l4-3M27 7l4 0M25 6l-1-5" stroke="#7a4a22" stroke-width="1.4" stroke-linecap="round"/>' +
      '<rect x="8" y="20" width="2.6" height="9" rx="1" fill="#8b5a2b"/><rect x="13" y="20" width="2.6" height="9" rx="1" fill="#8b5a2b"/>' +
      '<rect x="20" y="20" width="2.6" height="9" rx="1" fill="#8b5a2b"/><rect x="24" y="20" width="2.6" height="9" rx="1" fill="#8b5a2b"/>' +
      '<ellipse cx="17" cy="17" rx="11" ry="6" fill="#b5763b"/><circle cx="12" cy="16" r="1.3" fill="#f4e3c8"/><circle cx="16" cy="14" r="1.1" fill="#f4e3c8"/>' +
      '<path d="M24 15L27 8" stroke="#b5763b" stroke-width="4" stroke-linecap="round"/>' +
      '<ellipse cx="29" cy="8.5" rx="3.6" ry="2.6" fill="#b5763b"/><circle cx="29.6" cy="7.8" r=".7" fill="#1f1a24"/>' +
      '<path d="M6 15l-2-2" stroke="#f4e3c8" stroke-width="2" stroke-linecap="round"/>' +
      "</svg>",
    camel:
      '<svg viewBox="0 0 40 30" aria-hidden="true">' +
      '<rect x="9" y="19" width="2.6" height="10" rx="1" fill="#b98a4e"/><rect x="14" y="19" width="2.6" height="10" rx="1" fill="#b98a4e"/>' +
      '<rect x="23" y="19" width="2.6" height="10" rx="1" fill="#b98a4e"/><rect x="28" y="19" width="2.6" height="10" rx="1" fill="#b98a4e"/>' +
      '<path d="M7 20Q8 12 13 13Q15 6 19 11Q22 5 26 12Q30 13 31 20Z" fill="#d9a85f"/>' +
      '<path d="M30 17Q33 10 35 8" stroke="#d9a85f" stroke-width="4" stroke-linecap="round" fill="none"/>' +
      '<ellipse cx="36.5" cy="7.5" rx="3.2" ry="2.3" fill="#d9a85f"/><circle cx="37" cy="6.8" r=".7" fill="#1f1a24"/>' +
      '<path d="M7 19q-3 1-3 4" stroke="#b98a4e" stroke-width="1.3" fill="none"/>' +
      "</svg>",
    tumbleweed:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="10" fill="none" stroke="#a8743c" stroke-width="2"/>' +
      '<path d="M4 9Q12 3 20 10M3 14Q11 21 21 13M8 4Q14 12 9 21M15 3Q10 12 17 20M5 18Q12 10 19 6" stroke="#c08a4a" stroke-width="1.4" fill="none"/>' +
      "</svg>",
    car:
      '<svg viewBox="0 0 44 22" aria-hidden="true">' +
      '<path d="M3 15V11Q3 9 6 9H12L17 3H30L36 9H40Q42 9 42 12V15Z" fill="#e8272d"/>' +
      '<path d="M18 4.5H24V9H14.5ZM25.5 4.5H29.5L34 9H25.5Z" fill="#bfe3f7"/>' +
      '<rect x="38" y="10" width="3" height="2" rx="1" fill="#fbd51a"/>' +
      '<circle cx="12" cy="16" r="4.2" fill="#2a1a3a"/><circle cx="12" cy="16" r="1.6" fill="#b9b3c2"/>' +
      '<circle cx="33" cy="16" r="4.2" fill="#2a1a3a"/><circle cx="33" cy="16" r="1.6" fill="#b9b3c2"/>' +
      "</svg>",
    taxi:
      '<svg viewBox="0 0 44 22" aria-hidden="true">' +
      '<path d="M3 15V11Q3 9 6 9H12L17 3H30L36 9H40Q42 9 42 12V15Z" fill="#fbd51a"/>' +
      '<path d="M18 4.5H24V9H14.5ZM25.5 4.5H29.5L34 9H25.5Z" fill="#bfe3f7"/>' +
      '<rect x="38" y="10" width="3" height="2" rx="1" fill="#fbd51a"/>' +
      '<circle cx="12" cy="16" r="4.2" fill="#2a1a3a"/><circle cx="12" cy="16" r="1.6" fill="#b9b3c2"/>' +
      '<circle cx="33" cy="16" r="4.2" fill="#2a1a3a"/><circle cx="33" cy="16" r="1.6" fill="#b9b3c2"/>' +
      "</svg>".replace("</svg>", '<rect x="20" y="0.5" width="8" height="3" rx="1" fill="#2a1a3a"/></svg>'),
    van:
      '<svg viewBox="0 0 44 22" aria-hidden="true">' +
      '<path d="M3 15V11Q3 9 6 9H12L17 3H30L36 9H40Q42 9 42 12V15Z" fill="#2b9fdc"/>' +
      '<path d="M18 4.5H24V9H14.5ZM25.5 4.5H29.5L34 9H25.5Z" fill="#d8f0ff"/>' +
      '<rect x="38" y="10" width="3" height="2" rx="1" fill="#fbd51a"/>' +
      '<circle cx="12" cy="16" r="4.2" fill="#2a1a3a"/><circle cx="12" cy="16" r="1.6" fill="#b9b3c2"/>' +
      '<circle cx="33" cy="16" r="4.2" fill="#2a1a3a"/><circle cx="33" cy="16" r="1.6" fill="#b9b3c2"/>' +
      "</svg>",
    bus:
      '<svg viewBox="0 0 70 26" aria-hidden="true">' +
      '<rect x="2" y="2" width="66" height="18" rx="4" fill="#3f9a2c"/>' +
      '<path d="M8 6h9v6H8zM21 6h9v6h-9zM34 6h9v6h-9zM47 6h9v6h-9z" fill="#d8f0ff"/>' +
      '<path d="M59 5h7v9h-7z" fill="#d8f0ff"/><rect x="64" y="15" width="3" height="2" rx="1" fill="#fbd51a"/>' +
      '<circle cx="15" cy="21" r="4.4" fill="#2a1a3a"/><circle cx="15" cy="21" r="1.7" fill="#b9b3c2"/>' +
      '<circle cx="54" cy="21" r="4.4" fill="#2a1a3a"/><circle cx="54" cy="21" r="1.7" fill="#b9b3c2"/>' +
      "</svg>",
  });

  /** Sceneries, in the order they appear during a game. */
  const SCENES = Object.freeze([
    { id: "field", label: "Campo", icon: "🌼", critters: ["bunny", "squirrel"] },
    { id: "forest", label: "Floresta", icon: "🌲", critters: ["deer", "squirrel"] },
    { id: "desert", label: "Deserto", icon: "🌵", critters: ["camel"] },
    // The city is an avenue: traffic comes more often (every) and also at night and in the rain (always).
    { id: "city", label: "Cidade", icon: "🏙️", critters: ["car", "taxi", "van", "bus"], every: [3, 7], always: true },
  ]);

  /** Duel street in the Wild West: never in the solo rotation, set by duel.js. */
  const DUEL_SCENE = Object.freeze({ id: "west", label: "Velho Oeste", icon: "🤠", critters: ["tumbleweed"] });

  /** Background pieces of each scenery, drawn with CSS (see .scenery in style.css). */
  function sceneryMarkup(id) {
    const repeat = (n, fn) => Array.from({ length: n }, (_, i) => fn(i)).join("");
    if (id === "forest") {
      return repeat(9, (i) => `<span class="pine" style="--x:${4 + i * 11.5}%;--s:${0.7 + ((i * 37) % 5) / 10}"></span>`);
    }
    if (id === "desert") {
      return (
        '<span class="dune dune-1"></span><span class="dune dune-2"></span>' +
        repeat(4, (i) => `<span class="cactus" style="--x:${18 + i * 22}%;--s:${0.8 + ((i * 3) % 4) / 10}"></span>`)
      );
    }
    if (id === "west") {
      // A row of false-front buildings, the saloon in the middle. "is-extra" ones hide on narrow screens.
      const shop = (sign, h, color, extra = "") =>
        `<span class="shop ${extra}" style="--h:${h}%;--c:${color}"><span class="shop-sign">${sign}</span><span class="shop-door"></span></span>`;
      return (
        '<span class="mesa mesa-1"></span><span class="mesa mesa-2"></span><span class="town">' +
        shop("XERIFE", 62, "#9b6a3c", "is-extra") +
        shop("BANCO", 74, "#7c8794") +
        '<span class="shop is-saloon" style="--h:100%;--c:#8a5a2e"><span class="shop-sign">SALOON</span><span class="saloon-doors"></span></span>' +
        shop("HOTEL", 82, "#a0523a") +
        shop("LOJA", 58, "#6f7f4a", "is-extra") +
        "</span>"
      );
    }
    if (id === "city") {
      return (
        repeat(12, (i) => `<span class="building" style="--x:${i * 8.5}%;--h:${22 + ((i * 53) % 30)}%;--w:${7 + ((i * 7) % 4)}%"></span>`) +
        '<span class="sidewalk"></span>' +
        repeat(5, (i) => `<span class="lamp" style="--x:${8 + i * 21}%"></span>`)
      );
    }
    return "";
  }

  const between = ([min, max]) => min + Math.random() * (max - min);

  /**
   * Night amount (0 = full day, 1 = full night) for a point of the cycle (0–1):
   * day → dusk (0.45–0.55) → night → dawn (0.80–0.90) → day.
   */
  function nightAmount(t) {
    if (t < 0.45) return 0;
    if (t < 0.55) return (t - 0.45) / 0.1;
    if (t < 0.8) return 1;
    if (t < 0.9) return 1 - (t - 0.8) / 0.1;
    return 0;
  }

  function create({ world, sky, critterLayer, scenery, config, sound, reducedMotion = () => false }) {
    const state = {
      t: config.AMBIENT_CYCLE_START,
      night: -1,
      rain: false,
      rainLeft: 0,
      nextRain: between(config.AMBIENT_RAIN_EVERY),
      nextBird: between(config.AMBIENT_BIRDS_EVERY),
      nextCritter: between(config.AMBIENT_CRITTERS_EVERY),
      nextThunder: between(config.AMBIENT_THUNDER_EVERY),
      nextCricket: 2,
      scene: SCENES[0],
    };

    /** Switches the scenery (background pieces, colors, passers-by and music theme). */
    function setScene(id) {
      const scene = [...SCENES, DUEL_SCENE].find((s) => s.id === id) || SCENES[0];
      state.scene = scene;
      world.dataset.scene = scene.id;
      if (scenery) scenery.innerHTML = sceneryMarkup(scene.id);
      sound.setTheme(scene.id);
      return scene;
    }

    function applyNight() {
      const night = nightAmount(state.t);
      if (Math.abs(night - state.night) < 0.005) return;
      state.night = night;
      world.style.setProperty("--night", night.toFixed(3));
      world.classList.toggle("is-night", night > 0.5);
    }

    function setRain(on) {
      state.rain = on;
      state.rainLeft = on ? between(config.AMBIENT_RAIN_LASTS) : 0;
      state.nextThunder = between(config.AMBIENT_THUNDER_EVERY);
      world.classList.toggle("is-rain", on);
      sound.setRain(on);
    }

    function spawnFlock() {
      const height = world.clientHeight;
      const width = world.clientWidth;
      const leftToRight = Math.random() < 0.5;
      const count = 1 + Math.floor(Math.random() * 3);
      const top = height * (0.04 + Math.random() * 0.22);
      const seconds = between([9, 15]);
      for (let i = 0; i < count; i++) {
        const bird = document.createElement("div");
        bird.className = "bird";
        bird.innerHTML = BIRD_SVG;
        const size = 12 + Math.random() * 6;
        bird.style.top = `${top + (i % 2) * 10 + Math.random() * 6}px`;
        bird.style.width = `${size}px`;
        bird.style.setProperty("--from", `${leftToRight ? -40 - i * 22 : width + 20 + i * 22}px`);
        bird.style.setProperty("--to", `${leftToRight ? width + 40 : -60 - i * 22}px`);
        bird.style.setProperty("--dur", `${seconds}s`);
        bird.style.setProperty("--flap", `${0.22 + Math.random() * 0.12}s`);
        sky.appendChild(bird);
        setTimeout(() => bird.remove(), seconds * 1000 + 200);
      }
      sound.play("chirp");
    }

    /** Seconds a passer-by takes to cross the field. */
    const CROSSING = { bunny: [7, 10], squirrel: [5, 7], deer: [6, 8], camel: [11, 15], car: [3.5, 5] };

    /** One passer-by of the current scenery (sometimes a pair), moving along the ground, left → right. */
    function spawnCritters(kind) {
      const options = state.scene.critters;
      const type = kind || options[Math.floor(Math.random() * options.length)];
      const width = critterLayer.clientWidth;
      const count = type !== "car" && Math.random() < 0.3 ? 2 : 1;
      const seconds = between(CROSSING[type] || [6, 9]);
      for (let i = 0; i < count; i++) {
        const critter = document.createElement("div");
        critter.className = `critter critter-${type}`;
        critter.innerHTML = CRITTERS[type];
        critter.style.setProperty("--from", `${-34 - i * 30}px`);
        critter.style.setProperty("--to", `${width + 10}px`);
        critter.style.setProperty("--dur", `${seconds}s`);
        critterLayer.appendChild(critter);
        setTimeout(() => critter.remove(), seconds * 1000 + 300);
      }
    }

    function flash() {
      if (reducedMotion()) return;
      world.classList.remove("is-lightning");
      void world.offsetWidth; // restart the flash animation
      world.classList.add("is-lightning");
    }

    /** Advances the ambience by `dt` seconds. */
    function update(dt) {
      state.t = (state.t + dt / config.AMBIENT_CYCLE_SECONDS) % 1;
      applyNight();

      if (state.rain) {
        state.nextThunder -= dt;
        if (state.nextThunder <= 0) {
          state.nextThunder = between(config.AMBIENT_THUNDER_EVERY);
          flash();
          sound.play("thunder");
        }
      }
      // A follower (the duel guest) gets its weather from set(); it never rolls its own.
      if (!state.following) {
        if (state.rain) {
          state.rainLeft -= dt;
          if (state.rainLeft <= 0) {
            setRain(false);
            state.nextRain = between(config.AMBIENT_RAIN_EVERY);
          }
        } else if ((state.nextRain -= dt) <= 0) {
          setRain(true);
        }
      }

      // Passers-by come in daylight without rain, except city traffic, which never stops.
      const daylight = state.night < 0.5 && !state.rain;
      if ((daylight || state.scene.always) && (state.nextCritter -= dt) <= 0) {
        state.nextCritter = between(state.scene.every || config.AMBIENT_CRITTERS_EVERY);
        spawnCritters();
      }
      // Birds fly in daylight without rain; crickets sing at night.
      if (daylight) {
        if ((state.nextBird -= dt) <= 0) {
          state.nextBird = between(config.AMBIENT_BIRDS_EVERY);
          spawnFlock();
        }
      } else if (state.night >= 0.5 && (state.nextCricket -= dt) <= 0) {
        state.nextCricket = between([1.5, 4]);
        sound.play("cricket");
      }
    }

    /** For tests and debugging: jump to a time of day (0–1) and/or toggle rain. */
    function set({ time, rain, bird, critter } = {}) {
      if (typeof time === "number") {
        state.t = ((time % 1) + 1) % 1;
        applyNight();
      }
      if (typeof rain === "boolean") setRain(rain);
      if (bird) spawnFlock();
      if (critter) spawnCritters(typeof critter === "string" ? critter : undefined);
    }

    /** Follow another screen's weather (true): no random rain; time and rain come from set(). */
    function follow(on) {
      state.following = on;
    }

    applyNight();
    setScene(SCENES[0].id);

    return Object.freeze({
      update,
      set,
      setScene,
      follow,
      flash,
      snapshot: () => ({ time: state.t, night: state.night, rain: state.rain, scene: state.scene.id }),
    });
  }

  const NS = (root.AwsCloudQuest = root.AwsCloudQuest || {});
  NS.ambient = Object.freeze({ create, nightAmount, SCENES, DUEL_SCENE });
})(typeof window !== "undefined" ? window : globalThis);
