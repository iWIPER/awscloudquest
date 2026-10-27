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
  const RAIN_VOLUME = 0.025; // rain loop level: kept low so it never covers the game sounds
  const HEARTBEAT_FROM = 0.72; // music intensity (monster progress) where the heartbeat starts; matches CONFIG.DANGER_AT

  /**
   * Music themes: one per scenery, plus "happy" for the cheering visitor.
   * Only soft waveforms (sine/triangle): square and sawtooth sound buzzy and tire the ear.
   *   bass / plucks  note frequencies (Hz) cycled on every beat / every other beat
   *   bassWave, pluckWave  oscillator types (the "instrument")
   *   bpm   [calm, tense]: tempo goes from calm to tense as the monster gets close
   *   drone frequencies of the background pad ([] = none)
   *   tense whether the heartbeat joins near the hero
   */
  const THEMES = Object.freeze({
    // Campo: pulsing A-minor suspense (the original track).
    field: {
      bass: [55, 55, 43.65, 41.2], plucks: [440, 523.25, 659.25, 493.88],
      bassWave: "triangle", pluckWave: "sine", bpm: [70, 150], drone: [55, 55.4, 82.4], tense: true,
    },
    // Floresta: D Dorian, airy "flute" line over a soft pad.
    forest: {
      bass: [73.42, 73.42, 98, 87.31], plucks: [587.33, 698.46, 880, 783.99, 659.25, 587.33],
      bassWave: "sine", pluckWave: "triangle", bpm: [64, 138], drone: [73.42, 110], tense: true,
    },
    // Deserto: E Phrygian dominant (E F G# A B C D), soft plucked pulse.
    desert: {
      bass: [82.41, 87.31, 82.41, 103.83], plucks: [659.25, 698.46, 830.61, 880, 987.77, 830.61],
      bassWave: "triangle", pluckWave: "sine", bpm: [76, 150], drone: [82.41, 123.47], tense: true,
    },
    // Cidade: steady C-minor groove, soft keys (no harsh synths).
    city: {
      bass: [65.41, 65.41, 77.78, 98, 87.31, 65.41], plucks: [523.25, 622.25, 783.99, 622.25],
      bassWave: "triangle", pluckWave: "sine", bpm: [84, 156], drone: [65.41, 98], tense: true,
    },
    // Duel in the Wild West (original tune): a fast showdown in E minor, a
    // trumpet-like lead, a galloping guitar on every beat and a kick/snare
    // drive. No pad and no heartbeat: low sustained tones hummed on phones.
    // 0 = rest; one step per beat; one chord per bar of 4 beats.
    west: {
      bass: [
        164.81, 123.47, 164.81, 123.47, 130.81, 196, 130.81, 196, 146.83, 220, 146.83, 220, 123.47, 185, 123.47, 185,
        164.81, 123.47, 164.81, 123.47, 130.81, 196, 130.81, 196, 146.83, 220, 146.83, 220, 164.81, 123.47, 164.81, 123.47,
      ],
      plucks: [],
      lead: [
        659.25, 0, 659.25, 783.99, 880, 0, 987.77, 0, 1174.66, 987.77, 880, 783.99, 739.99, 0, 0, 0,
        659.25, 0, 659.25, 783.99, 880, 0, 987.77, 0, 1318.5, 1174.66, 987.77, 880, 987.77, 0, 0, 0,
      ],
      leadWave: "triangle",
      strum: [
        [164.81, 196, 246.94], [130.81, 164.81, 196], [146.83, 185, 220], [123.47, 155.56, 185],
        [164.81, 196, 246.94], [130.81, 164.81, 196], [146.83, 185, 220], [164.81, 196, 246.94],
      ],
      strumEvery: 1, // gallop: a strum on every beat
      drums: true,
      bassWave: "sine", pluckWave: "sine", bpm: [152, 152], drone: [], tense: false,
    },
    // Visitor with the sign: bright C-major bounce, no pad, no heartbeat.
    happy: {
      bass: [130.81, 174.61, 196, 130.81], plucks: [523.25, 659.25, 783.99, 880, 783.99, 659.25],
      bassWave: "triangle", pluckWave: "triangle", bpm: [116, 116], drone: [], tense: false,
    },
  });

  function create({ muted = false } = {}) {
    const AudioCtx = root.AudioContext || root.webkitAudioContext;
    let ctx = null;
    let master = null;
    let noiseBuffer = null;
    let isMuted = muted;

    const rain = { gain: null, wanted: false };
    const music = { on: false, intensity: 0, timer: null, nextTime: 0, beat: 0, drone: null, theme: "field", mood: null };

    // ── iOS: play even with the ring/silent switch on ──────────────────
    // iOS treats Web Audio as "ambient" sound, which the silent switch mutes.
    // Asking for the "playback" audio session (Safari 17+) makes the game behave
    // like a media player; older iOS gets the same effect while an HTML media
    // element is playing, so a silent looping clip keeps that session active.
    // The game's own mute button still silences everything.
    let silentClip = null;

    function silentWavUrl() {
      const samples = 800; // 0.1 s of silence at 8 kHz, 8-bit mono
      const buffer = new ArrayBuffer(44 + samples);
      const view = new DataView(buffer);
      const text = (offset, s) => [...s].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)));
      text(0, "RIFF");
      view.setUint32(4, 36 + samples, true);
      text(8, "WAVE");
      text(12, "fmt ");
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);      // PCM
      view.setUint16(22, 1, true);      // mono
      view.setUint32(24, 8000, true);   // sample rate
      view.setUint32(28, 8000, true);   // byte rate
      view.setUint16(32, 1, true);      // block align
      view.setUint16(34, 8, true);      // bits per sample
      text(36, "data");
      view.setUint32(40, samples, true);
      new Uint8Array(buffer, 44).fill(128); // 8-bit silence is the midpoint
      return URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
    }

    function usePlaybackSession() {
      try {
        if (root.navigator && root.navigator.audioSession) {
          root.navigator.audioSession.type = "playback";
          return;
        }
      } catch {
        /* fall back to the media element below */
      }
      if (isMuted || typeof root.Audio !== "function") return;
      if (!silentClip) {
        silentClip = new root.Audio(silentWavUrl());
        silentClip.loop = true;
        silentClip.setAttribute("playsinline", "");
      }
      if (silentClip.paused) silentClip.play().catch(() => {});
    }

    /** Creates or resumes audio. Must run inside a user gesture (tap, click, key). */
    function unlock() {
      if (!AudioCtx) return;
      if (!ctx) {
        ctx = new AudioCtx();
        master = ctx.createGain();
        master.gain.value = isMuted ? 0 : MASTER_VOLUME;
        master.connect(ctx.destination);
      }
      usePlaybackSession();
      if (ctx.state !== "running") ctx.resume().catch(() => {});
      if (rain.wanted) setRain(true);
      if (music.on && !music.timer) startScheduler();
    }

    /** True once audio is actually running (it stays suspended until a valid gesture). */
    const isRunning = () => ctx !== null && ctx.state === "running";

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
      gorilla() {
        // Roar, chest beats, then the punch.
        tone({ type: "sawtooth", from: 150, to: 70, dur: 0.55, vol: 0.16 });
        [0.15, 0.27, 0.39, 0.51].forEach((d) => tone({ type: "sine", from: 90, to: 50, dur: 0.1, vol: 0.3, at: ctx.currentTime + d }));
        burst({ dur: 0.25, vol: 0.4, freq: 180, type: "lowpass", at: ctx.currentTime + 0.85 });
        burst({ dur: 0.08, vol: 0.25, freq: 3000, type: "highpass", at: ctx.currentTime + 0.85 });
        melody([1568, 1760, 1568, 1760], { type: "sine", step: 0.09, dur: 0.08, vol: 0.04 }); // birdies
      },
      wolf() {
        tone({ type: "sine", from: 420, to: 700, dur: 0.7, vol: 0.08 }); // howl up…
        tone({ type: "sine", from: 700, to: 500, dur: 0.5, vol: 0.07, at: ctx.currentTime + 0.65 }); // …and down
        [0.5, 0.7].forEach((d) => burst({ dur: 0.1, vol: 0.28, freq: 320, at: ctx.currentTime + d }));
      },
      spider() {
        burst({ dur: 0.6, vol: 0.12, freq: 4000, type: "highpass", at: ctx.currentTime + 0.3 }); // web hiss
        [0, 0.08, 0.16, 0.24].forEach((d) => burst({ dur: 0.03, vol: 0.08, freq: 2500, at: ctx.currentTime + d })); // skitter
      },
      gator() {
        [0.15, 0.35, 0.55].forEach((d) => burst({ dur: 0.1, vol: 0.32, freq: 250, at: ctx.currentTime + d }));
        tone({ type: "sawtooth", from: 110, to: 50, dur: 0.9, vol: 0.14, at: ctx.currentTime + 0.6 });
      },
    };

    const SHOTS = {
      laser: () => tone({ type: "square", from: 900, to: 200, dur: 0.11, vol: 0.08 }),
      arrow() {
        tone({ type: "triangle", from: 260, to: 140, dur: 0.12, vol: 0.14 }); // bowstring
        burst({ dur: 0.18, vol: 0.06, freq: 2500, type: "highpass" }); // whoosh
      },
      pebble() {
        burst({ dur: 0.05, vol: 0.12, freq: 1800 }); // band snap
        tone({ type: "sine", from: 700, to: 300, dur: 0.12, vol: 0.06 });
      },
      star: () => melody([1318.5, 1760, 2093], { type: "sine", step: 0.035, dur: 0.12, vol: 0.06 }),
    };

    const SFX = {
      shoot: (kind) => (SHOTS[kind] || SHOTS.laser)(),
      ready: () => tone({ type: "triangle", from: 523.25, dur: 0.18, vol: 0.07 }),
      go: () => melody([783.99, 1046.5], { type: "triangle", step: 0.08, dur: 0.22, vol: 0.08 }),
      box() {
        tone({ type: "sawtooth", from: 180, to: 320, dur: 0.25, vol: 0.05 }); // lid creak
        melody([783.99, 987.77, 1174.66, 1567.98], { type: "triangle", step: 0.07, dur: 0.18, vol: 0.12, at: 0 });
      },
      equip: () => melody([392, 523.25], { type: "triangle", step: 0.06, dur: 0.1, vol: 0.06 }),
      bark() {
        // "Au au!": two loud, low woofs. A quick pitch rise then fall gives the
        // "w-oof", the noise band adds the breath; loud enough over the music.
        [0, 0.26].forEach((d) => {
          const at = ctx.currentTime + d;
          tone({ type: "sawtooth", from: 300, to: 420, dur: 0.05, vol: 0.18, at });
          tone({ type: "sawtooth", from: 420, to: 190, dur: 0.16, vol: 0.2, at: at + 0.05 });
          tone({ type: "triangle", from: 210, to: 120, dur: 0.18, vol: 0.22, at: at + 0.04 });
          burst({ dur: 0.14, vol: 0.2, freq: 750, q: 1.4, at });
        });
      },
      bossIntro() {
        tone({ type: "sawtooth", from: 90, to: 55, dur: 1.1, vol: 0.12 }); // low growl, kept soft
        burst({ dur: 0.9, vol: 0.06, freq: 220, type: "lowpass", at: ctx.currentTime + 0.1 });
        melody([220, 207.65, 196], { type: "triangle", step: 0.25, dur: 0.3, vol: 0.05 });
      },
      bossGrowl: () => tone({ type: "sawtooth", from: 110, to: 70, dur: 0.6, vol: 0.09 }),
      rockThrow: () => burst({ dur: 0.35, vol: 0.06, freq: 500, q: 0.7 }),
      rockHit() {
        burst({ dur: 0.2, vol: 0.18, freq: 160, type: "lowpass" });
        tone({ type: "sine", from: 200, to: 90, dur: 0.15, vol: 0.12 });
      },
      bossHurt() {
        tone({ type: "sawtooth", from: 160, to: 90, dur: 0.35, vol: 0.1 });
        burst({ dur: 0.15, vol: 0.12, freq: 1200 });
      },
      bossDefeated() {
        burst({ dur: 0.8, vol: 0.2, freq: 140, type: "lowpass" });
        melody([523.25, 659.25, 783.99, 1046.5, 1318.5], { type: "triangle", step: 0.1, dur: 0.2, vol: 0.08 });
      },
      scene: () => melody([659.25, 880, 1174.66], { type: "sine", step: 0.12, dur: 0.3, vol: 0.06 }),
      hit() {
        burst({ dur: 0.18, vol: 0.22, freq: 1800 });
        melody([659.25, 987.77], { step: 0.07, dur: 0.12, vol: 0.16 });
      },
      miss() {
        tone({ type: "sawtooth", from: 220, to: 90, dur: 0.4, vol: 0.16 });
        tone({ type: "triangle", from: 300, to: 1100, dur: 0.35, vol: 0.07, at: ctx.currentTime + 0.25 });
      },
      unlock: () => tone({ type: "sine", from: 660, to: 990, dur: 0.12, vol: 0.12 }),
      life: () => melody([523.25, 659.25, 783.99, 1046.5], { step: 0.09, dur: 0.18, vol: 0.18 }),
      bonus: () => melody([783.99, 1046.5], { step: 0.08, dur: 0.15, vol: 0.15 }),
      levelUp: () => melody([392, 523.25, 659.25], { type: "triangle", step: 0.07, dur: 0.12, vol: 0.06 }),
      attack: (monsterId) => (ATTACKS[monsterId] || ATTACKS.dino)(),
      lifeLost: () => melody([392, 329.63, 261.63], { step: 0.22, dur: 0.35, vol: 0.16 }),
      gameOver() {
        // Slow descending minor line ending on a low A.
        melody([659.25, 587.33, 523.25, 493.88, 440, 415.3], { step: 0.32, dur: 0.42, vol: 0.16 });
        tone({ type: "triangle", from: 110, dur: 1.8, vol: 0.18, at: ctx.currentTime + 1.95 });
        tone({ type: "sine", from: 220, dur: 1.8, vol: 0.08, at: ctx.currentTime + 1.95 });
      },
      record: () => melody([523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5], { type: "triangle", step: 0.11, dur: 0.16, vol: 0.08 }),
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
      // ── Duel ──
      tick: () => tone({ type: "square", from: 1800, dur: 0.03, vol: 0.05 }),
      draw() {
        // "SAQUE!": a ricochet whistle over a low hit.
        tone({ type: "sine", from: 2400, to: 900, dur: 0.45, vol: 0.06 });
        burst({ dur: 0.3, vol: 0.18, freq: 200, type: "lowpass" });
      },
      bang() {
        // Gunshot with a canyon echo.
        burst({ dur: 0.16, vol: 0.32, freq: 1400, q: 0.5 });
        burst({ dur: 0.35, vol: 0.2, freq: 220, type: "lowpass" });
        [0.28, 0.56].forEach((d, i) => burst({ dur: 0.3, vol: 0.09 / (i + 1), freq: 700, q: 0.6, at: ctx.currentTime + d }));
      },
      ouch() {
        // A short "ai!": a voice-like drop through a vowel-ish band.
        tone({ type: "sawtooth", from: 620, to: 330, dur: 0.22, vol: 0.06 });
        tone({ type: "sine", from: 900, to: 500, dur: 0.2, vol: 0.05 });
      },
      laugh() {
        // "Ha ha ha": three bouncing syllables.
        [0, 0.17, 0.34].forEach((d, i) => tone({ type: "triangle", from: 440 - i * 30, to: 380 - i * 30, dur: 0.12, vol: 0.08, at: ctx.currentTime + d }));
      },
      drum() {
        // "Tum… tum!" for the round presentation: two low drum hits and a cymbal.
        [0, 0.32].forEach((d, i) => {
          tone({ type: "sine", from: 150 - i * 20, to: 60, dur: 0.35, vol: 0.28, at: ctx.currentTime + d });
          burst({ dur: 0.18, vol: 0.16, freq: 180, type: "lowpass", at: ctx.currentTime + d });
        });
        burst({ dur: 0.7, vol: 0.06, freq: 6500, type: "highpass", at: ctx.currentTime + 0.32 });
      },
      joined: () => melody([523.25, 659.25, 783.99], { type: "triangle", step: 0.1, dur: 0.18, vol: 0.08 }),
      fanfare() {
        melody([523.25, 523.25, 523.25, 659.25, 783.99, 659.25, 783.99, 1046.5], { type: "triangle", step: 0.14, dur: 0.2, vol: 0.1 });
        tone({ type: "sine", from: 130.81, dur: 1.4, vol: 0.12, at: ctx.currentTime + 1 });
      },
      defeat: () => melody([392, 369.99, 349.23, 329.63], { type: "triangle", step: 0.36, dur: 0.42, vol: 0.09 }),
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
      rain.gain.gain.setTargetAtTime(on ? RAIN_VOLUME : 0, ctx.currentTime, 0.9);
    }

    // ── Music ───────────────────────────────────────────────────────────
    // A theme (see THEMES) per scenery: a bass line over a soft pad. Tempo,
    // pad brightness and a heartbeat follow `intensity` (0 = monster far,
    // 1 = at the hero). A "mood" (the happy theme) can temporarily replace it.
    const currentTheme = () => THEMES[music.mood || music.theme] || THEMES.field;

    function startDrone() {
      const freqs = currentTheme().drone;
      if (freqs.length === 0) return;
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 280;
      gain.gain.value = 0;
      const oscs = freqs.map((f, k) => {
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.value = f;
        osc.detune.value = k === 0 ? -6 : 6; // slight detune for a fuller pad
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

    /**
     * Soft "lub-dub" while the field is red. Phone speakers cannot reproduce
     * the 40–70 Hz of a real heartbeat, so each thump is a 150→90 Hz tone plus
     * a muffled click, which small speakers can play. Kept quiet on purpose.
     */
    function heartbeat(at) {
      tone({ type: "sine", from: 150, to: 90, dur: 0.11, vol: 0.13, at });
      burst({ dur: 0.07, vol: 0.06, freq: 320, type: "lowpass", at });
      tone({ type: "sine", from: 135, to: 85, dur: 0.1, vol: 0.09, at: at + 0.17 });
    }

    function scheduleBeat(at) {
      const theme = currentTheme();
      const i = theme.tense ? music.intensity : 0;
      const beat = music.beat++;
      tone({ type: theme.bassWave, from: theme.bass[beat % theme.bass.length], dur: 0.32, vol: (theme.bassWave === "triangle" || theme.bassWave === "sine" ? 0.2 : 0.07) + 0.08 * i, at });
      if (beat % 2 === 1 && theme.plucks.length) {
        tone({ type: theme.pluckWave, from: theme.plucks[(beat >> 1) % theme.plucks.length], dur: 0.25, vol: (theme.pluckWave === "sine" ? 0.035 : 0.02) + 0.03 * i, at });
      }
      if (theme.lead) {
        // Lead line: a whistle (sine sliding into the note) or a short brassy triangle.
        const note = theme.lead[beat % theme.lead.length];
        const brass = theme.leadWave === "triangle";
        if (note) tone({ type: brass ? "triangle" : "sine", from: note * (brass ? 1 : 0.97), to: note, dur: brass ? 0.3 : 0.42, vol: brass ? 0.065 : 0.075, at });
      }
      if (theme.drums) {
        // Kick on the beat, snare on the off-beat.
        if (beat % 2 === 0) tone({ type: "sine", from: 130, to: 55, dur: 0.16, vol: 0.18, at });
        else burst({ dur: 0.09, vol: 0.06, freq: 2600, type: "highpass", at });
      }
      if (theme.strum && beat % (theme.strumEvery || 2) === 0) {
        // Guitar strum: the chord's notes a few milliseconds apart.
        const chord = theme.strum[Math.floor(beat / 4) % theme.strum.length];
        chord.forEach((f, k) => tone({ type: "triangle", from: f, dur: 0.22, vol: 0.035, at: at + k * 0.018 }));
      }
      if (theme.tense && i > HEARTBEAT_FROM) heartbeat(at);
    }

    function startScheduler() {
      music.nextTime = ctx.currentTime + 0.1;
      if (!music.drone) startDrone();
      music.timer = setInterval(() => {
        if (!music.on || !ctx) return;
        const theme = currentTheme();
        const i = theme.tense ? music.intensity : 0;
        const bpm = theme.bpm[0] + (theme.bpm[1] - theme.bpm[0]) * i;
        // After a stall (hidden tab, busy phone) skip the missed beats instead of playing them all at once.
        if (music.nextTime < ctx.currentTime) music.nextTime = ctx.currentTime + 0.05;
        while (music.nextTime < ctx.currentTime + 0.2) {
          if (!isMuted) scheduleBeat(music.nextTime);
          music.nextTime += 60 / bpm;
        }
        if (music.drone) music.drone.filter.frequency.setTargetAtTime(280 + 420 * i, ctx.currentTime, 0.3); // stays mellow even at full tension
      }, 60);
    }

    /** Swaps the pad when the theme or mood changes (the beat follows on its own). */
    function refreshTheme() {
      if (!ctx || !music.on) return;
      stopDrone();
      startDrone();
      music.beat = 0;
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

    /** Scenery theme: "field" | "forest" | "desert" | "city". */
    function setTheme(name) {
      if (!THEMES[name] || music.theme === name) return;
      music.theme = name;
      if (!music.mood) refreshTheme();
    }

    /** Temporary mood over the scenery theme ("happy"), or null to go back. */
    function setMood(name) {
      const next = THEMES[name] ? name : null;
      if (music.mood === next) return;
      music.mood = next;
      refreshTheme();
    }

    function setIntensity(value) {
      music.intensity = Math.max(0, Math.min(1, value));
    }

    function setMuted(value) {
      isMuted = value;
      if (master) master.gain.setTargetAtTime(value ? 0 : MASTER_VOLUME, ctx.currentTime, 0.05);
      if (value) {
        if (silentClip) silentClip.pause();
      } else if (ctx) {
        usePlaybackSession(); // called from the mute button's click, which is a user gesture
      }
    }

    return Object.freeze({
      unlock,
      isRunning,
      play,
      setRain,
      startMusic,
      stopMusic,
      setTheme,
      setMood,
      setIntensity,
      setMuted,
      isMuted: () => isMuted,
    });
  }

  const NS = (root.AwsCloudQuest = root.AwsCloudQuest || {});
  NS.sound = Object.freeze({ create });
})(typeof window !== "undefined" ? window : globalThis);
