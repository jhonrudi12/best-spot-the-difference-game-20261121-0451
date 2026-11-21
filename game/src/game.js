// game.js — the hunt itself: levels, timer, scoring, hints, combos and the
// win / lose flow. Pure game logic; rendering lives in render.js.
import { SCENES } from './scenes.js';

export const DIFFICULTIES = {
  easy: { id: 'easy', name: 'Easy', diffCount: 5, timeLimit: 180000, hints: 4 },
  normal: { id: 'normal', name: 'Normal', diffCount: 7, timeLimit: 150000, hints: 3 },
  hard: { id: 'hard', name: 'Hard', diffCount: 9, timeLimit: 120000, hints: 2 },
};

export class SpotGame {
  constructor(sound) {
    this.sound = sound;
    this.difficulty = DIFFICULTIES.normal;
    this.levelIndex = 0;
    this.score = 0;
    this.totalFound = 0;
    this.phase = 'menu'; // menu | playing | level-clear | level-fail | won
    this.found = new Set();
    this.hint = null;
    this.misses = [];
    this.combo = 1;
    this.bestCombo = 1;
    this.timeLeft = 0;
    this.timeLimit = 0;
    this.hintsLeft = 0;
    this.lastTickSecond = -1;
    this.stars = 0;
    this.onEvent = null; // (eventName, payload) => void
  }

  get scene() {
    return SCENES[this.levelIndex];
  }

  get levelCount() {
    return SCENES.length;
  }

  get activeDiffs() {
    return new Set(this.scene.differences.slice(0, this.difficulty.diffCount).map((d) => d.id));
  }

  activeDifferenceList() {
    return this.scene.differences.slice(0, this.difficulty.diffCount);
  }

  startRun(difficultyId = this.difficulty.id) {
    this.difficulty = DIFFICULTIES[difficultyId] || DIFFICULTIES.normal;
    this.levelIndex = 0;
    this.score = 0;
    this.totalFound = 0;
    this.bestCombo = 1;
    this.startLevel();
  }

  startLevel() {
    this.found = new Set();
    this.hint = null;
    this.misses = [];
    this.combo = 1;
    this.timeLimit = this.difficulty.timeLimit;
    this.timeLeft = this.timeLimit;
    this.hintsLeft = this.difficulty.hints;
    this.lastTickSecond = -1;
    this.phase = 'playing';
    this.emit('level-start', { scene: this.scene });
  }

  restartLevel() {
    this.startLevel();
  }

  setDifficulty(difficultyId) {
    if (DIFFICULTIES[difficultyId]) this.difficulty = DIFFICULTIES[difficultyId];
  }

  emit(name, payload) {
    if (this.onEvent) this.onEvent(name, payload);
  }

  // A click at scene coordinates. Returns 'found' | 'miss' | 'ignored'.
  clickAt(x, y, side, now) {
    if (this.phase !== 'playing') return 'ignored';
    const target = this.activeDifferenceList().find((diff) => {
      if (this.found.has(diff.id)) return false;
      const dx = diff.x - x;
      const dy = diff.y - y;
      return dx * dx + dy * dy <= diff.r * diff.r;
    });
    if (target) {
      this.found.add(target.id);
      this.totalFound += 1;
      const timeBonus = Math.round(this.timeLeft / 1000);
      const gained = 100 + timeBonus + (this.combo - 1) * 25;
      this.score += gained;
      this.combo += 1;
      this.bestCombo = Math.max(this.bestCombo, this.combo - 1);
      this.sound.playFound(this.combo);
      this.emit('found', { diff: target, gained, remain: this.activeDiffs.size - this.found.size });
      if (this.found.size === this.activeDiffs.size) this.clearLevel();
      return 'found';
    }
    this.combo = 1;
    this.timeLeft = Math.max(0, this.timeLeft - 5000);
    this.misses.push({ x, y, side, at: now });
    this.sound.playWrong();
    this.emit('miss', { x, y });
    return 'miss';
  }

  useHint(now) {
    if (this.phase !== 'playing' || this.hintsLeft <= 0) return null;
    const remaining = this.activeDifferenceList().filter((diff) => !this.found.has(diff.id));
    if (remaining.length === 0) return null;
    const pick = remaining[Math.floor(Math.random() * remaining.length)];
    this.hintsLeft -= 1;
    this.score = Math.max(0, this.score - 50);
    this.hint = { diff: pick, startedAt: now };
    this.sound.playHint();
    this.emit('hint', { diff: pick });
    return pick;
  }

  update(deltaMs) {
    if (this.phase !== 'playing') return;
    this.timeLeft -= deltaMs;
    const seconds = Math.ceil(this.timeLeft / 1000);
    if (this.timeLeft <= 10000 && seconds !== this.lastTickSecond && this.timeLeft > 0) {
      this.lastTickSecond = seconds;
      this.sound.playTick();
    }
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.failLevel();
    }
  }

  clearLevel() {
    const timeBonus = Math.round(this.timeLeft / 1000) * 10;
    this.score += timeBonus;
    this.phase = 'level-clear';
    this.sound.playLevelClear();
    this.emit('level-clear', {
      scene: this.scene,
      timeBonus,
      isLast: this.levelIndex === SCENES.length - 1,
    });
  }

  nextLevel() {
    if (this.levelIndex < SCENES.length - 1) {
      this.levelIndex += 1;
      this.startLevel();
    }
  }

  failLevel() {
    this.phase = 'level-fail';
    this.sound.playLose();
    this.emit('level-fail', { scene: this.scene, found: this.found.size, total: this.activeDiffs.size });
  }

  winRun() {
    this.phase = 'won';
    const foundTotal = this.totalFound;
    this.stars = foundTotal >= 24 ? 3 : foundTotal >= 18 ? 2 : 1;
    this.sound.playWin();
    this.emit('won', { score: this.score, stars: this.stars, found: foundTotal });
  }

  finishAfterLastClear() {
    this.winRun();
  }
}
