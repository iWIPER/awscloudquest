/**
 * AWS Cloud Quest — the hero: inline SVG (67×72, facing right, gun level)
 * and the visual states used by the attacks (eaten, burned, squeezed).
 */
(function (root) {
  "use strict";

  const WIDTH = 67;
  const HEIGHT = 72;
  /** Gun muzzle, in hero box coordinates. */
  const MUZZLE = Object.freeze({ x: 66, y: 37 });

  const SVG = `
    <svg class="h-svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" aria-hidden="true">
      <rect x="14" y="50" width="9" height="17" rx="3" fill="#5a2278"/>
      <rect x="25" y="50" width="9" height="17" rx="3" fill="#5a2278"/>
      <rect x="12" y="65" width="12" height="6" rx="3" fill="#3a1459"/>
      <rect x="24" y="65" width="12" height="6" rx="3" fill="#3a1459"/>
      <rect x="11" y="30" width="26" height="23" rx="9" fill="#2b9fdc"/>
      <rect x="11" y="46" width="26" height="4" fill="#fbd51a"/>
      <circle cx="24" cy="19" r="11" fill="#f6c39a"/>
      <path d="M12 17a12 12 0 0 1 24 0z" fill="#e8272d"/>
      <rect x="22" y="14" width="17" height="4" rx="2" fill="#c41e24"/>
      <g class="h-eyes" fill="#3a1459">
        <circle cx="25" cy="21" r="1.7"/><circle cx="31" cy="21" r="1.7"/>
      </g>
      <g class="h-eyes-x" stroke="#3a1459" stroke-width="1.6" stroke-linecap="round">
        <path d="M23 19l4 4M27 19l-4 4M29 19l4 4M33 19l-4 4"/>
      </g>
      <path class="h-mouth" d="M26 26q3 2.5 6 0" stroke="#3a1459" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      <rect x="27" y="35" width="13" height="6" rx="3" fill="#2b9fdc"/>
      <rect x="40" y="39" width="6" height="8" rx="1.5" fill="#5b606a"/>
      <rect x="38" y="33" width="25" height="7" rx="2" fill="#7a7f8a"/>
      <rect x="61" y="34" width="5" height="5" rx="1" fill="#4a4e57"/>
      <circle cx="38" cy="38" r="3.2" fill="#f6c39a"/>
    </svg>
    <svg class="h-coils" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" aria-hidden="true">
      <ellipse cx="25" cy="32" rx="21" ry="6" fill="none" stroke="#4e9a33" stroke-width="6"/>
      <ellipse cx="25" cy="42" rx="21" ry="6" fill="none" stroke="#fbd51a" stroke-width="5"/>
      <ellipse cx="25" cy="52" rx="21" ry="6" fill="none" stroke="#6cc24a" stroke-width="6"/>
    </svg>`;

  const FATES = ["eaten", "burned", "squeezed"];

  /** Creates the hero view inside `el`. */
  function create(el) {
    el.innerHTML = SVG;

    return Object.freeze({
      WIDTH,
      HEIGHT,
      MUZZLE,
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
  NS.hero = Object.freeze({ create, WIDTH, HEIGHT, MUZZLE });
})(typeof window !== "undefined" ? window : globalThis);
