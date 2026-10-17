/**
 * LocalStorage helpers for Word Breach
 */

const KEYS = {
  HAS_SEEN_LOADING: 'wb_has_seen_loading',
  HIGH_SCORE: 'wb_high_score',
  PROGRESS: 'wb_progress',
  SETTINGS: 'wb_settings',
};

export interface LevelProgress {
  levelId: number;
  completed: boolean;
  bestScore: number;
  stars: number; // 0-3
}

export interface GameProgress {
  levels: Record<number, LevelProgress>;
  totalStars: number;
}

export interface GameSettings {
  muted: boolean;
  gridType: 'square' | 'hex';
}

const DEFAULT_PROGRESS: GameProgress = {
  levels: {},
  totalStars: 0,
};

const DEFAULT_SETTINGS: GameSettings = {
  muted: false,
  gridType: 'square',
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or private mode — silently fail
  }
}

// === Loading Flag ===
export function hasSeenLoading(): boolean {
  return safeGet<boolean>(KEYS.HAS_SEEN_LOADING, false);
}

export function markLoadingSeen(): void {
  safeSet(KEYS.HAS_SEEN_LOADING, true);
}

// === High Score ===
export function getHighScore(): number {
  const raw = localStorage.getItem(KEYS.HIGH_SCORE);
  return raw ? parseInt(raw, 10) || 0 : 0;
}

export function setHighScore(score: number): void {
  localStorage.setItem(KEYS.HIGH_SCORE, String(score));
}

// === Progress ===
export function getProgress(): GameProgress {
  return safeGet<GameProgress>(KEYS.PROGRESS, DEFAULT_PROGRESS);
}

export function saveProgress(progress: GameProgress): void {
  safeSet(KEYS.PROGRESS, progress);
}

export function completeLevel(
  levelId: number,
  score: number,
  maxScore: number
): GameProgress {
  const progress = getProgress();
  const existing = progress.levels[levelId];

  // Calculate stars based on score vs maxScore
  const ratio = maxScore > 0 ? score / maxScore : 0;
  let stars = 0;
  if (ratio >= 0.9) stars = 3;
  else if (ratio >= 0.7) stars = 2;
  else if (ratio >= 0.5) stars = 1;

  const newLevelProgress: LevelProgress = {
    levelId,
    completed: true,
    bestScore: Math.max(existing?.bestScore ?? 0, score),
    stars: Math.max(existing?.stars ?? 0, stars),
  };

  const newLevels = { ...progress.levels, [levelId]: newLevelProgress };
  const totalStars = Object.values(newLevels).reduce((sum, l) => sum + l.stars, 0);

  const newProgress: GameProgress = {
    levels: newLevels,
    totalStars,
  };

  saveProgress(newProgress);
  return newProgress;
}

export function isLevelUnlocked(levelId: number): boolean {
  if (levelId === 1) return true;
  const progress = getProgress();
  return progress.levels[levelId - 1]?.completed === true;
}

export function resetProgress(): void {
  saveProgress(DEFAULT_PROGRESS);
}

// === Settings ===
export function getSettings(): GameSettings {
  return safeGet<GameSettings>(KEYS.SETTINGS, DEFAULT_SETTINGS);
}

export function saveSettings(settings: GameSettings): void {
  safeSet(KEYS.SETTINGS, settings);
}