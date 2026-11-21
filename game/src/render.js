// render.js — draws both panels from the scene art, paints found-difference
// markers on both pictures, and keeps the HUD (counter, timer, score) current.
import { SCENE_W, SCENE_H } from './scenes.js';

export class Renderer {
  constructor(canvasA, canvasB, elements) {
    this.canvasA = canvasA;
    this.canvasB = canvasB;
    this.ctxA = canvasA.getContext('2d');
    this.ctxB = canvasB.getContext('2d');
    this.el = elements;
  }

  drawPanels(state, time) {
    const scene = state.scene;
    const active = state.activeDiffs;
    const has = (id) => active.has(id);
    scene.draw(this.ctxA, false, has, time);
    scene.draw(this.ctxB, true, has, time);
    this.drawFoundMarkers(state, time);
    this.drawHintPulse(state, time);
    this.drawMissMarks(state, time);
  }

  drawRing(ctx, x, y, r, color, width) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawFoundMarkers(state, time) {
    const pulse = 1 + 0.08 * Math.sin(time * 0.006);
    const byId = new Map(state.scene.differences.map((diff) => [diff.id, diff]));
    for (const id of state.found) {
      const diff = byId.get(id);
      if (!diff) continue;
      const r = diff.r * pulse + 4;
      this.drawRing(this.ctxA, diff.x, diff.y, r, '#37c978', 4);
      this.drawRing(this.ctxB, diff.x, diff.y, r, '#37c978', 4);
      // A small tick inside the ring, on both panels.
      for (const ctx of [this.ctxA, this.ctxB]) {
        ctx.save();
        ctx.strokeStyle = '#37c978';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(diff.x - 7, diff.y);
        ctx.lineTo(diff.x - 1, diff.y + 6);
        ctx.lineTo(diff.x + 9, diff.y - 6);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  drawHintPulse(state, time) {
    const hint = state.hint;
    if (!hint || time - hint.startedAt > 2200) return;
    const alpha = 0.55 + 0.45 * Math.sin(time * 0.012);
    const r = hint.diff.r + 10 + 6 * Math.sin(time * 0.008);
    for (const ctx of [this.ctxA, this.ctxB]) {
      ctx.save();
      ctx.globalAlpha = Math.max(0.15, alpha);
      this.drawRing(ctx, hint.diff.x, hint.diff.y, r, '#ffd76e', 4);
      ctx.restore();
    }
  }

  drawMissMarks(state, time) {
    for (const miss of state.misses) {
      const age = time - miss.at;
      if (age > 700) continue;
      const alpha = 1 - age / 700;
      for (const ctx of [miss.side === 'a' ? this.ctxA : this.ctxB]) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#e5484d';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        const s = 9;
        ctx.beginPath();
        ctx.moveTo(miss.x - s, miss.y - s);
        ctx.lineTo(miss.x + s, miss.y + s);
        ctx.moveTo(miss.x + s, miss.y - s);
        ctx.lineTo(miss.x - s, miss.y + s);
        ctx.stroke();
        ctx.restore();
      }
    }
    state.misses = state.misses.filter((miss) => time - miss.at <= 700);
  }

  updateHud(state) {
    const total = state.activeDiffs.size;
    const found = state.found.size;
    const remain = total - found;
    this.el.foundCounter.textContent = `Found ${found} / ${total} · ${remain} remain`;
    this.el.score.textContent = `Score ${state.score}`;
    this.el.combo.textContent = state.combo > 1 ? `Combo ×${state.combo}` : 'Combo ×1';
    this.el.hintsLeft.textContent = `💡 ×${state.hintsLeft}`;
    this.el.levelName.textContent = `${state.scene.name} · Level ${state.levelIndex + 1} of ${state.levelCount}`;
    this.el.difficultyLabel.textContent = `Difficulty: ${state.difficulty.name}`;
    const seconds = Math.max(0, Math.ceil(state.timeLeft / 1000));
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    this.el.timerText.textContent = `${mm}:${ss}`;
    const fraction = Math.max(0, state.timeLeft / state.timeLimit);
    this.el.timerBar.style.width = `${fraction * 100}%`;
    this.el.timerBar.classList.toggle('low', state.timeLeft < 15000);
    this.el.btnHint.disabled = state.hintsLeft <= 0 || state.phase !== 'playing' || remain === 0;
  }

  showToast(text) {
    this.el.toast.textContent = text;
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => {
      this.el.toast.textContent = '';
    }, 2600);
  }

  shakePanel(side) {
    const canvas = side === 'a' ? this.canvasA : this.canvasB;
    canvas.classList.remove('shake');
    void canvas.offsetWidth;
    canvas.classList.add('shake');
  }
}

export function scenePointFromEvent(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * SCENE_W;
  const y = ((event.clientY - rect.top) / rect.height) * SCENE_H;
  return { x, y };
}
