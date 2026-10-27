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

  // Flying monsters: drawn high in the box and lifted further by CSS (.is-flying,
  // --lift); their wings (.m-wing) flap. They dive at the hero to attack.
  const BAT = svg(`
    <g class="m-wing"><path d="M58 44Q38 16 8 26Q22 32 18 44Q30 40 34 52Q44 44 58 50Z" fill="#4a3a5f"/></g>
    <g class="m-wing"><path d="M70 44Q90 16 118 26Q104 32 108 44Q96 40 92 52Q82 44 70 50Z" fill="#3a2a4f"/></g>
    <ellipse cx="64" cy="52" rx="13" ry="16" fill="#5a4a6f"/>
    <path d="M54 38l2-10 6 8zM68 36l6-8 2 10z" fill="#5a4a6f"/>
    <circle cx="58" cy="46" r="3.4" fill="#fff"/><circle cx="57" cy="46" r="1.7" fill="#e8272d"/>
    <circle cx="67" cy="46" r="3.4" fill="#fff"/><circle cx="66" cy="46" r="1.7" fill="#e8272d"/>
    <g class="m-jaw"><path d="M58 57l2 6 2-6zM65 57l2 6 2-6z" fill="#fff"/></g>
    <path d="M60 67l-2 5M68 67l2 5" stroke="#3a2a4f" stroke-width="2.4" stroke-linecap="round"/>`);

  const PTERO = svg(`
    <g class="m-wing"><path d="M56 50Q42 14 6 16Q26 28 22 42Q38 38 46 56Z" fill="#c0703a"/></g>
    <g class="m-wing"><path d="M72 50Q88 16 116 20Q98 30 102 44Q88 40 80 56Z" fill="#a85e2e"/></g>
    <ellipse cx="64" cy="56" rx="20" ry="9" fill="#d4844a"/>
    <path d="M66 64l-4 12M76 64l2 12" stroke="#8a4a1e" stroke-width="3" stroke-linecap="round"/>
    <path d="M84 56l18 6-18 2z" fill="#a85e2e"/>
    <circle cx="44" cy="48" r="8" fill="#d4844a"/>
    <path d="M48 42L64 34L50 48z" fill="#a85e2e"/>
    <path d="M38 46L8 50L38 52z" fill="#e8b04a"/>
    <path class="m-jaw" d="M38 52L12 54L38 56z" fill="#c99030"/>
    ${eye(42, 46, 2.8)}`);

  const WASP = svg(`
    <g class="m-wing"><ellipse cx="58" cy="32" rx="16" ry="9" fill="rgba(220,240,255,.8)" stroke="#9fc4dd" stroke-width="1.2"/></g>
    <g class="m-wing"><ellipse cx="74" cy="30" rx="14" ry="8" fill="rgba(220,240,255,.7)" stroke="#9fc4dd" stroke-width="1.2"/></g>
    <path d="M58 60l-4 12M64 61l0 12M70 60l4 12" stroke="#2a1a0a" stroke-width="2.2" stroke-linecap="round"/>
    <ellipse cx="86" cy="56" rx="20" ry="13" fill="#fbd51a"/>
    <path d="M78 44v24M88 43v26M97 46v20" stroke="#2a1a0a" stroke-width="4"/>
    <path d="M104 56l12 4-12 3z" fill="#2a1a0a"/>
    <ellipse cx="62" cy="52" rx="11" ry="10" fill="#2a1a0a"/>
    <circle cx="46" cy="50" r="10" fill="#fbd51a"/>
    <ellipse cx="42" cy="48" rx="4" ry="5" fill="#2a1a0a"/><circle cx="41" cy="46" r="1.2" fill="#fff"/>
    <path d="M44 41Q38 30 32 30M48 41Q46 30 40 26" stroke="#2a1a0a" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path class="m-jaw" d="M37 54l-6 3 6 2z" fill="#2a1a0a"/>`);

  // Scorpion: on the ground, tail arched over its back; the sting is the tail tip.
  const SCORPION = svg(`
    <g class="m-legs" stroke="#7a3a12" stroke-width="3.5" fill="none" stroke-linecap="round">
      <path d="M54 74l-8 22M64 76l-4 21M76 76l4 21M86 74l8 22"/>
    </g>
    <path class="m-tail" d="M96 68Q118 58 112 32Q106 12 84 16" stroke="#c0622a" stroke-width="10" fill="none" stroke-linecap="round"/>
    <path d="M84 16l-13-4 6 11z" fill="#3a1a0a"/>
    <ellipse cx="72" cy="66" rx="28" ry="12" fill="#d4733a"/>
    <path d="M60 56v20M72 55v22M84 56v20" stroke="#b05a26" stroke-width="2"/>
    <ellipse cx="44" cy="64" rx="12" ry="10" fill="#c0622a"/>
    <path d="M36 58Q22 48 14 54" stroke="#c0622a" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path class="m-jaw" d="M8 48q-6 6 0 12l9-4z" fill="#a04d1e"/>
    <path d="M36 70Q24 78 14 72" stroke="#c0622a" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M8 66q-6 6 0 12l9-4z" fill="#a04d1e"/>
    <circle cx="38" cy="58" r="2.6" fill="#fff"/><circle cx="37.5" cy="58" r="1.3" fill="#1f1a24"/>
    <circle cx="44" cy="56" r="2.6" fill="#fff"/><circle cx="43.5" cy="56" r="1.3" fill="#1f1a24"/>`);

  // Bosses come in three species (golem, King Kong, minotaur), each in a few
  // looks (colors and details). Every species has its front arm in .m-arm,
  // swinging around its shoulder (CSS: .boss-<species> .m-arm), and the rock in
  // that hand.

  // Golem: an upright giant, head on top of the body; shoulder at 42, 42.
  const golem = (c) => svg(`
    <rect x="46" y="74" width="14" height="24" rx="5" fill="${c.shade}"/>
    <rect x="68" y="74" width="14" height="24" rx="5" fill="${c.shade}"/>
    <rect x="43" y="92" width="20" height="7" rx="3.5" fill="${c.dark}"/>
    <rect x="65" y="92" width="20" height="7" rx="3.5" fill="${c.dark}"/>
    <path d="M86 42Q98 56 94 74" stroke="${c.back}" stroke-width="12" stroke-linecap="round" fill="none"/>
    <circle cx="94" cy="76" r="6" fill="${c.back}"/>
    <rect x="36" y="34" width="54" height="44" rx="16" fill="${c.skin}"/>
    <path d="M50 46l6 10-4 8M76 50l-5 9 5 7M60 68l8 4" stroke="${c.crack}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <ellipse cx="80" cy="40" rx="8" ry="3.5" fill="${c.accent}" opacity=".8"/>
    <rect x="44" y="8" width="36" height="30" rx="12" fill="${c.head}"/>
    ${c.top}
    ${c.face || `<rect x="50" y="19" width="8" height="5" rx="2" fill="${c.eye}"/>
    <rect x="64" y="19" width="8" height="5" rx="2" fill="${c.eye}"/>
    <path d="M48 16l11 3M75 16l-11 3" stroke="${c.dark}" stroke-width="2.4" stroke-linecap="round"/>`}
    <rect class="m-jaw" x="52" y="29" width="20" height="5" rx="2" fill="${c.mouth}"/>
    <g class="m-arm">
      <path d="M42 42Q30 50 26 62" stroke="${c.skin}" stroke-width="13" stroke-linecap="round" fill="none"/>
      <circle class="m-rock" cx="24" cy="68" r="9" fill="${c.rock}" stroke="${c.rockEdge}" stroke-width="1.5"/>
    </g>`);

  // King Kong: a huge gorilla, knuckles on the ground, a big rock; shoulder at 46, 46.
  const kong = (c) => svg(`
    <rect x="52" y="78" width="15" height="20" rx="6" fill="${c.shade}"/>
    <rect x="74" y="78" width="15" height="20" rx="6" fill="${c.shade}"/>
    <path d="M90 44Q104 64 100 90" stroke="${c.back}" stroke-width="14" stroke-linecap="round" fill="none"/>
    <circle cx="100" cy="92" r="7" fill="${c.back}"/>
    <ellipse cx="70" cy="60" rx="30" ry="26" fill="${c.skin}"/>
    <ellipse cx="62" cy="64" rx="16" ry="14" fill="${c.face}"/>
    <path d="M56 58q6 4 12 0M56 66q6 4 12 0" stroke="${c.shade}" stroke-width="1.6" fill="none" opacity=".6"/>
    <circle cx="52" cy="28" r="16" fill="${c.skin}"/>
    ${c.top}
    <ellipse cx="45" cy="33" rx="11" ry="9" fill="${c.face}"/>
    <path d="M36 23q9-4 18 1" stroke="${c.dark}" stroke-width="3.2" fill="none" stroke-linecap="round"/>
    <circle cx="41" cy="27" r="2.2" fill="${c.eye}"/><circle cx="50" cy="27" r="2.2" fill="${c.eye}"/>
    <circle cx="39" cy="33" r="1.2" fill="${c.dark}"/><circle cx="43" cy="33" r="1.2" fill="${c.dark}"/>
    <rect class="m-jaw" x="37" y="37" width="14" height="4" rx="2" fill="${c.dark}"/>
    <g class="m-arm">
      <path d="M46 46Q32 54 26 64" stroke="${c.skin}" stroke-width="14" stroke-linecap="round" fill="none"/>
      <circle class="m-rock" cx="22" cy="70" r="11" fill="${c.rock}" stroke="${c.rockEdge}" stroke-width="1.5"/>
    </g>`);

  // Minotaur: a giant with a bull's head and horns; shoulder at 44, 44.
  const minotaur = (c) => svg(`
    <rect x="46" y="74" width="14" height="22" rx="5" fill="${c.shade}"/>
    <rect x="68" y="74" width="14" height="22" rx="5" fill="${c.shade}"/>
    <rect x="44" y="92" width="18" height="7" rx="2" fill="${c.dark}"/>
    <rect x="66" y="92" width="18" height="7" rx="2" fill="${c.dark}"/>
    <path d="M86 44Q98 58 94 76" stroke="${c.back}" stroke-width="12" stroke-linecap="round" fill="none"/>
    <circle cx="94" cy="78" r="6" fill="${c.back}"/>
    <rect x="38" y="36" width="52" height="42" rx="14" fill="${c.skin}"/>
    <rect x="38" y="62" width="52" height="7" fill="${c.belt}"/>
    <path d="M36 16Q20 10 18 0" stroke="${c.horn}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M58 16Q70 8 74 -1" stroke="${c.horn}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M26 18l-8-4 4 9zM68 18l8-4-4 9z" fill="${c.head}"/>
    <rect x="28" y="12" width="34" height="28" rx="11" fill="${c.head}"/>
    ${c.top}
    <ellipse cx="34" cy="33" rx="10" ry="7" fill="${c.snout}"/>
    <circle cx="31" cy="33" r="1.5" fill="${c.dark}"/><circle cx="37" cy="33" r="1.5" fill="${c.dark}"/>
    <path class="m-jaw" d="M28 39q6 3 12 0" stroke="${c.dark}" stroke-width="2" fill="none" stroke-linecap="round"/>
    <circle cx="34" cy="38" r="3.5" fill="none" stroke="#fbd51a" stroke-width="1.6"/>
    <rect x="35" y="21" width="6" height="4" rx="1.5" fill="${c.eye}"/><rect x="48" y="21" width="6" height="4" rx="1.5" fill="${c.eye}"/>
    <path d="M33 18l9 3M56 18l-9 3" stroke="${c.dark}" stroke-width="2.2" stroke-linecap="round"/>
    <g class="m-arm">
      <path d="M44 44Q30 52 26 62" stroke="${c.skin}" stroke-width="13" stroke-linecap="round" fill="none"/>
      <circle class="m-rock" cx="24" cy="68" r="9" fill="${c.rock}" stroke="${c.rockEdge}" stroke-width="1.5"/>
    </g>`);

  const BOSS_LOOKS = [
    {
      species: "golem", kind: "stone", throws: "rock", name: "Golem de pedra",
      skin: "#8c8496", shade: "#6b6476", back: "#7a7286", head: "#9d95a8", crack: "#6b6476", accent: "#6cc24a",
      eye: "#f7931e", dark: "#5b5466", mouth: "#4a4456", rock: "#7a6f6a", rockEdge: "#5e5450",
      top: '<path d="M46 9l4-9 6 9 6-11 6 11 6-9 4 9z" fill="#fbd51a" stroke="#c99a00" stroke-width="1"/>',
    },
    {
      species: "golem", kind: "lava", throws: "fireball", name: "Golem de lava",
      skin: "#5a2e22", shade: "#3f1f17", back: "#4a261c", head: "#6e3a2a", crack: "#ff8a1e", accent: "#ff5a1e",
      eye: "#ffd23f", dark: "#2a120c", mouth: "#ff7a1a", rock: "#ff6a1a", rockEdge: "#c23a0a",
      top: '<path d="M49 12l-9-11 14 6zM75 12l9-11-14 6z" fill="#2a120c"/>',
    },
    {
      species: "golem", kind: "ice", throws: "snowball", name: "Gigante de gelo",
      skin: "#8fc9e6", shade: "#5f9fc4", back: "#73b2d6", head: "#b5e2f5", crack: "#e8f7ff", accent: "#ffffff",
      eye: "#1f6fd1", dark: "#2f5f86", mouth: "#2f5f86", rock: "#d8f1ff", rockEdge: "#7fb8d8",
      top: '<path d="M48 10l5-11 5 11zM59 10l5-13 5 13zM70 10l5-10 5 10z" fill="#e8f7ff" stroke="#9fd3ec" stroke-width="1"/>',
    },
    {
      species: "golem", kind: "robot", throws: "laser", name: "Robô gigante",
      skin: "#9aa4b1", shade: "#5d6673", back: "#7d8794", head: "#b7c0cc", crack: "#5d6673", accent: "#36c5f0",
      eye: "#36c5f0", dark: "#3b434e", mouth: "#3b434e", rock: "#4a4f57", rockEdge: "#2c3036",
      top: '<path d="M62 8V2" stroke="#5d6673" stroke-width="2.5"/><circle cx="62" cy="2" r="3" fill="#e8272d"/>',
    },
    {
      // One big eye in the middle of the forehead and a single horn (`face` replaces the two eyes).
      species: "golem", kind: "cyclops", throws: "boulder", finale: "swallow", name: "Ciclope",
      skin: "#b98563", shade: "#8a5d40", back: "#a07050", head: "#c99572", crack: "#8a5d40", accent: "#6b8e23",
      eye: "#fff", dark: "#4a2a12", mouth: "#4a2a12", rock: "#8d7b6a", rockEdge: "#5e5046",
      top: '<path d="M58 10l4-10 4 10z" fill="#efe3c8" stroke="#a89a7c" stroke-width="1"/>',
      face:
        '<circle cx="62" cy="21" r="7" fill="#fff" stroke="#4a2a12" stroke-width="1.5"/>' +
        '<circle cx="60" cy="21" r="3.4" fill="#2f7d32"/><circle cx="59.5" cy="21" r="1.7" fill="#1f1a24"/>' +
        '<path d="M53 13q9-5 18 0" stroke="#4a2a12" stroke-width="2.6" fill="none" stroke-linecap="round"/>',
    },
    {
      species: "kong", kind: "kong", throws: "barrel", name: "King Kong",
      skin: "#4a3a32", shade: "#3a2c25", back: "#3f312a", face: "#8a6a58", dark: "#1f1a24", eye: "#fff",
      rock: "#7a6f6a", rockEdge: "#5e5450",
      top: '<path d="M44 14q4-6 8-1q4-6 8 1" stroke="#3a2c25" stroke-width="3" fill="none" stroke-linecap="round"/>',
    },
    {
      species: "kong", kind: "kong-fire", throws: "fireball", name: "Kong de fogo",
      skin: "#6a2a1a", shade: "#4a1c12", back: "#5a2216", face: "#c8643a", dark: "#2a0e08", eye: "#ffd23f",
      rock: "#ff6a1a", rockEdge: "#c23a0a",
      top: '<path d="M40 16q2-12 8-6q2-10 8-2q4-8 6 6z" fill="#ff8a1e" stroke="#ff5a1e" stroke-width="1"/>',
    },
    {
      species: "kong", kind: "yeti", throws: "snowball", name: "Yeti",
      skin: "#e9f2f7", shade: "#c5d6e2", back: "#d6e3ec", face: "#9cc3dc", dark: "#2f5f86", eye: "#1f6fd1",
      rock: "#d8f1ff", rockEdge: "#7fb8d8",
      top: '<path d="M42 15l3-6 3 6 3-7 3 7 3-6 3 6" stroke="#c5d6e2" stroke-width="2" fill="none"/>',
    },
    {
      species: "minotaur", kind: "minotaur", throws: "boulder", name: "Minotauro",
      skin: "#8b5a3c", shade: "#6b4228", back: "#7a4e32", head: "#7a4e32", snout: "#c49274", belt: "#4a2a12",
      horn: "#efe3c8", dark: "#2a160a", eye: "#e8272d", rock: "#7a6f6a", rockEdge: "#5e5450", top: "",
    },
    {
      species: "minotaur", kind: "minotaur-lava", throws: "fireball", name: "Minotauro de lava",
      skin: "#5a2e22", shade: "#3f1f17", back: "#4a261c", head: "#6e3a2a", snout: "#ff8a1e", belt: "#2a120c",
      horn: "#ffb347", dark: "#2a120c", eye: "#ffd23f", rock: "#ff6a1a", rockEdge: "#c23a0a",
      top: '<path d="M38 13q3-8 6-2q3-7 6 0q3-6 5 2z" fill="#ff5a1e"/>',
    },
    {
      species: "minotaur", kind: "minotaur-ice", throws: "snowball", name: "Minotauro de gelo",
      skin: "#8fc9e6", shade: "#5f9fc4", back: "#73b2d6", head: "#b5e2f5", snout: "#e8f7ff", belt: "#2f5f86",
      horn: "#ffffff", dark: "#2f5f86", eye: "#1f6fd1", rock: "#d8f1ff", rockEdge: "#7fb8d8", top: "",
    },
  ];

  // Per species: the drawing, where the head is (fractions of the boss box, for
  // the speech bubble) and the close attack that ends a lost fight (a look can
  // override it): smash, pound (fists on the ground), charge (horns), swallow.
  const SPECIES = Object.freeze({
    golem: { draw: golem, head: { x: 0.52, y: 0.08 }, finale: "smash" },
    kong: { draw: kong, head: { x: 0.43, y: 0.12 }, finale: "pound" },
    minotaur: { draw: minotaur, head: { x: 0.38, y: 0.1 }, finale: "charge" },
  });

  /** "Você perdeu" title for each close attack. */
  const FINALE_TITLE = Object.freeze({
    smash: (name) => `O ${name} te esmagou!`,
    pound: (name) => `O ${name} te esmagou com os punhos!`,
    charge: (name) => `O ${name} te deu uma chifrada!`,
    swallow: (name) => `O ${name} te engoliu!`,
  });

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

  /** Flying monsters dive (.atk-swoop drops the lift) and strike the hero. */
  function swoop(ctx, word, fate) {
    ctx.art.classList.add("atk-swoop", "atk-chomp");
    ctx.moveTo(ctx.heroLeft - ctx.size * 0.12, 420);
    ctx.later(() => ctx.fx.popText(ctx.heroCenterX, ctx.heroTop - 10, word, "pop-attack"), 300);
    ctx.later(() => ctx.hero.setFate(fate), 650);
  }
  const batAttack = (ctx) => swoop(ctx, "NHAC!", "bonked");
  const pteroAttack = (ctx) => swoop(ctx, "KRAAA!", "eaten");
  const waspAttack = (ctx) => swoop(ctx, "ZZZT!", "poisoned");

  function scorpionAttack(ctx) {
    ctx.art.classList.add("atk-sting");
    ctx.later(() => ctx.fx.popText(ctx.heroCenterX, ctx.heroTop - 10, "TSSS!", "pop-attack"), 350);
    ctx.later(() => ctx.hero.setFate("poisoned"), 600);
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
    {
      id: "scorpion", name: "Escorpião gigante", icon: "🦂", svg: SCORPION,
      lossTitle: "O escorpião te envenenou!", attackMs: 1500, attack: scorpionAttack,
      stopGap: () => 0, mouth: { x: 0.6, y: 0.14 },
    },
    {
      id: "bat", name: "Morcego gigante", icon: "🦇", svg: BAT, flying: true, lift: 0.55,
      lossTitle: "O morcego te mordeu!", attackMs: 1500, attack: batAttack,
      stopGap: () => 0, mouth: { x: 0.53, y: 0.6 },
    },
    {
      id: "ptero", name: "Pterodáctilo", icon: "🦖", svg: PTERO, flying: true, lift: 0.5,
      lossTitle: "O pterodáctilo te levou!", attackMs: 1500, attack: pteroAttack,
      stopGap: () => 0, mouth: { x: 0.1, y: 0.52 },
    },
    {
      id: "wasp", name: "Vespa gigante", icon: "🐝", svg: WASP, flying: true, lift: 0.55,
      lossTitle: "A vespa te ferroou!", attackMs: 1500, attack: waspAttack,
      stopGap: () => 0, mouth: { x: 0.3, y: 0.56 },
    },
  ]);

  /**
   * The boss fight's monsters (never in the random draw), one look per fight.
   * They do not walk to the hero: game.js places them and animates the throws.
   */
  const BOSSES = Object.freeze(
    BOSS_LOOKS.map(({ species, kind, name, throws, finale, ...colors }) =>
      Object.freeze({
        id: "boss", species, kind, name, icon: "👑", svg: SPECIES[species].draw(colors),
        throws, // rock | boulder | fireball | snowball | barrel | laser
        finale: finale || SPECIES[species].finale,
        lossTitle: FINALE_TITLE[finale || SPECIES[species].finale](name),
        scale: 1.7, // drawn this much bigger than regular monsters
        stopGap: () => 0, mouth: { x: 0.2, y: 0.68 }, // mouth = the rock in its hand
        head: SPECIES[species].head,
      })
    )
  );
  const BOSS = BOSSES[0];

  /** Picks a boss of another species than the previous fight's, in a random look. */
  function pickBoss(previousKind, rng = Math.random) {
    const previous = BOSSES.find((b) => b.kind === previousKind);
    const pool = BOSSES.filter((b) => !previous || b.species !== previous.species);
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
