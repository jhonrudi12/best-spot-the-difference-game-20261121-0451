// SoundEngine — all game sounds are synthesized with WebAudio; no audio files.
export class SoundEngine {
  constructor() {
    this.enabled = true;
    this.context = null;
    this.master = null;
  }

  ensureContext() {
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return false;
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') void this.context.resume();
    return true;
  }

  unlock() {
    this.ensureContext();
  }

  setEnabled(on) {
    this.enabled = on;
    if (on) this.ensureContext();
  }

  tone(frequency, duration, type, volume, when = 0, slideTo = null) {
    if (!this.enabled || !this.ensureContext()) return;
    const start = this.context.currentTime + when;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  // A warm two-note "found it" pop, with a little sparkle on top.
  playFound(combo = 1) {
    const lift = Math.min(combo, 8) * 24;
    this.tone(620 + lift, 0.16, 'sine', 0.5, 0, 940 + lift);
    this.tone(930 + lift, 0.22, 'triangle', 0.28, 0.05, 1240 + lift);
    this.tone(1860 + lift, 0.1, 'sine', 0.12, 0.08);
  }

  // A soft low buzz for a wrong click.
  playWrong() {
    this.tone(170, 0.22, 'sawtooth', 0.16, 0, 110);
    this.tone(120, 0.2, 'square', 0.08, 0.02, 90);
  }

  // A bright chime when a hint reveals a difference.
  playHint() {
    this.tone(1175, 0.3, 'sine', 0.3);
    this.tone(1568, 0.4, 'sine', 0.22, 0.09);
  }

  // A short tick when the timer drops under ten seconds.
  playTick() {
    this.tone(980, 0.06, 'square', 0.07);
  }

  // A rising arpeggio for clearing a level.
  playLevelClear() {
    [523, 659, 784, 1047].forEach((frequency, index) => {
      this.tone(frequency, 0.28, 'triangle', 0.32, index * 0.11);
    });
  }

  // A longer fanfare for winning the whole hunt.
  playWin() {
    [523, 659, 784, 1047, 784, 1047, 1319].forEach((frequency, index) => {
      this.tone(frequency, 0.34, 'triangle', 0.32, index * 0.13);
    });
    this.tone(262, 0.9, 'sine', 0.18, 0.1);
  }

  // A descending line for running out of time.
  playLose() {
    [392, 330, 262, 196].forEach((frequency, index) => {
      this.tone(frequency, 0.32, 'triangle', 0.28, index * 0.14);
    });
  }

  playClick() {
    this.tone(440, 0.07, 'sine', 0.18, 0, 520);
  }
}
