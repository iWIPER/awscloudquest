/**
 * AWS Cloud Quest — sound, synthesized with the Web Audio API.
 *
 * No audio files: every effect, the rain loop and the suspense music are
 * generated in code, so the game stays a few kilobytes and works offline.
 *
 * Browsers only allow audio after a user gesture, so nothing is created until
 * unlock() is called from a click or key press. Every public call is safe
 * before that (and when Web Audio is missing): it simply does nothing.
 */
(function (root) {
  "use strict";

  const MASTER_VOLUME = 0.6;

  // A-minor material for the suspense loop (Hz).
  const BASS = [55, 55, 43.65, 41.2];         // A1 A1 F1 E1
  const PLUCKS = [440, 523.25, 659.25, 493.88]; // A4 C5 E5 B4

  function create({ muted = false } = {}) {
    const AudioCtx = root.AudioContext || root.webkitAudioContext;
    let ctx = null;
    let master = null;
    let noiseBuffer = null;
    let isMuted = muted;

    const rain = { gain: null, wanted: false };
    const music = { on: false, intensity: 0, timer: null, nextTime: 0, beat: 0, drone: null };

    function unlock() {
      if (!AudioCtx) return;
      if (!ctx) {
        ctx = new AudioCtx();
        master = ctx.createGain();
        master.gain.value = isMuted ? 0 : MASTER_VOLUME;
        master.connect(ctx.destination);
      }
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      if (rain.wanted) setRain(true);
      if (music.on && !music.timer) startScheduler();
    }

    const ready = () => ctx !== null && !isMuted;

    function noise() {
      if (!noiseBuffer) {
        noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      }
      return noiseBuffer;
    }

    /** One oscillator note with a quick attack and exponential decay. */
    function tone({ type = "sine", from, to = from, dur = 0.15, vol = 0.2, at = 0 }) {
      const t = (at || ctx.currentTime) + 0.005;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(from, t);
      if (to !== from) osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + dur);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(vol, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(master);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    }

    /** Filtered noise burst (hits, chomps, hiss, fire, thunder). */
    function burst({ dur = 0.25, vol = 0.2, freq = 1000, type = "bandpass", q = 1, at = 0 }) {
      const t = (at || ctx.currentTime) + 0.005;
      const src = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      src.buffer = noise();
      filter.type = type;
      filter.frequency.value = freq;
      filter.Q.value = q;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(vol, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(filter).connect(gain).connect(master);
      src.start(t, Math.random());
      src.stop(t + dur + 0.05);
    }

    const melody = (notes, { type = "triangle", step = 0.12, dur = 0.16, vol = 0.18 } = {}) =>
      notes.forEach((f, i) => tone({ type, from: f, dur, vol, at: ctx.currentTime + i * step }));

    // ── Effects ─────────────────────────────────────────────────────────
    const ATTACKS = {
      dino() {
        tone({ type: "sawtooth", from: 140, to: 60, dur: 0.6, vol: 0.18 });
        [0.2, 0.45, 0.7].forEach((d) => burst({ dur: 0.12, vol: 0.3, freq: 300, at: ctx.currentTime + d }));
      },
      dragon() {
        tone({ type: "sawtooth", from: 180, to: 90, dur: 0.5, vol: 0.14 });
        burst({ dur: 1.3, vol: 0.28, freq: 600, q: 0.6, at: ctx.currentTime + 0.35 });
      },
      snake() {
        burst({ dur: 1.4, vol: 0.18, freq: 6000, type: "highpass", at: ctx.currentTime + 0.1 });
        tone({ type: "triangle", from: 90, to: 70, dur: 1.2, vol: 0.12, at: ctx.currentTime + 0.5 });
      },
      gator() {
        [0.15, 0.35, 0.55].forEach((d) => burst({ dur: 0.1, vol: 0.32, freq: 250, at: ctx.currentTime + d }));
        tone({ type: "sawtooth", from: 110, to: 50, dur: 0.9, vol: 0.14, at: ctx.currentTime + 0.6 });
      },
    };

    const SFX = {
      shoot: () => tone({ type: "square", from: 900, to: 200, dur: 0.11, vol: 0.08 }),
      hit() {
        burst({ dur: 0.18, vol: 0.22, freq: 1800 });
        melody([659.25, 987.77], { step: 0.07, dur: 0.12, vol: 0.16 });
      },
      miss() {
        tone({ type: "sawtooth", from: 220, to: 90, dur: 0.4, vol: 0.16 });
        tone({ type: "square", from: 300, to: 1100, dur: 0.35, vol: 0.05, at: ctx.currentTime + 0.25 });
      },
      unlock: () => tone({ type: "sine", from: 660, to: 990, dur: 0.12, vol: 0.12 }),
      life: () => melody([523.25, 659.25, 783.99, 1046.5], { step: 0.09, dur: 0.18, vol: 0.18 }),
      bonus: () => melody([783.99, 1046.5], { step: 0.08, dur: 0.15, vol: 0.15 }),
      levelUp: () => melody([392, 523.25, 659.25], { type: "square", step: 0.07, dur: 0.12, vol: 0.06 }),
      attack: (monsterId) => (ATTACKS[monsterId] || ATTACKS.dino)(),
      lifeLost: () => melody([392, 329.63, 261.63], { step: 0.22, dur: 0.35, vol: 0.16 }),
      gameOver() {
        // Slow descending minor line ending on a low A.
        melody([659.25, 587.33, 523.25, 493.88, 440, 415.3], { step: 0.32, dur: 0.42, vol: 0.16 });
        tone({ type: "triangle", from: 110, dur: 1.8, vol: 0.18, at: ctx.currentTime + 1.95 });
        tone({ type: "sine", from: 220, dur: 1.8, vol: 0.08, at: ctx.currentTime + 1.95 });
      },
      record: () => melody([523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5], { type: "square", step: 0.11, dur: 0.16, vol: 0.08 }),
      freeze() {
        // Glassy, descending sparkle.
        melody([2093, 1760, 1568, 1319, 1047], { type: "sine", step: 0.05, dur: 0.25, vol: 0.09 });
        burst({ dur: 0.5, vol: 0.08, freq: 7000, type: "highpass" });
      },
      thaw() {
        burst({ dur: 0.18, vol: 0.25, freq: 3500, type: "highpass" });
        burst({ dur: 0.12, vol: 0.2, freq: 2500, at: ctx.currentTime + 0.08 });
      },
      skip() {
        // Whoosh: a noise band sweeping up.
        const t = ctx.currentTime;
        const src = ctx.createBufferSource();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        src.buffer = noise();
        filter.type = "bandpass";
        filter.Q.value = 2;
        filter.frequency.setValueAtTime(400, t);
        filter.frequency.exponentialRampToValueAtTime(4000, t + 0.35);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.3, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
        src.connect(filter).connect(gain).connect(master);
        src.start(t);
        src.stop(t + 0.45);
        tone({ type: "triangle", from: 523.25, to: 1046.5, dur: 0.25, vol: 0.08 });
      },
      chirp() {
        const n = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < n; i++) {
          const base = 2600 + Math.random() * 900;
          tone({ type: "sine", from: base, to: base * 1.35, dur: 0.07, vol: 0.05, at: ctx.currentTime + i * 0.11 });
        }
      },
      cricket() {
        for (let i = 0; i < 3; i++) tone({ type: "sine", from: 4200, dur: 0.04, vol: 0.025, at: ctx.currentTime + i * 0.06 });
      },
      thunder() {
        burst({ dur: 2.2, vol: 0.35, freq: 120, type: "lowpass", at: ctx.currentTime + 0.15 });
        burst({ dur: 0.4, vol: 0.2, freq: 900, type: "lowpass" });
      },
    };

    function play(name, ...args) {
      if (!ready() || !SFX[name]) return;
      try {
        SFX[name](...args);
      } catch {
        /* never let sound break the game */
      }
    }

    // ── Rain loop ───────────────────────────────────────────────────────
    function setRain(on) {
      rain.wanted = on;
      if (!ctx) return;
      if (!rain.gain) {
        const src = ctx.createBufferSource();
        const filter = ctx.createBiquadFilter();
        rain.gain = ctx.createGain();
        src.buffer = noise();
        src.loop = true;
        filter.type = "lowpass";
        filter.frequency.value = 2200;
        rain.gain.gain.value = 0;
        src.connect(filter).connect(rain.gain).connect(master);
        src.start();
      }
      rain.gain.gain.setTargetAtTime(on ? 0.1 : 0, ctx.currentTime, 0.9);
    }

    // ── Suspense music ──────────────────────────────────────────────────
    // A pulsing A-minor bass line over a low drone. Tempo, drone brightness
    // and a heartbeat follow `intensity` (0 = monster far, 1 = at the hero).
    function startDrone() {
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 280;
      gain.gain.value = 0;
      const oscs = [55, 55.4, 82.4].map((f) => {
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.value = f;
        osc.connect(filter);
        osc.start();
        return osc;
      });
      filter.connect(gain).connect(master);
      gain.gain.setTargetAtTime(0.035, ctx.currentTime, 1.5);
      music.drone = { gain, filter, oscs };
    }

    function stopDrone() {
      if (!music.drone) return;
      const { gain, oscs } = music.drone;
      gain.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
      oscs.forEach((o) => o.stop(ctx.currentTime + 2));
      music.drone = null;
    }

    function scheduleBeat(at) {
      const i = music.intensity;
      const beat = music.beat++;
      tone({ type: "triangle", from: BASS[beat % BASS.length], dur: 0.32, vol: 0.2 + 0.1 * i, at });
      if (beat % 2 === 1) {
        tone({ type: "sine", from: PLUCKS[(beat >> 1) % PLUCKS.length], dur: 0.25, vol: 0.035 + 0.03 * i, at });
      }
      if (i > 0.72) {
        // Heartbeat: two low thumps.
        tone({ type: "sine", from: 70, to: 45, dur: 0.12, vol: 0.28, at });
        tone({ type: "sine", from: 70, to: 45, dur: 0.12, vol: 0.2, at: at + 0.16 });
      }
    }

    function startScheduler() {
      music.nextTime = ctx.currentTime + 0.1;
      if (!music.drone) startDrone();
      music.timer = setInterval(() => {
        if (!music.on || !ctx) return;
        const bpm = 70 + 80 * music.intensity;
        while (music.nextTime < ctx.currentTime + 0.2) {
          if (!isMuted) scheduleBeat(music.nextTime);
          music.nextTime += 60 / bpm;
        }
        if (music.drone) music.drone.filter.frequency.setTargetAtTime(280 + 900 * music.intensity, ctx.currentTime, 0.3);
      }, 60);
    }

    function startMusic() {
      music.on = true;
      music.intensity = 0;
      if (ctx && !music.timer) startScheduler();
    }

    function stopMusic() {
      music.on = false;
      clearInterval(music.timer);
      music.timer = null;
      if (ctx) stopDrone();
    }

    function setIntensity(value) {
      music.intensity = Math.max(0, Math.min(1, value));
    }

    function setMuted(value) {
      isMuted = value;
      if (master) master.gain.setTargetAtTime(value ? 0 : MASTER_VOLUME, ctx.currentTime, 0.05);
    }

    return Object.freeze({
      unlock,
      play,
      setRain,
      startMusic,
      stopMusic,
      setIntensity,
      setMuted,
      isMuted: () => isMuted,
    });
  }

  const NS = (root.AwsCloudQuest = root.AwsCloudQuest || {});
  NS.sound = Object.freeze({ create });
})(typeof window !== "undefined" ? window : globalThis);
