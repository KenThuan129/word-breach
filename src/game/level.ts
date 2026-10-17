import { LevelDefinition } from './types';

/**
 * Journey Level Definitions — 20 levels across 4 chapters
 */
export const JOURNEY_LEVELS: LevelDefinition[] = [
  // === CHAPTER 1 — EASY (Level 1-5) ===
  {
    id: 1,
    tier: 'easy',
    chapter: 1,
    mode: 'secret-password',
    title: 'First Words',
    description: 'Unlock the secret password.',
    difficulty: 1,
    timeLimitSec: 120,
    config: {
      password: 'CAT',
      hint: "A friend's best pet",
    },
  },
  {
    id: 2,
    tier: 'easy',
    chapter: 1,
    mode: 'secret-password',
    title: 'Nature Calls',
    description: 'Unlock the secret password.',
    difficulty: 1,
    timeLimitSec: 120,
    config: {
      password: 'SUN',
      hint: 'It warms the day',
    },
  },
  {
    id: 3,
    tier: 'easy',
    chapter: 1,
    mode: 'secret-password',
    title: 'Blue Yonder',
    description: 'Unlock the secret password.',
    difficulty: 2,
    timeLimitSec: 110,
    config: {
      password: 'BLUE',
      hint: 'The color of the sky',
    },
  },
  {
    id: 4,
    tier: 'easy',
    chapter: 1,
    mode: 'secret-password',
    title: 'Opening Move',
    description: 'Unlock the secret password.',
    difficulty: 3,
    timeLimitSec: 100,
    config: {
      password: 'TIGER',
      hint: 'Stripes and a mighty roar',
    },
  },
  {
    id: 5,
    tier: 'easy',
    chapter: 1,
    mode: 'battle',
    title: 'First Encounter',
    description: 'Defeat the Slime.',
    difficulty: 3,
    config: { enemy: 'slime' },
  },

  // === CHAPTER 2 — MEDIUM (Level 6-10) ===
  {
    id: 6,
    tier: 'medium',
    chapter: 2,
    mode: 'secret-password',
    title: 'Ocean Deep',
    description: 'Unlock the secret password.',
    difficulty: 3,
    timeLimitSec: 100,
    config: {
      password: 'OCEAN',
      hint: 'Where whales sing',
    },
  },
  {
    id: 7,
    tier: 'medium',
    chapter: 2,
    mode: 'secret-password',
    title: 'Magic Word',
    description: 'Unlock the secret password.',
    difficulty: 3,
    timeLimitSec: 100,
    config: {
      password: 'MAGIC',
      hint: 'Spells and wonder',
    },
  },
  {
    id: 8,
    tier: 'medium',
    chapter: 2,
    mode: 'secret-password',
    title: 'Journey',
    description: 'Unlock the secret password.',
    difficulty: 4,
    timeLimitSec: 90,
    config: {
      password: 'JOURNEY',
      hint: 'A long adventure awaits',
    },
  },
  {
    id: 9,
    tier: 'medium',
    chapter: 2,
    mode: 'battle',
    title: 'Goblin Raid',
    description: 'Defeat the Goblin.',
    difficulty: 4,
    config: { enemy: 'goblin' },
  },
  {
    id: 10,
    tier: 'medium',
    chapter: 2,
    mode: 'battle',
    title: 'Goblin Champion',
    description: 'Defeat the Goblin Champion.',
    difficulty: 4,
    config: { enemy: 'goblin', modifier: 'reduced-time' },
  },

  // === CHAPTER 3 — HARD (Level 11-15) ===
  {
    id: 11,
    tier: 'hard',
    chapter: 3,
    mode: 'course',
    title: 'The Gauntlet',
    description: 'Complete 4 challenges.',
    difficulty: 5,
    config: { challenges: ['time-score', 'secret-password', 'morse', 'battle'] },
  },
  {
    id: 12,
    tier: 'hard',
    chapter: 3,
    mode: 'course',
    title: 'Endurance',
    description: 'Complete 4 challenges.',
    difficulty: 5,
    config: { challenges: ['secret-password', 'morse', 'battle', 'time-score'] },
  },
  {
    id: 13,
    tier: 'hard',
    chapter: 3,
    mode: 'course',
    title: 'Trial By Word',
    description: 'Complete 4 challenges.',
    difficulty: 5,
    config: { challenges: ['morse', 'battle', 'time-score', 'secret-password'] },
  },
  {
    id: 14,
    tier: 'hard',
    chapter: 3,
    mode: 'battle',
    title: 'Knight Falls',
    description: 'Defeat the Knight.',
    difficulty: 5,
    config: { enemy: 'knight' },
  },
  {
    id: 15,
    tier: 'hard',
    chapter: 3,
    mode: 'morse',
    title: 'First Signal',
    description: 'Decode the Morse code.',
    difficulty: 4,
    timeLimitSec: 120,
    config: { morseTargets: 3 },
  },

  // === CHAPTER 4 — INSANE (Level 16-20) ===
  {
    id: 16,
    tier: 'insane',
    chapter: 4,
    mode: 'course',
    title: 'Chaos Theory',
    description: 'Complete 4 challenges.',
    difficulty: 5,
    config: { challenges: ['battle', 'morse', 'battle', 'secret-password'] },
  },
  {
    id: 17,
    tier: 'insane',
    chapter: 4,
    mode: 'course',
    title: 'Storm Warning',
    description: 'Complete 4 challenges.',
    difficulty: 5,
    config: { challenges: ['morse', 'morse', 'battle', 'time-score'] },
  },
  {
    id: 18,
    tier: 'insane',
    chapter: 4,
    mode: 'battle',
    title: 'Sorcerer Supreme',
    description: 'Defeat the Sorcerer.',
    difficulty: 5,
    config: { enemy: 'sorcerer' },
  },
  {
    id: 19,
    tier: 'insane',
    chapter: 4,
    mode: 'course',
    title: 'Final Trial',
    description: 'Complete 4 challenges.',
    difficulty: 5,
    config: { challenges: ['battle', 'battle', 'morse', 'battle'] },
  },
  {
    id: 20,
    tier: 'insane',
    chapter: 4,
    mode: 'battle',
    title: 'Void Emperor',
    description: 'Defeat the Void Emperor.',
    difficulty: 5,
    config: { enemy: 'void-emperor' },
  },
];

export const CHAPTER_INFO = {
  1: { name: 'EASY', color: '#A8D5BA', icon: '🌱' },
  2: { name: 'MEDIUM', color: '#F4D58D', icon: '🌿' },
  3: { name: 'HARD', color: '#E89B7B', icon: '🌳' },
  4: { name: 'INSANE', color: '#E76F51', icon: '🔥' },
} as const;

export function getLevelById(id: number): LevelDefinition | undefined {
  return JOURNEY_LEVELS.find((l) => l.id === id);
}

export function getLevelsByChapter(chapter: number): LevelDefinition[] {
  return JOURNEY_LEVELS.filter((l) => l.chapter === chapter);
}