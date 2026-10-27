/**
 * AWS Cloud Quest — the hero: two playable characters drawn as inline SVG
 * (67×72, facing right) holding one of several weapons, plus the end states
 * used by the attacks (eaten, burned, squeezed, bonked, webbed).
 * Both characters share the same box, eyes and hand position, so attacks,
 * weapons and projectiles line up for either one.
 */
(function (root) {
  "use strict";

  const WIDTH = 67;
  const HEIGHT = 72;
  /** Where projectiles leave the weapon, in hero box coordinates. */
  const MUZZLE = Object.freeze({ x: 66, y: 37 });
  /** The weapon arm turns around the shoulder to aim at flying monsters (CSS var --aim). */
  const SHOULDER = Object.freeze({ x: 28, y: 38 });

  const SKIN = "#f6c39a";
  const INK = "#3a1459";
  const SLEEVES = { male: "#2b9fdc", female: "#e84393" };

  // Parts shared by both characters.
  const head = `<circle cx="24" cy="19" r="11" fill="${SKIN}"/>`;
  const cap =
    `<path d="M12 17a12 12 0 0 1 24 0z" fill="#e8272d"/>` +
    `<rect x="22" y="14" width="17" height="4" rx="2" fill="#c41e24"/>`;
  const face = (lashes) =>
    `<g class="h-eyes" fill="${INK}">
       <circle cx="25" cy="21" r="1.7"/><circle cx="31" cy="21" r="1.7"/>
       ${lashes ? `<path d="M26 19.6l1.4-1.3M32 19.6l1.4-1.3" stroke="${INK}" stroke-width="0.9" stroke-linecap="round"/>` : ""}
     </g>
     <g class="h-eyes-x" stroke="${INK}" stroke-width="1.6" stroke-linecap="round">
       <path d="M23 19l4 4M27 19l-4 4M29 19l4 4M33 19l-4 4"/>
     </g>
     <path class="h-mouth" d="M26 26q3 2.5 6 0" stroke="${INK}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;

  const BODIES = {
    // Blue shirt, purple trousers.
    male: `
      <rect x="14" y="50" width="9" height="17" rx="3" fill="#5a2278"/>
      <rect x="25" y="50" width="9" height="17" rx="3" fill="#5a2278"/>
      <rect x="12" y="65" width="12" height="6" rx="3" fill="${INK}"/>
      <rect x="24" y="65" width="12" height="6" rx="3" fill="${INK}"/>
      <rect x="11" y="30" width="26" height="23" rx="9" fill="#2b9fdc"/>
      <rect x="11" y="46" width="26" height="4" fill="#fbd51a"/>
      ${head}${cap}${face(false)}`,

    // Ponytail, pink top, purple skirt.
    female: `
      <path class="h-ponytail" d="M14 15Q1 19 4 37Q8 30 12 28Q9 22 16 20Z" fill="#7a3e1d"/>
      <path d="M13 17Q12 30 18 31V18Z" fill="#7a3e1d"/>
      <rect x="16" y="54" width="6" height="12" rx="3" fill="${SKIN}"/>
      <rect x="26" y="54" width="6" height="12" rx="3" fill="${SKIN}"/>
      <rect x="13" y="65" width="11" height="6" rx="3" fill="#5a2278"/>
      <rect x="24" y="65" width="11" height="6" rx="3" fill="#5a2278"/>
      <path d="M12 45H36L40 57H8Z" fill="#5a2278"/>
      <rect x="12" y="30" width="24" height="18" rx="9" fill="#e84393"/>
      <rect x="12" y="44" width="24" height="3" fill="#fbd51a"/>
      ${head}
      <path d="M13 17Q16 23 20 18Q22 22 27 18V16H13Z" fill="#7a3e1d"/>
      ${cap}
      <circle cx="30" cy="25" r="2" fill="#ff8fd0" opacity=".8"/>
      ${face(true)}`,
  };

  const arm = (sleeve) => `<rect x="27" y="35" width="13" height="6" rx="3" fill="${sleeve}"/>`;
  const hand = `<circle cx="38" cy="38" r="3.2" fill="${SKIN}"/>`;

  /**
   * Weapons: label shown to the player, projectile style (css .shot-*) and art
   * (the arm, the weapon and the hand on top). The mystery box swaps them.
   */
  const WEAPONS = Object.freeze({
    blaster: {
      label: "Pistola",
      projectile: "laser",
      art: (sleeve) =>
        `${arm(sleeve)}
         <rect x="40" y="39" width="6" height="8" rx="1.5" fill="#5b606a"/>
         <rect x="38" y="33" width="25" height="7" rx="2" fill="#7a7f8a"/>
         <rect x="40" y="34" width="20" height="1.6" rx="0.8" fill="#a9aeb8"/>
         <rect x="61" y="34" width="5" height="5" rx="1" fill="#4a4e57"/>${hand}`,
    },
    bow: {
      label: "Arco e flecha",
      projectile: "arrow",
      art: (sleeve) =>
        `${arm(sleeve)}
         <path d="M48 18Q63 37 48 56" stroke="#8b5a2b" stroke-width="3.2" fill="none" stroke-linecap="round"/>
         <path d="M48 18L39 37L48 56" stroke="#f4eee8" stroke-width="0.9" fill="none"/>
         <path d="M38 37H63" stroke="#8b5a2b" stroke-width="1.8"/>
         <path d="M63 34L68 37L63 40Z" fill="#7a7f8a"/>
         <path d="M38 37l-3-3M38 37l-3 3" stroke="#e8272d" stroke-width="1.6" stroke-linecap="round"/>${hand}`,
    },
    slingshot: {
      label: "Estilingue",
      projectile: "pebble",
      art: (sleeve) =>
        `${arm(sleeve)}
         <path d="M40 41L52 30" stroke="#8b5a2b" stroke-width="3.4" stroke-linecap="round"/>
         <path d="M52 30L49 21M52 30L60 23" stroke="#8b5a2b" stroke-width="2.6" stroke-linecap="round"/>
         <path d="M49 21Q53 30 60 23" stroke="#e8272d" stroke-width="1.3" fill="none"/>
         <circle cx="54" cy="26" r="2.3" fill="#7a7f8a"/>${hand}`,
    },
    wand: {
      label: "Varinha mágica",
      projectile: "star",
      art: (sleeve) =>
        `${arm(sleeve)}
         <path d="M39 39L60 31" stroke="#4a2a12" stroke-width="2.6" stroke-linecap="round"/>
         <path d="M57 32.2L60 31" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>
         <path class="h-wand-star" d="M63 24l1.6 3.4 3.7.4-2.8 2.5.8 3.6-3.3-1.9-3.2 1.9.8-3.6-2.8-2.5 3.7-.4z" fill="#fbd51a" stroke="#e39b00" stroke-width=".6"/>${hand}`,
    },
  });

  /** Both arms raised, no weapon: the duel winner celebrating. */
  const cheerArms = (sleeve) =>
    `<path d="M15 35Q8 27 9 15" stroke="${sleeve}" stroke-width="6" fill="none" stroke-linecap="round"/>
     <path d="M33 35Q40 27 39 15" stroke="${sleeve}" stroke-width="6" fill="none" stroke-linecap="round"/>
     <circle cx="9" cy="13" r="3.2" fill="${SKIN}"/><circle cx="39" cy="13" r="3.2" fill="${SKIN}"/>`;

  const COILS = `
    <svg class="h-coils" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" aria-hidden="true">
      <ellipse cx="25" cy="32" rx="21" ry="6" fill="none" stroke="#4e9a33" stroke-width="6"/>
      <ellipse cx="25" cy="42" rx="21" ry="6" fill="none" stroke="#fbd51a" stroke-width="5"/>
      <ellipse cx="25" cy="52" rx="21" ry="6" fill="none" stroke="#6cc24a" stroke-width="6"/>
    </svg>`;

  // Spider web cocoon around the hero (spider attack).
  const WEB = `
    <svg class="h-web" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" aria-hidden="true">
      <ellipse cx="25" cy="40" rx="20" ry="31" fill="rgba(255,255,255,.72)" stroke="#fff" stroke-width="1.5"/>
      <path d="M8 22Q25 30 42 20M6 34Q25 42 44 32M6 46Q25 54 44 44M8 58Q25 64 42 56M16 10Q22 40 18 70M34 10Q28 40 32 70" stroke="#d9d4e0" stroke-width="1.2" fill="none"/>
    </svg>`;

  // Cartoon knife for the duel's special move (shown while .is-stabbing).
  const KNIFE = `<span class="h-knife" aria-hidden="true"></span>`;

  // Dizzy stars circling the head after the gorilla's punch.
  const STARS = `
    <svg class="h-stars" viewBox="0 0 40 16" width="40" height="16" aria-hidden="true">
      <g fill="#fbd51a" stroke="#a86a00" stroke-width=".6">
        <path d="M6 2l1.2 2.6 2.8.3-2.1 1.9.6 2.8L6 8.2 3.5 9.6l.6-2.8L2 4.9l2.8-.3z"/>
        <path d="M20 5l1.2 2.6 2.8.3-2.1 1.9.6 2.8L20 11.2l-2.5 1.4.6-2.8L16 7.9l2.8-.3z"/>
        <path d="M34 2l1.2 2.6 2.8.3-2.1 1.9.6 2.8L34 8.2l-2.5 1.4.6-2.8L30 4.9l2.8-.3z"/>
      </g>
    </svg>`;

  const VARIANTS = Object.freeze(Object.keys(BODIES));
  const DEFAULT_VARIANT = "male";
  const DEFAULT_WEAPON = "blaster";

  /**
   * Standalone SVG markup for a character holding a weapon (also used by the
   * character picker). With `cheer`, the weapon is put away and both arms go up.
   */
  function artFor(variant, weapon = DEFAULT_WEAPON, cheer = false) {
    const v = BODIES[variant] ? variant : DEFAULT_VARIANT;
    const w = WEAPONS[weapon] || WEAPONS[DEFAULT_WEAPON];
    const arms = cheer ? cheerArms(SLEEVES[v]) : `<g class="h-arm">${w.art(SLEEVES[v])}</g>`;
    return `<svg class="h-svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" aria-hidden="true">${BODIES[v]}${arms}</svg>`;
  }

  // "kneel" and "fallen" are the duel's: the loser drops to the knees, then to the ground.
  const FATES = ["eaten", "burned", "squeezed", "bonked", "webbed", "poisoned", "kneel", "fallen"];

  /** Creates the hero view inside `el`. */
  function create(el, variant = DEFAULT_VARIANT) {
    let current = { variant: BODIES[variant] ? variant : DEFAULT_VARIANT, weapon: DEFAULT_WEAPON, cheer: false };

    function draw() {
      // Keep fate/blink classes: only the artwork is replaced.
      el.innerHTML = artFor(current.variant, current.weapon, current.cheer) + COILS + WEB + STARS + KNIFE;
      el.dataset.variant = current.variant;
      el.dataset.weapon = current.weapon;
    }
    draw();

    function restart(className) {
      el.classList.remove(className);
      void el.offsetWidth; // restart the animation
      el.classList.add(className);
    }

    return Object.freeze({
      WIDTH,
      HEIGHT,
      MUZZLE,
      setVariant(v) {
        current = { ...current, variant: BODIES[v] ? v : DEFAULT_VARIANT };
        draw();
      },
      setWeapon(w) {
        current = { ...current, weapon: WEAPONS[w] ? w : DEFAULT_WEAPON };
        draw();
        restart("is-equipping");
      },
      weapon: () => current.weapon,
      /** Puts the weapon away and raises both arms (true), or back to normal (false). */
      celebrate(on) {
        if (current.cheer === on) return;
        current = { ...current, cheer: on };
        draw();
      },
      /** Puts the hero in an attack end state (kept on Game Over). */
      setFate(fate) {
        el.classList.add(`fate-${fate}`);
      },
      recoil() {
        restart("is-shooting");
      },
      /** Short stagger when hit by something that does not cost a life (boss rocks). */
      flinch() {
        restart("is-flinching");
      },
      /** Back to normal; optionally blinking for `blinkMs`. */
      reset(blinkMs = 0) {
        FATES.forEach((f) => el.classList.remove(`fate-${f}`));
        el.classList.remove("is-shooting", "is-blinking", "is-flinching", "is-stabbing");
        if (blinkMs > 0) {
          void el.offsetWidth;
          el.style.setProperty("--blink-ms", `${blinkMs}ms`);
          el.classList.add("is-blinking");
        }
      },
    });
  }

  const NS = (root.AwsCloudQuest = root.AwsCloudQuest || {});
  NS.hero = Object.freeze({ create, artFor, WEAPONS, VARIANTS, DEFAULT_VARIANT, DEFAULT_WEAPON, WIDTH, HEIGHT, MUZZLE, SHOULDER });
})(typeof window !== "undefined" ? window : globalThis);
