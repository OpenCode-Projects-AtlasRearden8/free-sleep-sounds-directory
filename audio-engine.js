// Built-in brown noise generator + sleep timer (browser only).
// Pure helpers are exported so Node tests can exercise the math
// without any browser APIs.

/* ------------------------------ pure helpers ------------------------------ */

// Fade-out plan: returns the total fade seconds and a curve that keeps the
// perceived level steady until the final gentle fade.
function makeFadePlan(totalSeconds, fadeSeconds) {
  const total = Math.max(1, Math.round(totalSeconds));
  const fade = Math.min(Math.max(1, Math.round(fadeSeconds)), total);
  return {
    total,
    fade,
    curve: Array.from({ length: fade }, (_, i) => (i + 1) / fade),
  };
}

function parseMinutes(input) {
  const n = Number(input);
  if (!Number.isFinite(n)) return null;
  if (n < 1 || n > 480) return null;
  return Math.round(n);
}

function remainingLabel(secondsLeft) {
  const s = Math.max(0, Math.ceil(secondsLeft));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}:${String(r).padStart(2, "0")}` : `0:${String(r).padStart(2, "0")}`;
}

// Brown noise quality: linearly increasing gain toward low frequencies.
function brownNoiseAmplitude(previous, factor) {
  const next = (previous + 0.02 * factor) / 1.02;
  return Math.max(-1, Math.min(1, next)) * 3.5;
}

/* ---------------------------- browser engine ---------------------------- */

class NoiseEngine {
  constructor() {
    this.ctx = null;
    this.source = null;
    this.gain = null;
    this.running = false;
    this.timerId = null;
    this.tickId = null;
    this.endAt = null;
    this.onState = () => {};
  }

  async start(minutes = 0, baseVolume = 0.5) {
    if (this.running) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) throw new Error("Web Audio not supported in this browser");
    this.ctx = this.ctx || new AC();
    if (this.ctx.state === "suspended") await this.ctx.resume();

    const seconds = this.ctx.sampleRate; // 1 s buffer, looped forever
    const buffer = this.ctx.createBuffer(1, seconds, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let l = 0;
    for (let i = 0; i < seconds; i++) {
      l = brownNoiseAmplitude(l, Math.random());
      data[i] = 0.28 * l; // keep headroom so the loop never clips
    }

    this.source = this.ctx.createBufferSource();
    this.source.buffer = buffer;
    this.source.loop = true;

    this.gain = this.ctx.createGain();
    this.gain.gain.value = baseVolume * 0.35; // conservative default level

    this.source.connect(this.gain).connect(this.ctx.destination);
    this.source.start();
    this.running = true;

    if (minutes > 0) this.scheduleFadeOut(minutes);
    this.onState(this.state());
  }

  scheduleFadeOut(minutes) {
    this.clearTimers();
    const fade = makeFadePlan(minutes * 60, Math.min(120, minutes * 60 - 5) || 15);
    this.endAt = Date.now() + minutes * 60 * 1000;
    this.timerId = setTimeout(() => this.fadeOutAndStop(fade.fade * 1000), (minutes * 60 - fade.fade) * 1000);
    this.tickId = setInterval(() => {
      this.onState(this.state());
    }, 1000);
  }

  async fadeOutAndStop(ms) {
    const g = this.gain && this.gain.gain;
    if (g) {
      g.cancelScheduledValues(this.ctx.currentTime);
      g.setValueAtTime(g.value, this.ctx.currentTime);
      g.linearRampToValueAtTime(0.0001, this.ctx.currentTime + ms / 1000);
    }
    setTimeout(async () => {
      await this.stop(true);
    }, ms + 50);
  }

  async stop(silent = false) {
    this.clearTimers();
    if (this.source) {
      try {
        this.source.stop();
        this.source.disconnect();
      } catch (_) {
        /* already stopped */
      }
      this.source = null;
    }
    this.running = false;
    this.endAt = null;
    if (!silent) this.onState(this.state());
  }

  clearTimers() {
    if (this.timerId) clearTimeout(this.timerId);
    if (this.tickId) clearInterval(this.tickId);
    this.timerId = null;
    this.tickId = null;
  }

  setVolume(v) {
    if (this.gain) this.gain.gain.value = Math.max(0, Math.min(1, v)) * 0.35;
  }

  state() {
    return {
      running: this.running,
      secondsLeft: this.endAt ? Math.max(0, (this.endAt - Date.now()) / 1000) : null,
      label: this.endAt ? remainingLabel((this.endAt - Date.now()) / 1000) : null,
    };
  }
}

if (typeof window !== "undefined") {
  window.NoiseEngine = NoiseEngine;
  window.makeFadePlan = makeFadePlan;
  window.parseMinutes = parseMinutes;
  window.remainingLabel = remainingLabel;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { makeFadePlan, parseMinutes, remainingLabel, brownNoiseAmplitude };
}
