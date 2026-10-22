/**
 * AWS Cloud Quest — monsters: inline SVG art, metadata and attack choreography.
 *
 * Every monster faces left (towards the hero) and is drawn in a 120×100 box
 * with its feet on the bottom edge. Animated parts carry classes used by
 * css/style.css: .m-jaw (mouth), .m-tongue (snake), .m-wing (dragon).
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

  // ── Attacks ─────────────────────────────────────────────────────────
  // ctx: { art, hero, fx, later, moveTo(x, ms), heroLeft, heroWidth, heroCenterX,
  //        heroTop, size, monsterX, mouthPoint() }

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

  /** Dragon breathes fire from a distance: clamp(28% of the field, 90, 170) px. */
  const dragonGap = (fieldWidth) => Math.min(170, Math.max(90, fieldWidth * 0.28));

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
  ]);

  /** Picks a monster of a different type than the previous one. */
  function pick(previousId, rng = Math.random) {
    const pool = MONSTERS.filter((m) => m.id !== previousId);
    return pool[Math.floor(rng() * pool.length)];
  }

  const byId = (id) => MONSTERS.find((m) => m.id === id) || null;

  const NS = (root.AwsCloudQuest = root.AwsCloudQuest || {});
  NS.monsters = Object.freeze({ list: MONSTERS, pick, byId });
})(typeof window !== "undefined" ? window : globalThis);
