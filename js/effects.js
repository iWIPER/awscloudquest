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
      /** Projectile flying from (x1, y1) to (x2, y2) in `ms`. kind: laser | arrow | pebble | star. */
      shot(x1, y1, x2, y2, ms, kind = "laser") {
        const el = spawn(`bullet shot-${kind}`, { transform: `translate(${x1}px, ${y1}px)` }, ms + 40);
        // Point the projectile along its path (arrows, lasers flying up at a flying monster).
        el.style.rotate = `${(Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI}deg`;
        void el.offsetWidth; // commit the start position before transitioning
        el.style.transition = `transform ${ms}ms linear`;
        el.style.transform = `translate(${x2}px, ${y2}px)`;
      },

      /**
       * Boss rock thrown in an arc from (x1, y1) to (x2, y2). The outer element
       * moves horizontally (linear) and the inner one vertically (up, then down).
       */
      rock(x1, y1, x2, y2, ms, kind = "rock") {
        const outer = spawn("rock-x", { transform: `translateX(${x1}px)` }, ms + 60);
        const inner = document.createElement("span");
        inner.className = `rock-y rock-${kind}`; // rock | boulder | fireball | snowball | barrel
        inner.style.setProperty("--y1", `${y1}px`);
        inner.style.setProperty("--y2", `${y2}px`);
        inner.style.setProperty("--peak", `${Math.min(y1, y2) - 70}px`);
        inner.style.animationDuration = `${ms}ms`;
        outer.append(inner);
        void outer.offsetWidth;
        outer.style.transition = `transform ${ms}ms linear`;
        outer.style.transform = `translateX(${x2}px)`;
      },

      /** Spider web shot from the spider (fromX) to the hero (toX), at height y. */
      web(fromX, toX, y, ms) {
        const left = Math.min(fromX, toX);
        spawn("web-shot", { left: `${left}px`, top: `${y - 2}px`, width: `${Math.abs(fromX - toX)}px` }, ms);
      },

      /** Sparkles bursting from (x, y): opening the mystery box. */
      sparkle(x, y) {
        const count = reducedMotion() ? 0 : 14;
        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 * i) / count;
          spawn(
            "sparkle",
            {
              left: `${x}px`,
              top: `${y}px`,
              "--dx": `${Math.round(Math.cos(angle) * 46)}px`,
              "--dy": `${Math.round(Math.sin(angle) * 46 - 16)}px`,
            },
            800
          );
        }
      },

      /** Colorful burst centered on (x, y). Skipped with reduced motion. */
      /** Chunks of a broken boss: they fly up and out, then fall with the fall of the body. */
      debris(x, y, colors, count) {
        if (reducedMotion()) return;
        for (let i = 0; i < count; i++) {
          const size = 8 + Math.round(Math.random() * 14);
          spawn(
            "debris",
            {
              left: `${x + Math.round((Math.random() - 0.5) * 60)}px`,
              top: `${y + Math.round((Math.random() - 0.5) * 80)}px`,
              width: `${size}px`,
              height: `${Math.round(size * (0.6 + Math.random() * 0.5))}px`,
              background: colors[i % colors.length],
              "--dx": `${Math.round((Math.random() - 0.35) * 220)}px`,
              "--up": `${-Math.round(40 + Math.random() * 90)}px`,
              "--fall": `${Math.round(60 + Math.random() * 50)}px`,
              "--rot": `${Math.round(Math.random() * 900 - 450)}deg`,
            },
            1500
          );
        }
      },

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
      /** "ERROU!" sign; the speed line under it is left out when `speedText` is empty (boss). */
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
        el.append(title);
        if (speedText) el.append(speed);
      },

      /**
       * Comic speech bubble whose tail points down at (x, y): a character's
       * head. It stays inside the layer; the tail keeps pointing at x.
       */
      speech(x, y, text, ms = 2400) {
        const el = spawn("speech", { top: `${y}px`, "--ms": `${ms}ms` }, ms, text);
        const half = el.offsetWidth / 2;
        const left = Math.min(Math.max(x, half + 6), layer.clientWidth - half - 6);
        el.style.left = `${left}px`;
        el.style.setProperty("--tail", `${x - left}px`);
        return el;
      },

      /** Animated balloon centered horizontally, with its top edge at `y`. */
      balloon(text, y, iconName) {
        const el = spawn("balloon", { top: `${y}px` }, 2300);
        // Outline-only icons (clock) would turn into a solid disc if filled.
        const fill = iconName === "clock" ? "none" : "currentColor";
        if (iconName) el.innerHTML = icon(iconName, { size: 18, fill, className: `balloon-icon-${iconName}` });
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
