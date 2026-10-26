/**
 * AWS Cloud Quest — the cheering visitor.
 *
 * At milestones a friendly visitor walks in from the right with a dog on a
 * leash, stops mid-field, raises a sign with a message, then lowers it and
 * leaves. Purely decorative: game.js pauses the questions while it plays.
 */
(function (root) {
  "use strict";

  // Person (right) holding the leash of a dog (left), both facing left. 110×100 box.
  const ART = `
    <svg class="v-svg" viewBox="0 0 110 100" aria-hidden="true">
      <path class="v-leash" d="M18 76Q40 60 62 62" stroke="#e8272d" stroke-width="1.6" fill="none"/>
      <g class="v-dog">
        <path class="v-tail" d="M44 75Q53 67 51 59" stroke="#a0662f" stroke-width="4" fill="none" stroke-linecap="round"/>
        <rect class="v-leg v-leg-a" x="12" y="84" width="5" height="13" rx="2" fill="#8b5a2b"/>
        <rect class="v-leg v-leg-b" x="20" y="84" width="5" height="13" rx="2" fill="#8b5a2b"/>
        <rect class="v-leg v-leg-a" x="32" y="84" width="5" height="13" rx="2" fill="#8b5a2b"/>
        <rect class="v-leg v-leg-b" x="39" y="84" width="5" height="13" rx="2" fill="#8b5a2b"/>
        <ellipse cx="28" cy="80" rx="17" ry="9" fill="#a0662f"/>
        <circle cx="12" cy="72" r="8" fill="#a0662f"/>
        <ellipse cx="5" cy="75" rx="5" ry="3.8" fill="#c58a52"/>
        <circle cx="2" cy="74" r="1.8" fill="#1f1a24"/>
        <path d="M14 64q7 2 4 11q-5-2-4-11z" fill="#6b3f1c"/>
        <circle cx="10" cy="70" r="1.3" fill="#1f1a24"/>
        <rect x="16" y="72" width="3" height="9" rx="1" fill="#e8272d"/>
      </g>
      <g class="v-person">
        <rect class="v-leg v-leg-a" x="70" y="70" width="7" height="25" rx="3" fill="#2b4a8a"/>
        <rect class="v-leg v-leg-b" x="80" y="70" width="7" height="25" rx="3" fill="#2b4a8a"/>
        <rect x="67" y="94" width="11" height="5" rx="2.5" fill="#3a1459"/>
        <rect x="78" y="94" width="11" height="5" rx="2.5" fill="#3a1459"/>
        <rect x="66" y="40" width="26" height="34" rx="9" fill="#3f9a2c"/>
        <path d="M70 48Q62 56 62 62" stroke="#3f9a2c" stroke-width="6" fill="none" stroke-linecap="round"/>
        <circle cx="62" cy="62" r="3.5" fill="#f6c39a"/>
        <path class="v-arm" d="M88 46Q97 30 93 12" stroke="#3f9a2c" stroke-width="6" fill="none" stroke-linecap="round"/>
        <circle class="v-hand" cx="93" cy="11" r="3.5" fill="#f6c39a"/>
        <circle cx="78" cy="28" r="11" fill="#f6c39a"/>
        <path d="M67 27a11 11 0 0 1 22-3q-9-5-22 3z" fill="#4a2a12"/>
        <circle cx="72" cy="28" r="1.6" fill="#3a1459"/>
        <path d="M69 33q3 2.5 6 0" stroke="#3a1459" stroke-width="1.3" fill="none" stroke-linecap="round"/>
        <circle cx="74" cy="31" r="1.8" fill="#ff8fd0" opacity=".6"/>
      </g>
    </svg>`;

  /** Phases of the visit, in ms from the start. */
  const TIMING = Object.freeze({ arrive: 3400, raise: 3800, lower: 9300, leave: 9800, end: 13000 });

  function create(layer, { sound, reducedMotion = () => false }) {
    let el = null;

    function remove() {
      if (el) el.remove();
      el = null;
    }

    /**
     * Plays one visit.
     * @param {string} text   sign text
     * @param {(fn: () => void, ms: number) => void} later  tracked setTimeout from game.js
     * @param {() => void} done  called when the visitor is gone
     */
    function play(text, later, done) {
      remove();
      const width = layer.clientWidth;
      const size = Math.min(150, Math.max(110, width * 0.3));
      el = document.createElement("div");
      el.className = "visitor is-walking";
      el.style.width = `${size}px`;
      el.style.height = `${size * (100 / 110)}px`;
      el.innerHTML = `${ART}<div class="v-sign" role="status"><span></span></div>`;
      el.querySelector(".v-sign span").textContent = text;
      layer.appendChild(el);

      const place = (x, ms) => {
        el.style.transition = ms ? `transform ${ms}ms linear` : "none";
        el.style.transform = `translateX(${x}px)`;
      };
      place(width + 10, 0);
      void el.offsetWidth;
      // Stop a bit right of the centre: in front, but not too close to the hero.
      place(width * 0.55 - size * 0.4, TIMING.arrive);

      later(() => {
        el.classList.remove("is-walking");
        sound.play("bark");
      }, TIMING.arrive);
      later(() => el && el.classList.add("is-showing"), TIMING.raise);
      later(() => el && el.classList.remove("is-showing"), TIMING.lower);
      later(() => {
        if (!el) return;
        el.classList.add("is-walking", "is-leaving");
        sound.play("bark");
        place(width + 20, TIMING.end - TIMING.leave);
      }, TIMING.leave);
      later(() => {
        remove();
        done();
      }, TIMING.end);
    }

    return Object.freeze({ play, remove, TIMING });
  }

  const NS = (root.AwsCloudQuest = root.AwsCloudQuest || {});
  NS.visitor = Object.freeze({ create, TIMING });
})(typeof window !== "undefined" ? window : globalThis);
