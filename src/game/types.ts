export type GridType = 'square' | 'hex';

export interface Position {
  r: number; // Row index in square, or axial r in hex
  c: number; // Col index in square, or axial q in hex
  q?: number; // Explicit axial q for hex
}

export interface TileData {
  id: string;
  letter: string;
  r: number;
  c: number;
  q?: number;
  points: number;
  isNew?: boolean;
  spawnDistance?: number;
  spawnDelay?: number;
  clearing?: boolean;
  invalid?: boolean;
  isHint?: boolean;      
  isExploding?: boolean; 
}

export interface ScorePopup {
  id: string;
  x: number;
  y: number;
  score: number;
  word: string;
  combo: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  vr: number;
  opacity: number;
  shape: 'rect' | 'circle' | 'spark';
}

export interface WordBreachConfig {
  squareGridSize: { rows: number; cols: number };
  hexRadius: number; // Radius N = 3 for 37-cell hexagonal board
  comboDurationMs: number;
  baseWordScore: number;
  minWordLength: number;
  maxConsecutiveDeadlocks: number;
}

// === NEW: Scene Navigation ===
export type SceneId =
  | 'loading'
  | 'home'
  | 'mode-select'
  | 'standard-menu'
  | 'game'
  | 'minigame';

export type GameMode =
  | 'endless'
  | 'secret-password'
  | 'battle'
  | 'course'
  | 'morse';

export interface SceneParams {
  mode?: GameMode;
  level?: number;
}

// === NEW: Journey Level Definition ===
export type DifficultyTier = 'easy' | 'medium' | 'hard' | 'insane';

export interface LevelDefinition {
  id: number;
  tier: DifficultyTier;
  chapter: number;         // 1-4
  mode: GameMode;
  title: string;
  description: string;
  difficulty: number;      // 1-5 sao
  timeLimitSec?: number;
  targetScore?: number;
  // Mode-specific config (tùy mode)
  config?: {
    password?: string;
    hint?: string;
    enemy?: string;
    modifier?: string;
    challenges?: string[];
    morseTargets?: number;
    [key: string]: unknown;
  };
}