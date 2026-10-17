import { WordBreachConfig } from './types';

// === UPDATED: CONFIG WITH HEX RADIUS (N = 3, 37 CELLS) ===
export const CONFIG: WordBreachConfig = {
  squareGridSize: { rows: 7, cols: 7 },
  hexRadius: 3, // 37 cells total (radius N = 3)
  comboDurationMs: 5000,
  baseWordScore: 10,
  minWordLength: 3,
  maxConsecutiveDeadlocks: 3,
};

// === UPDATED: TIMING CONFIG FOR OVERLAPPING CASCADE ===
export const TIMING = {
  MATCH_SCALE_UP: 150,      // ms - ô scale up trước khi biến mất
  MATCH_FADE_OUT: 150,      // ms - ô fade out
  CASCADE_DELAY: 120,       // ms - delay trước khi cascade bắt đầu (overlap 100-150ms với match)
  CASCADE_DURATION: 300,    // ms - thời gian ô rơi
  CASCADE_BOUNCE: 100,      // ms - bounce nhẹ khi chạm đáy
  SPAWN_DURATION: 250,      // ms - ô mới rơi từ spawner
  INPUT_LOCK_DURATION: 550, // ms - khóa input trong lúc animation
};

// Length multipliers
export function getLengthMultiplier(length: number): number {
  if (length <= 3) return 1.0;
  if (length === 4) return 1.5;
  if (length === 5) return 2.0;
  return 3.0; // 6+ letters
}

// Combo multiplier progression
export const COMBO_MULTIPLIERS = [1, 1.5, 2, 3, 5];

export function getComboMultiplier(comboLevel: number): number {
  const index = Math.min(Math.max(0, comboLevel - 1), COMBO_MULTIPLIERS.length - 1);
  return COMBO_MULTIPLIERS[index];
}

// Letter frequency weighted pool (natural English distribution with extra vowels for cozy gameplay)
export const LETTER_FREQUENCIES: Record<string, number> = {
  E: 13, A: 10, I: 9, O: 8, T: 8, N: 7, R: 7, S: 7, L: 6, C: 5,
  U: 5, D: 4, P: 4, M: 4, H: 4, G: 3, B: 3, F: 2, Y: 3, W: 2,
  K: 2, V: 2, X: 1, Z: 1, J: 1, Q: 1
};

export const LETTER_POINTS: Record<string, number> = {
  E: 1, A: 1, I: 1, O: 1, N: 1, R: 1, T: 1, L: 1, S: 1, U: 1,
  D: 2, G: 2,
  B: 3, C: 3, M: 3, P: 3,
  F: 4, H: 4, V: 4, W: 4, Y: 4,
  K: 5,
  J: 8, X: 8,
  Q: 10, Z: 10,
};

// Pre-expanded letter bag for O(1) random draws
export const EXPANDED_LETTER_BAG: string[] = (() => {
  const bag: string[] = [];
  for (const [letter, freq] of Object.entries(LETTER_FREQUENCIES)) {
    for (let i = 0; i < freq; i++) {
      bag.push(letter);
    }
  }
  return bag;
})();

export function getRandomLetter(): string {
  const idx = Math.floor(Math.random() * EXPANDED_LETTER_BAG.length);
  return EXPANDED_LETTER_BAG[idx];
}
