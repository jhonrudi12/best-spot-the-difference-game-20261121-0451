// input.js — mouse clicks on either panel and a keyboard-driven reticle, so
// the hunt plays with mouse, keyboard, or both.
import { SCENE_W, SCENE_H } from './scenes.js';
import { scenePointFromEvent } from './render.js';

export class InputController {
  constructor(canvasA, canvasB, reticleEl, callbacks) {
    this.canvasA = canvasA;
    this.canvasB = canvasB;
    this.reticle = reticleEl;
    this.cb = callbacks;
    // The reticle starts over the left panel's centre.
    this.reticlePos = { x: SCENE_W / 2, y: SCENE_H / 2, side: 'a' };
    this.reticleVisible = false;
    this.attach();
  }

  attach() {
    for (const [canvas, side] of [[this.canvasA, 'a'], [this.canvasB, 'b']]) {
      canvas.addEventListener('pointerdown', (event) => {
        const point = scenePointFromEvent(event, canvas);
        this.moveReticleTo(point.x, point.y, side);
        this.cb.onPanelClick(point.x, point.y, side);
      });
      canvas.addEventListener('pointermove', (event) => {
        if (event.pointerType !== 'mouse') return;
        const point = scenePointFromEvent(event, canvas);
        this.moveReticleTo(point.x, point.y, side);
      });
    }
    document.addEventListener('keydown', (event) => this.onKeyDown(event));
  }

  canvasForSide(side) {
    return side === 'a' ? this.canvasA : this.canvasB;
  }

  moveReticleTo(x, y, side) {
    this.reticlePos = { x, y, side };
    this.reticleVisible = true;
    this.positionReticle();
  }

  positionReticle() {
    const canvas = this.canvasForSide(this.reticlePos.side);
    const rect = canvas.getBoundingClientRect();
    const stage = document.getElementById('stage').getBoundingClientRect();
    const left = rect.left - stage.left + (this.reticlePos.x / SCENE_W) * rect.width;
    const top = rect.top - stage.top + (this.reticlePos.y / SCENE_H) * rect.height;
    this.reticle.style.display = this.reticleVisible ? 'block' : 'none';
    this.reticle.style.left = `${left}px`;
    this.reticle.style.top = `${top}px`;
  }

  onKeyDown(event) {
    const step = event.shiftKey ? 48 : 16;
    const pos = this.reticlePos;
    let handled = true;
    switch (event.key) {
      case 'ArrowLeft':
        pos.x -= step;
        if (pos.x < 0 && pos.side === 'b') { pos.side = 'a'; pos.x = SCENE_W + pos.x; }
        pos.x = Math.max(0, pos.x);
        break;
      case 'ArrowRight':
        pos.x += step;
        if (pos.x > SCENE_W && pos.side === 'a') { pos.side = 'b'; pos.x -= SCENE_W; }
        pos.x = Math.min(SCENE_W, pos.x);
        break;
      case 'ArrowUp':
        pos.y = Math.max(0, pos.y - step);
        break;
      case 'ArrowDown':
        pos.y = Math.min(SCENE_H, pos.y + step);
        break;
      case ' ':
      case 'Enter':
        if (this.reticleVisible || event.key === 'Enter') {
          this.cb.onPanelClick(pos.x, pos.y, pos.side);
        }
        break;
      default:
        handled = false;
    }
    if (handled) {
      event.preventDefault();
      this.reticleVisible = true;
      this.positionReticle();
      if (event.key.startsWith('Arrow')) this.cb.onReticleMove();
    }
  }
}
