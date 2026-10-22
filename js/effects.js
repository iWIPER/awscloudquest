/**
 * AWS Cloud Quest — short-lived visual effects: bullet, confetti, floating
 * text, balloons and dragon fire. Every element animates only transform and
 * opacity and removes itself when done.
 */
(function (root) {
  "use strict";

  const COLORS = ["#e8272d", "#f7931e", "#fbd51a", "#6cc24a", "#2b9fdc", "#a64ca6", "#ff8fd0"];

  /** Creates the effects API bound to the field's effect layer. */
  function create(layer, { reducedMotion = () => false } = {}) {
    function spawn(className, styles, lifetimeMs, text) {
      const el = document.createElement("div");
      el.className = className;
      for (const [prop, value] of Object.entries(styles)) el.style.setProperty(prop, value);
      if (text) el.textContent = text;
      layer.appendChild(el);
      setTimeout(() => el.remove(), lifetimeMs);
      return el;
    }

    return Object.freeze({
      /** Bullet flying from (x1, y1) to (x2, y2) in `ms`. */
      shot(x1, y1, x2, y2, ms) {
        const el = spawn("bullet", { transform: `translate(${x1}px, ${y1}px)` }, ms + 40);
        void el.offsetWidth; // commit the start position before transitioning
        el.style.transition = `transform ${ms}ms linear`;
        el.style.transform = `translate(${x2}px, ${y2}px)`;
      },

      /** Colorful burst centered on (x, y). Skipped with reduced motion. */
      confetti(x, y, count) {
        if (reducedMotion()) return;
        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
          const distance = 40 + Math.random() * 60;
          spawn(
            "confetti",
            {
              left: `${x}px`,
              top: `${y}px`,
              background: COLORS[i % COLORS.length],
              "--dx": `${Math.round(Math.cos(angle) * distance)}px`,
              "--dy": `${Math.round(Math.sin(angle) * distance - 20)}px`,
              "--rot": `${Math.round(Math.random() * 720 - 360)}deg`,
            },
            950
          );
        }
      },

      /** Floating text ("+20", "✖", "CHOMP!") rising from (x, y). */
      popText(x, y, text, variant = "") {
        spawn(`pop ${variant}`.trim(), { left: `${x}px`, top: `${y}px` }, 1100, text);
      },

      /** Animated balloon at the top of the field. */
      balloon(text) {
        spawn("balloon", {}, 2300, text);
      },

      /** Fire jet from the mouth (fromX) to the hero (toX), at height y. */
      fire(fromX, toX, y, ms) {
        const left = Math.min(fromX, toX);
        spawn("fire", { left: `${left}px`, top: `${y - 9}px`, width: `${Math.abs(fromX - toX)}px` }, ms);
      },

      clear() {
        layer.replaceChildren();
      },
    });
  }

  const NS = (root.AwsCloudQuest = root.AwsCloudQuest || {});
  NS.effects = Object.freeze({ create });
})(typeof window !== "undefined" ? window : globalThis);
