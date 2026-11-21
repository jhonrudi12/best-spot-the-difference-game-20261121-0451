// main.js — boots Twin Lanterns: wires the game, renderer, input and sound,
// runs the animation loop, and owns the menu / level / victory overlays.
import { SoundEngine } from './audio.js';
import { SpotGame, DIFFICULTIES } from './game.js';
import { Renderer } from './render.js';
import { InputController } from './input.js';
import { shotNameFromUrl, applyShotState } from './shots.js';
import { SCENES } from './scenes.js';

const $ = (id) => document.getElementById(id);

const sound = new SoundEngine();
const game = new SpotGame(sound);
const renderer = new Renderer($('canvas-a'), $('canvas-b'), {
  foundCounter: $('found-counter'),
  score: $('score'),
  combo: $('combo'),
  hintsLeft: $('hints-left'),
  levelName: $('level-name'),
  difficultyLabel: $('difficulty-label'),
  timerText: $('timer-text'),
  timerBar: $('timer-bar'),
  toast: $('toast'),
  btnHint: $('btn-hint'),
});

const overlay = $('overlay');
const overlayTitle = $('overlay-title');
const overlayText = $('overlay-text');
const overlayStats = $('overlay-stats');
const overlayButtons = $('overlay-buttons');
const overlayKeys = $('overlay-keys');

function showOverlay({ title, text, stats = '', buttons = [], keys = '' }) {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  overlayStats.textContent = stats;
  overlayKeys.textContent = keys;
  overlayButtons.innerHTML = '';
  for (const button of buttons) {
    const el = document.createElement('button');
    el.type = 'button';
    el.textContent = button.label;
    if (button.secondary) el.classList.add('secondary');
    el.addEventListener('click', () => {
      sound.unlock();
      sound.playClick();
      button.onClick();
    });
    overlayButtons.appendChild(el);
  }
  overlay.classList.remove('hidden');
}

function hideOverlay() {
  overlay.classList.add('hidden');
}

function difficultyButtons(current) {
  return Object.values(DIFFICULTIES).map((d) => ({
    label: `${d.name} — ${d.diffCount} differences, ${Math.round(d.timeLimit / 60000)}:${String((d.timeLimit / 1000) % 60).padStart(2, '0')} per level`,
    secondary: d.id !== current,
    onClick: () => {
      game.setDifficulty(d.id);
      game.startRun(d.id);
      hideOverlay();
    },
  }));
}

function showMenu() {
  game.phase = 'menu';
  showOverlay({
    title: '🏮 Twin Lanterns',
    text: 'Two pictures hang side by side — but they are not quite the same. '
      + 'Find every difference before the lanterns burn down.\n\n'
      + 'Three hand-drawn scenes: Harbour at Dusk, the Lantern Market, and the Moonlit Garden. '
      + 'Click a difference on either picture to ring it. Wrong clicks cost 5 seconds.',
    stats: `Best combo so far: ×${game.bestCombo}`,
    buttons: difficultyButtons(game.difficulty.id),
    keys: 'Click or arrow keys + Space to hunt · H hint · M sound · R restart · Esc menu',
  });
}

function showLevelClear(payload) {
  if (payload.isLast) {
    game.finishAfterLastClear();
    return;
  }
  showOverlay({
    title: `✨ ${payload.scene.name} — cleared!`,
    text: `You found every difference in ${payload.scene.name}.`,
    stats: `Time bonus +${payload.timeBonus} points\nScore ${game.score}`,
    buttons: [
      {
        label: 'Next scene →',
        onClick: () => {
          game.nextLevel();
          hideOverlay();
        },
      },
      { label: 'Replay this scene', secondary: true, onClick: () => { game.restartLevel(); hideOverlay(); } },
    ],
    keys: 'Press N for the next scene · R to replay',
  });
}

function showLevelFail(payload) {
  showOverlay({
    title: '⏳ Time ran out',
    text: `The lanterns burned down in ${payload.scene.name} — you found ${payload.found} of ${payload.total} differences.`,
    stats: `Score ${game.score}`,
    buttons: [
      { label: 'Try this scene again', onClick: () => { game.restartLevel(); hideOverlay(); } },
      { label: 'Back to menu', secondary: true, onClick: () => showMenu() },
    ],
    keys: 'Press R to retry the scene',
  });
}

function showWin(payload) {
  const stars = '⭐'.repeat(payload.stars) + '☆'.repeat(3 - payload.stars);
  showOverlay({
    title: '🎉 You found them all!',
    text: 'Every difference in all three scenes — the harbour, the market and the garden — is ringed. '
      + 'The twin lanterns shine the same again.',
    stats: `${stars}\nFinal score ${payload.score} · ${payload.found} differences found`,
    buttons: [
      { label: 'Play again', onClick: () => { game.startRun(game.difficulty.id); hideOverlay(); } },
      { label: 'Harder run', secondary: true, onClick: () => { game.startRun('hard'); hideOverlay(); } },
      { label: 'Menu', secondary: true, onClick: () => showMenu() },
    ],
    keys: 'Press Enter to play again',
  });
}

game.onEvent = (name, payload) => {
  switch (name) {
    case 'found':
      renderer.showToast(`Found ${payload.diff.name}! +${payload.gained} points — ${payload.remain} remain`);
      break;
    case 'miss':
      renderer.showToast('Not a difference — 5 seconds lost!');
      break;
    case 'hint':
      renderer.showToast(`Hint: look near ${payload.diff.name}…`);
      break;
    case 'level-clear':
      showLevelClear(payload);
      break;
    case 'level-fail':
      showLevelFail(payload);
      break;
    case 'won':
      showWin(payload);
      break;
    default:
      break;
  }
};

const input = new InputController($('canvas-a'), $('canvas-b'), $('reticle'), {
  onPanelClick: (x, y, side) => {
    sound.unlock();
    const now = performance.now();
    const result = game.clickAt(x, y, side, now);
    if (result === 'miss') renderer.shakePanel(side);
  },
  onReticleMove: () => sound.unlock(),
});

$('btn-hint').addEventListener('click', () => {
  sound.unlock();
  game.useHint(performance.now());
});
$('btn-sound').addEventListener('click', () => {
  sound.setEnabled(!sound.enabled);
  $('btn-sound').textContent = sound.enabled ? '🔊 Sound M' : '🔇 Muted M';
  renderer.showToast(sound.enabled ? 'Sound on' : 'Sound muted');
});
$('btn-restart').addEventListener('click', () => {
  sound.unlock();
  if (game.phase === 'playing' || game.phase === 'level-fail') {
    game.restartLevel();
    hideOverlay();
    renderer.showToast('Scene restarted');
  }
});
$('btn-menu').addEventListener('click', () => {
  sound.unlock();
  showMenu();
});

document.addEventListener('keydown', (event) => {
  if (event.target && (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA')) return;
  const key = event.key.toLowerCase();
  if (key === 'h') {
    sound.unlock();
    game.useHint(performance.now());
  } else if (key === 'm') {
    sound.setEnabled(!sound.enabled);
    $('btn-sound').textContent = sound.enabled ? '🔊 Sound M' : '🔇 Muted M';
  } else if (key === 'r') {
    if (game.phase === 'playing' || game.phase === 'level-fail') {
      game.restartLevel();
      hideOverlay();
    }
  } else if (key === 'n' && game.phase === 'level-clear') {
    game.nextLevel();
    hideOverlay();
  } else if (key === 'escape') {
    if (game.phase === 'playing') showMenu();
    else if (game.phase === 'menu') { game.startRun(game.difficulty.id); hideOverlay(); }
  } else if (key === 'enter' && (game.phase === 'menu' || game.phase === 'won')) {
    game.startRun(game.difficulty.id);
    hideOverlay();
  } else if (game.phase === 'menu' && ['1', '2', '3'].includes(key)) {
    const id = ['easy', 'normal', 'hard'][Number(key) - 1];
    game.startRun(id);
    hideOverlay();
  }
});

// Animation loop: gentle scene motion (water, fireflies, lantern sway) and
// the countdown. In shot mode the game starts in a staged mid-hunt state.
let last = performance.now();
function frame(now) {
  const delta = Math.min(100, now - last);
  last = now;
  game.update(delta);
  renderer.drawPanels(game, now);
  renderer.updateHud(game);
  requestAnimationFrame(frame);
}

const shot = shotNameFromUrl();
if (shot) {
  const staged = applyShotState(game, shot);
  if (!staged) {
    showMenu();
  } else if (!staged.preset.won) {
    // Play shots: keep the overlay hidden so both panels show.
    hideOverlay();
  }
  // The win shot's overlay is shown by the game's own 'won' event.
} else {
  showMenu();
}
requestAnimationFrame(frame);

// Expose the scene list for debugging in the console.
window.TWIN_LANTERNS = { game, scenes: SCENES };
