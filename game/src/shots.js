// shots.js — staged states for the maker's screenshots (?shot=cover etc.).
// These are the game's own states, rendered by its own code: a hunt part-way
// through, with some differences found and marked, several still unfound, and
// the counter showing how many remain. No screenshot is edited or composited.
import { SCENES } from './scenes.js';

const SHOT_PRESETS = {
  // Cover: Harbour at Dusk, 3 of 7 found, 4 remain, 1:47 on the clock.
  cover: { level: 0, found: 3, timeLeft: 107000, score: 640 },
  // The Lantern Market, 2 of 7 found, 5 remain.
  market: { level: 1, found: 2, timeLeft: 118000, score: 410 },
  // Moonlit Garden, 4 of 7 found, 3 remain.
  garden: { level: 2, found: 4, timeLeft: 83000, score: 1520 },
  // The victory screen after clearing all three scenes.
  win: { level: 2, found: 7, timeLeft: 64000, score: 4860, won: true },
};

export function shotNameFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('shot');
}

export function applyShotState(game, shotName) {
  const preset = SHOT_PRESETS[shotName];
  if (!preset) return null;
  game.startRun('normal');
  game.levelIndex = preset.level;
  game.startLevel();
  const list = game.activeDifferenceList();
  for (let i = 0; i < preset.found && i < list.length; i++) {
    game.found.add(list[i].id);
  }
  game.totalFound = preset.found + preset.level * 7;
  game.timeLeft = preset.timeLeft;
  game.score = preset.score;
  game.combo = preset.found + 1;
  if (preset.won) {
    game.totalFound = 21;
    game.finishAfterLastClear();
  }
  return { preset, scene: SCENES[preset.level] };
}
