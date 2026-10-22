/**
 * AWS Cloud Quest — short-lived visual effects: bullet, confetti, floating
 * text, balloons and dragon fire. Every element animates only transform and
 * opacity and removes itself when done.
 */
(function (root) {
  "use strict";

  const COLORS = ["#e8272d", "#f7931e", "#fbd51a", "#6cc24a", "#2b9fdc", "#a64ca6", "#ff8fd0"];
  const icon = (...args) => root.AwsCloudQuest.icons.icon(...args);

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

      /** Muzzle flash at the tip of the gun. */
      muzzle(x, y) {
        spawn("muzzle", { left: `${x}px`, top: `${y}px` }, 160);
      },

      /** "Downgrade" sign after a miss: [x] ERROU! / [↑] VELOCIDADE +N%. */
      penalty(x, y, speedText) {
        const el = spawn("penalty", { left: `${x}px`, top: `${y}px` }, 1700);
        const title = document.createElement("span");
        title.className = "penalty-title";
        title.innerHTML = icon("x", { size: 22, strokeWidth: 3 });
        title.append(" ERROU!");
        const speed = document.createElement("span");
        speed.className = "penalty-speed";
        speed.innerHTML = icon("arrow-up", { size: 18, strokeWidth: 3 });
        speed.append(` ${speedText}`);
        el.append(title, speed);
      },

      /** Animated balloon centered horizontally, with its top edge at `y`. */
      balloon(text, y, iconName) {
        const el = spawn("balloon", { top: `${y}px` }, 2300);
        if (iconName) el.innerHTML = icon(iconName, { size: 18, fill: "currentColor", className: `balloon-icon-${iconName}` });
        el.append(` ${text}`);
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
