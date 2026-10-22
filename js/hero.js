/**
 * AWS Cloud Quest — the hero: two playable characters drawn as inline SVG
 * (67×72, facing right, gun level) plus the end states used by the attacks
 * (eaten, burned, squeezed, bonked). Both characters share the same box, eyes and
 * gun position, so attacks and bullets line up for either one.
 */
(function (root) {
  "use strict";

  const WIDTH = 67;
  const HEIGHT = 72;
  /** Gun muzzle, in hero box coordinates. */
  const MUZZLE = Object.freeze({ x: 66, y: 37 });

  const SKIN = "#f6c39a";
  const INK = "#3a1459";

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
  const gun = (sleeve) =>
    `<rect x="27" y="35" width="13" height="6" rx="3" fill="${sleeve}"/>
     <rect x="40" y="39" width="6" height="8" rx="1.5" fill="#5b606a"/>
     <rect x="38" y="33" width="25" height="7" rx="2" fill="#7a7f8a"/>
     <rect x="40" y="34" width="20" height="1.6" rx="0.8" fill="#a9aeb8"/>
     <rect x="61" y="34" width="5" height="5" rx="1" fill="#4a4e57"/>
     <circle cx="38" cy="38" r="3.2" fill="${SKIN}"/>`;

  const BODIES = {
    // Blue shirt, purple trousers.
    male: `
      <rect x="14" y="50" width="9" height="17" rx="3" fill="#5a2278"/>
      <rect x="25" y="50" width="9" height="17" rx="3" fill="#5a2278"/>
      <rect x="12" y="65" width="12" height="6" rx="3" fill="${INK}"/>
      <rect x="24" y="65" width="12" height="6" rx="3" fill="${INK}"/>
      <rect x="11" y="30" width="26" height="23" rx="9" fill="#2b9fdc"/>
      <rect x="11" y="46" width="26" height="4" fill="#fbd51a"/>
      ${head}${cap}${face(false)}${gun("#2b9fdc")}`,

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
      ${face(true)}${gun("#e84393")}`,
  };

  const COILS = `
    <svg class="h-coils" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" aria-hidden="true">
      <ellipse cx="25" cy="32" rx="21" ry="6" fill="none" stroke="#4e9a33" stroke-width="6"/>
      <ellipse cx="25" cy="42" rx="21" ry="6" fill="none" stroke="#fbd51a" stroke-width="5"/>
      <ellipse cx="25" cy="52" rx="21" ry="6" fill="none" stroke="#6cc24a" stroke-width="6"/>
    </svg>`;

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

  /** Standalone SVG markup for a character (used by the character picker). */
  function artFor(variant) {
    const body = BODIES[variant] || BODIES[DEFAULT_VARIANT];
    return `<svg class="h-svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" aria-hidden="true">${body}</svg>`;
  }

  const FATES = ["eaten", "burned", "squeezed", "bonked"];

  /** Creates the hero view inside `el`. */
  function create(el, variant = DEFAULT_VARIANT) {
    function draw(v) {
      el.innerHTML = artFor(v) + COILS + STARS;
      el.dataset.variant = BODIES[v] ? v : DEFAULT_VARIANT;
    }
    draw(variant);

    return Object.freeze({
      WIDTH,
      HEIGHT,
      MUZZLE,
      setVariant: draw,
      /** Puts the hero in an attack end state (kept on Game Over). */
      setFate(fate) {
        el.classList.add(`fate-${fate}`);
      },
      recoil() {
        el.classList.remove("is-shooting");
        void el.offsetWidth; // restart the animation
        el.classList.add("is-shooting");
      },
      /** Back to normal; optionally blinking for `blinkMs`. */
      reset(blinkMs = 0) {
        FATES.forEach((f) => el.classList.remove(`fate-${f}`));
        el.classList.remove("is-shooting", "is-blinking");
        if (blinkMs > 0) {
          void el.offsetWidth;
          el.style.setProperty("--blink-ms", `${blinkMs}ms`);
          el.classList.add("is-blinking");
        }
      },
    });
  }

  const NS = (root.AwsCloudQuest = root.AwsCloudQuest || {});
  NS.hero = Object.freeze({ create, artFor, VARIANTS, DEFAULT_VARIANT, WIDTH, HEIGHT, MUZZLE });
})(typeof window !== "undefined" ? window : globalThis);
