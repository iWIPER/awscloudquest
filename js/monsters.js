/**
 * AWS Cloud Quest — monsters: inline SVG art, metadata and attack choreography.
 *
 * Every monster faces left (towards the hero) and is drawn in a 120×100 box
 * with its feet on the bottom edge. Animated parts carry classes used by
 * css/style.css: .m-jaw (mouth), .m-tongue (snake), .m-wing (dragon),
 * .m-arm (gorilla).
 *
 * attack(ctx) only starts the choreography; the game waits `attackMs` and
 * then moves on. `ctx` is built by game.js (see buildAttackContext there).
 */
(function (root) {
  "use strict";

  const svg = (body) => `<svg class="m-svg" viewBox="0 0 120 100" aria-hidden="true">${body}</svg>`;
  const eye = (cx, cy, r) =>
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff"/>` +
    `<circle cx="${cx - r * 0.4}" cy="${cy}" r="${r * 0.5}" fill="#2a1a3a"/>` +
    `<circle cx="${cx - r * 0.55}" cy="${cy - r * 0.2}" r="${r * 0.18}" fill="#fff"/>`;

  const DINO = svg(`
    <path d="M78 58Q104 50 118 28Q114 60 86 76Z" fill="#4e9a33"/>
    <rect x="56" y="76" width="12" height="22" rx="6" fill="#4e9a33"/>
    <rect x="76" y="74" width="12" height="24" rx="6" fill="#4e9a33"/>
    <ellipse cx="70" cy="62" rx="27" ry="23" fill="#6cc24a"/>
    <ellipse cx="64" cy="68" rx="15" ry="12" fill="#d4f2bd"/>
    <path d="M74 40l5-10 5 9 6-8 3 10 6-5v10z" fill="#f7931e"/>
    <path d="M48 64q-9 1-11 8" stroke="#4e9a33" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path class="m-jaw" d="M14 47Q30 62 54 50V44Q32 52 16 44Z" fill="#4e9a33"/>
    <path d="M10 40Q12 18 38 16Q60 16 62 34Q62 46 54 46H16Q10 46 10 40Z" fill="#6cc24a"/>
    <path d="M18 46l3 5 3-5zM28 46l3 5 3-5zM38 46l3 5 3-5z" fill="#fff"/>
    ${eye(44, 28, 7)}
    <circle cx="16" cy="32" r="1.6" fill="#2a1a3a"/>
    <ellipse cx="30" cy="38" rx="4" ry="2.5" fill="#ff8fd0" opacity=".7"/>`);

  const DRAGON = svg(`
    <path class="m-wing" d="M70 44Q76 8 108 10Q98 22 104 32Q92 30 92 42Q84 36 80 50Z" fill="#a64ca6"/>
    <path d="M88 66Q112 72 114 52L120 50 116 60Q112 82 86 78Z" fill="#c41e24"/>
    <rect x="58" y="76" width="12" height="22" rx="6" fill="#c41e24"/>
    <rect x="78" y="74" width="12" height="24" rx="6" fill="#c41e24"/>
    <ellipse cx="72" cy="62" rx="26" ry="22" fill="#e8272d"/>
    <ellipse cx="66" cy="68" rx="15" ry="12" fill="#fbd51a"/>
    <path d="M54 58Q44 46 46 36" stroke="#e8272d" stroke-width="14" stroke-linecap="round" fill="none"/>
    <path class="m-jaw" d="M10 46Q28 58 50 48V43Q30 50 12 43Z" fill="#c41e24"/>
    <path d="M8 40Q10 22 34 20Q56 20 58 34Q58 44 50 44H14Q8 44 8 40Z" fill="#e8272d"/>
    <path d="M44 22l6-12 2 13zM52 26l10-8-3 12z" fill="#fbd51a"/>
    <path d="M16 44l2.5 4 2.5-4zM26 44l2.5 4 2.5-4z" fill="#fff"/>
    ${eye(40, 31, 6)}
    <circle cx="13" cy="34" r="1.5" fill="#2a1a3a"/>`);

  const SNAKE = svg(`
    <ellipse cx="80" cy="90" rx="32" ry="10" fill="#4e9a33"/>
    <ellipse cx="80" cy="86" rx="30" ry="9" fill="#6cc24a"/>
    <ellipse cx="82" cy="74" rx="22" ry="9" fill="#4e9a33"/>
    <ellipse cx="82" cy="71" rx="20" ry="7" fill="#6cc24a"/>
    <path d="M58 86l6-6M72 90l6-8M88 90l6-8M100 86l5-6M72 74l5-6M86 76l5-6" stroke="#fbd51a" stroke-width="4" stroke-linecap="round"/>
    <path d="M110 88q8-2 8-10" stroke="#6cc24a" stroke-width="6" stroke-linecap="round" fill="none"/>
    <path d="M72 68Q60 52 44 42" stroke="#6cc24a" stroke-width="16" stroke-linecap="round" fill="none"/>
    <path d="M70 72Q59 57 46 48" stroke="#fbd51a" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path class="m-tongue" d="M16 45H5l-4-4M5 45l-4 4" stroke="#e8272d" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <ellipse cx="34" cy="40" rx="20" ry="13" fill="#6cc24a"/>
    <path class="m-jaw" d="M16 45Q30 53 46 47" stroke="#2f6b1f" stroke-width="3" stroke-linecap="round" fill="none"/>
    <circle cx="34" cy="35" r="5.5" fill="#fff"/>
    <ellipse cx="32.5" cy="35" rx="1.6" ry="3.6" fill="#2a1a3a"/>
    <circle cx="46" cy="34" r="2" fill="#fbd51a"/>
    <circle cx="42" cy="45" r="1.5" fill="#fbd51a"/>`);

  const GATOR = svg(`
    <path d="M88 70Q110 70 120 58Q114 80 88 82Z" fill="#2f7d1f"/>
    <rect x="50" y="78" width="12" height="20" rx="5" fill="#2f7d1f"/>
    <rect x="80" y="78" width="12" height="20" rx="5" fill="#2f7d1f"/>
    <ellipse cx="74" cy="72" rx="30" ry="14" fill="#3f9b4f"/>
    <ellipse cx="72" cy="78" rx="24" ry="7" fill="#cfe8a8"/>
    <path d="M56 60l4-6 4 6 4-6 4 6 4-6 4 6 4-6 4 6z" fill="#2f7d1f"/>
    <g class="m-jaw">
      <path d="M6 70Q4 78 14 78H56V68H10Z" fill="#2f7d1f"/>
      <path d="M14 68l3-4 3 4zM26 68l3-4 3 4zM38 68l3-4 3 4z" fill="#fff"/>
    </g>
    <path d="M4 62Q4 56 12 56L50 54Q62 54 62 64V68H8Q4 68 4 62Z" fill="#3f9b4f"/>
    <path d="M10 68l3 4 3-4zM20 68l3 4 3-4zM32 68l3 4 3-4zM44 68l3 4 3-4z" fill="#fff"/>
    <circle cx="48" cy="52" r="8" fill="#3f9b4f"/>
    ${eye(48, 51, 5)}
    <circle cx="8" cy="59" r="1.5" fill="#2a1a3a"/>`);

  // The front arm (.m-arm) pivots at the shoulder (60, 48) for the punch.
  const GORILLA = svg(`
    <rect x="58" y="74" width="16" height="24" rx="7" fill="#3d3a44"/>
    <rect x="80" y="74" width="16" height="24" rx="7" fill="#3d3a44"/>
    <path d="M90 44Q108 62 100 92" stroke="#2f2c35" stroke-width="13" stroke-linecap="round" fill="none"/>
    <ellipse cx="78" cy="58" rx="28" ry="26" fill="#4a4652"/>
    <ellipse cx="67" cy="62" rx="15" ry="14" fill="#8b8494"/>
    <path d="M60 58q7 4 14 0M61 66q6 3 12 0" stroke="#6f6878" stroke-width="2" fill="none" stroke-linecap="round"/>
    <circle cx="45" cy="34" r="17" fill="#4a4652"/>
    <ellipse cx="38" cy="41" rx="13" ry="10" fill="#8b8494"/>
    <path d="M27 29Q44 19 60 28V33Q44 26 27 34Z" fill="#2f2c35"/>
    <circle cx="34" cy="32" r="2.6" fill="#fff"/><circle cx="33.3" cy="32" r="1.4" fill="#2a1a3a"/>
    <circle cx="43" cy="32" r="2.6" fill="#fff"/><circle cx="42.3" cy="32" r="1.4" fill="#2a1a3a"/>
    <circle cx="30" cy="40" r="1.4" fill="#2f2c35"/><circle cx="35" cy="40" r="1.4" fill="#2f2c35"/>
    <path class="m-jaw" d="M28 46Q36 51 45 46" stroke="#2f2c35" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <g class="m-arm">
      <path d="M60 48Q40 60 42 82" stroke="#4a4652" stroke-width="14" stroke-linecap="round" fill="none"/>
      <circle cx="42" cy="87" r="9.5" fill="#3d3a44"/>
      <path d="M36 84h12M36 89h12" stroke="#2f2c35" stroke-width="1.4" stroke-linecap="round"/>
    </g>`);

  const WOLF = svg(`
    <path d="M92 54Q118 42 115 22Q108 46 90 62Z" fill="#5f6675"/>
    <rect x="56" y="72" width="10" height="25" rx="4" fill="#5b6170"/>
    <rect x="82" y="70" width="10" height="27" rx="4" fill="#5b6170"/>
    <ellipse cx="74" cy="58" rx="27" ry="17" fill="#8b93a3"/>
    <ellipse cx="68" cy="65" rx="15" ry="8" fill="#c9ced8"/>
    <path d="M50 56Q42 44 36 40" stroke="#8b93a3" stroke-width="16" stroke-linecap="round" fill="none"/>
    <path d="M38 27l4-13 7 13zM47 29l6-12 5 14z" fill="#5f6675"/>
    <path class="m-jaw" d="M9 49Q20 58 33 51V47Q20 52 12 47Z" fill="#5f6675"/>
    <path d="M6 44Q10 34 26 32Q44 30 52 40Q52 48 44 49H12Q6 49 6 44Z" fill="#8b93a3"/>
    <path d="M14 49l2.5 4 2.5-4zM22 49l2.5 4 2.5-4z" fill="#fff"/>
    <circle cx="7" cy="43" r="2.6" fill="#1f1a24"/>
    ${eye(34, 37, 4.5)}
    <path d="M28 33l10-2" stroke="#4b5160" stroke-width="2" stroke-linecap="round"/>`);

  const SPIDER = svg(`
    <g class="m-legs" stroke="#2a1a3a" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M60 56Q46 40 34 60L28 96"/><path d="M64 60Q52 50 44 70L40 97"/>
      <path d="M70 62Q66 58 60 78L58 97"/><path d="M76 62Q80 64 78 80L80 97"/>
      <path d="M82 60Q96 50 102 66L106 97"/><path d="M86 56Q104 40 114 58L118 96"/>
    </g>
    <ellipse cx="86" cy="50" rx="25" ry="21" fill="#3a2a4f"/>
    <path d="M86 38l6 8-6 6-6-6z M86 52l6 8-6 6-6-6z" fill="#e8272d"/>
    <circle cx="54" cy="60" r="15" fill="#4a3a5f"/>
    <circle cx="44" cy="54" r="3.4" fill="#fff"/><circle cx="43" cy="54" r="1.7" fill="#e8272d"/>
    <circle cx="52" cy="52" r="3.4" fill="#fff"/><circle cx="51" cy="52" r="1.7" fill="#e8272d"/>
    <circle cx="44" cy="61" r="2" fill="#e8272d"/><circle cx="50" cy="60" r="2" fill="#e8272d"/>
    <g class="m-jaw"><path d="M40 70l-3 9 6-6zM49 72l-1 9 5-7z" fill="#ece6f2"/></g>`);

  // The boss: a big golem in four looks (stone, lava, ice, robot). Same shape for all,
  // so the CSS animations fit every one. Its front arm (.m-arm, shoulder at 46, 40) throws rocks.
  const golem = (c) => svg(`
    <rect x="52" y="74" width="18" height="24" rx="6" fill="${c.shade}"/>
    <rect x="82" y="74" width="18" height="24" rx="6" fill="${c.shade}"/>
    <path d="M96 38Q114 52 108 82" stroke="${c.back}" stroke-width="15" stroke-linecap="round" fill="none"/>
    <rect x="40" y="28" width="66" height="54" rx="20" fill="${c.skin}"/>
    <path d="M58 40l6 10-4 8M88 46l-5 9 5 7M72 64l8 4" stroke="${c.crack}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <ellipse cx="96" cy="34" rx="9" ry="4" fill="${c.accent}" opacity=".8"/>
    <rect x="20" y="14" width="42" height="34" rx="12" fill="${c.head}"/>
    ${c.top}
    <rect x="26" y="25" width="9" height="5" rx="2" fill="${c.eye}"/>
    <rect x="40" y="25" width="9" height="5" rx="2" fill="${c.eye}"/>
    <path d="M24 22l12 3M50 22l-12 3" stroke="${c.dark}" stroke-width="2.4" stroke-linecap="round"/>
    <rect class="m-jaw" x="26" y="37" width="22" height="5" rx="2" fill="${c.mouth}"/>
    <g class="m-arm">
      <path d="M46 40Q28 50 26 68" stroke="${c.skin}" stroke-width="15" stroke-linecap="round" fill="none"/>
      <circle class="m-rock" cx="24" cy="74" r="9" fill="${c.rock}" stroke="${c.rockEdge}" stroke-width="1.5"/>
    </g>`);

  const BOSS_LOOKS = [
    {
      kind: "stone", name: "Golem de pedra",
      skin: "#8c8496", shade: "#6b6476", back: "#7a7286", head: "#9d95a8", crack: "#6b6476", accent: "#6cc24a",
      eye: "#f7931e", dark: "#5b5466", mouth: "#4a4456", rock: "#7a6f6a", rockEdge: "#5e5450",
      top: '<path d="M24 14l4-11 7 11 7-13 7 13 7-11 4 11z" fill="#fbd51a" stroke="#c99a00" stroke-width="1"/>',
    },
    {
      kind: "lava", name: "Golem de lava",
      skin: "#5a2e22", shade: "#3f1f17", back: "#4a261c", head: "#6e3a2a", crack: "#ff8a1e", accent: "#ff5a1e",
      eye: "#ffd23f", dark: "#2a120c", mouth: "#ff7a1a", rock: "#ff6a1a", rockEdge: "#c23a0a",
      top: '<path d="M26 16l-8-13 14 9zM56 16l8-13-14 9z" fill="#2a120c"/>',
    },
    {
      kind: "ice", name: "Gigante de gelo",
      skin: "#8fc9e6", shade: "#5f9fc4", back: "#73b2d6", head: "#b5e2f5", crack: "#e8f7ff", accent: "#ffffff",
      eye: "#1f6fd1", dark: "#2f5f86", mouth: "#2f5f86", rock: "#d8f1ff", rockEdge: "#7fb8d8",
      top: '<path d="M24 15l5-12 5 12zM36 15l5-14 5 14zM48 15l5-11 5 11z" fill="#e8f7ff" stroke="#9fd3ec" stroke-width="1"/>',
    },
    {
      kind: "robot", name: "Robô gigante",
      skin: "#9aa4b1", shade: "#5d6673", back: "#7d8794", head: "#b7c0cc", crack: "#5d6673", accent: "#36c5f0",
      eye: "#36c5f0", dark: "#3b434e", mouth: "#3b434e", rock: "#4a4f57", rockEdge: "#2c3036",
      top: '<path d="M41 14V4" stroke="#5d6673" stroke-width="2.5"/><circle cx="41" cy="4" r="3.5" fill="#e8272d"/>',
    },
  ];

  // ── Attacks ─────────────────────────────────────────────────────────
  // ctx: { art, hero, fx, later, moveTo(x, ms), shake(), heroLeft, heroWidth,
  //        heroCenterX, heroTop, size, monsterX, mouthPoint() }

  function dinoAttack(ctx) {
    ctx.art.classList.add("atk-jump", "atk-chomp");
    ctx.moveTo(ctx.heroLeft - ctx.size * 0.15, 350);
    ctx.later(() => ctx.fx.popText(ctx.heroCenterX, ctx.heroTop, "CHOMP!", "pop-attack"), 250);
    ctx.later(() => ctx.hero.setFate("eaten"), 700);
  }

  function dragonAttack(ctx) {
    ctx.art.classList.add("atk-rear", "jaw-open");
    ctx.later(() => {
      const mouth = ctx.mouthPoint();
      ctx.fx.fire(mouth.x, ctx.heroCenterX, mouth.y, 1200);
      ctx.fx.popText(ctx.heroCenterX + ctx.heroWidth, ctx.heroTop - 10, "FUUUSH!", "pop-attack");
    }, 350);
    ctx.later(() => ctx.hero.setFate("burned"), 900);
  }

  function snakeAttack(ctx) {
    ctx.moveTo(ctx.heroLeft + ctx.heroWidth * 0.25, 400);
    ctx.later(() => ctx.hero.setFate("squeezed"), 450);
    ctx.later(() => ctx.fx.popText(ctx.heroCenterX, ctx.heroTop, "SSSSS!", "pop-attack"), 600);
  }

  function gatorAttack(ctx) {
    ctx.art.classList.add("atk-chomp", "atk-roll");
    ctx.moveTo(ctx.heroLeft - ctx.size * 0.1, 300);
    ctx.later(() => ctx.fx.popText(ctx.heroCenterX, ctx.heroTop, "NHAC!", "pop-attack"), 250);
    ctx.later(() => ctx.hero.setFate("eaten"), 650);
  }

  function gorillaAttack(ctx) {
    // Steps in so the fist lands on the hero's head, winds up and punches down.
    ctx.moveTo(ctx.heroLeft + ctx.heroWidth * 0.55 - ctx.size * 0.35, 350);
    ctx.later(() => ctx.art.classList.add("atk-punch"), 350);
    ctx.later(() => {
      ctx.hero.setFate("bonked");
      ctx.fx.popText(ctx.heroCenterX, ctx.heroTop - 6, "POW!", "pop-attack");
      ctx.shake();
    }, 850);
  }

  function wolfAttack(ctx) {
    ctx.art.classList.add("atk-jump", "atk-chomp");
    ctx.moveTo(ctx.heroLeft - ctx.size * 0.2, 280);
    ctx.later(() => ctx.fx.popText(ctx.heroCenterX, ctx.heroTop, "AUUU!", "pop-attack"), 150);
    ctx.later(() => ctx.hero.setFate("eaten"), 650);
  }

  function spiderAttack(ctx) {
    ctx.art.classList.add("jaw-open");
    ctx.later(() => {
      const mouth = ctx.mouthPoint();
      ctx.fx.web(mouth.x, ctx.heroCenterX, mouth.y, 900);
      ctx.fx.popText(ctx.heroCenterX + ctx.heroWidth, ctx.heroTop - 10, "TSSSK!", "pop-attack");
    }, 300);
    ctx.later(() => ctx.hero.setFate("webbed"), 750);
    ctx.later(() => ctx.moveTo(ctx.heroLeft + ctx.heroWidth * 0.4, 500), 900);
  }

  /** Spider shoots web from a little distance, like the dragon (but closer). */
  const spiderGap = (fieldWidth) => Math.min(80, Math.max(40, fieldWidth * 0.12));

  /** Dragon breathes fire from a short distance: clamp(18% of the field, 60, 110) px (was 28%, 90–170). */
  const dragonGap = (fieldWidth) => Math.min(110, Math.max(60, fieldWidth * 0.18));

  const MONSTERS = Object.freeze([
    {
      id: "dino", name: "Dinossauro", icon: "🦖", svg: DINO,
      lossTitle: "O dinossauro comeu você!", attackMs: 1500, attack: dinoAttack,
      stopGap: () => 0, mouth: { x: 0.12, y: 0.46 },
    },
    {
      id: "dragon", name: "Dragão", icon: "🐉", svg: DRAGON,
      lossTitle: "O dragão te queimou!", attackMs: 1900, attack: dragonAttack,
      stopGap: dragonGap, mouth: { x: 0.08, y: 0.45 },
    },
    {
      id: "snake", name: "Cobra", icon: "🐍", svg: SNAKE,
      lossTitle: "A cobra te enrolou!", attackMs: 2000, attack: snakeAttack,
      stopGap: () => 0, mouth: { x: 0.13, y: 0.45 },
    },
    {
      id: "gator", name: "Jacaré", icon: "🐊", svg: GATOR,
      lossTitle: "O jacaré te abocanhou!", attackMs: 1600, attack: gatorAttack,
      stopGap: () => 0, mouth: { x: 0.05, y: 0.68 },
    },
    {
      id: "gorilla", name: "Gorila", icon: "🦍", svg: GORILLA,
      lossTitle: "O gorila te nocauteou!", attackMs: 1700, attack: gorillaAttack,
      stopGap: () => 0, mouth: { x: 0.3, y: 0.45 },
    },
    {
      id: "wolf", name: "Lobo", icon: "🐺", svg: WOLF,
      lossTitle: "O lobo te pegou!", attackMs: 1500, attack: wolfAttack,
      stopGap: () => 0, mouth: { x: 0.08, y: 0.48 },
    },
    {
      id: "spider", name: "Aranha gigante", icon: "🕷️", svg: SPIDER,
      lossTitle: "A aranha te enrolou na teia!", attackMs: 1900, attack: spiderAttack,
      stopGap: spiderGap, mouth: { x: 0.38, y: 0.72 },
    },
  ]);

  /**
   * The boss fight's monsters (never in the random draw), one look per fight.
   * They do not walk to the hero: game.js places them and animates the throws.
   */
  const BOSSES = Object.freeze(
    BOSS_LOOKS.map(({ kind, name, ...colors }) =>
      Object.freeze({
        id: "boss", kind, name, icon: "👑", svg: golem(colors),
        lossTitle: `O ${name.toLowerCase()} te esmagou!`,
        scale: 1.7, // drawn this much bigger than regular monsters
        stopGap: () => 0, mouth: { x: 0.2, y: 0.74 }, // mouth = the rock in its hand
      })
    )
  );
  const BOSS = BOSSES[0];

  /** Picks a boss look different from the previous fight's. */
  function pickBoss(previousKind, rng = Math.random) {
    const pool = BOSSES.filter((b) => b.kind !== previousKind);
    return pool[Math.floor(rng() * pool.length)];
  }

  /** Picks a monster of a different type than the previous one. */
  function pick(previousId, rng = Math.random) {
    const pool = MONSTERS.filter((m) => m.id !== previousId);
    return pool[Math.floor(rng() * pool.length)];
  }

  const byId = (id) => (id === BOSS.id ? BOSS : MONSTERS.find((m) => m.id === id) || null);

  const NS = (root.AwsCloudQuest = root.AwsCloudQuest || {});
  NS.monsters = Object.freeze({ list: MONSTERS, boss: BOSS, bosses: BOSSES, pick, pickBoss, byId });
})(typeof window !== "undefined" ? window : globalThis);
