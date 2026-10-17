/**
 * useGameEngine — Encapsulates all gameplay logic
 * Extracted from legacy App.tsx.
 * Supports: endless, secret-password modes.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { GridType, Position, TileData, ScorePopup, Particle, GameMode } from './types';
import {
    CONFIG,
    TIMING,
    getLengthMultiplier,
    getComboMultiplier,
    LETTER_POINTS,
} from './config';
import { GAME_TRIE } from './dictionary';
import { areNeighbors, findAvailableWords, shuffleBoard } from './deadlock';
import { SOUND } from './sound';
import {
    DifficultyPhase,
    PHASE_CONFIGS,
    getPhaseLetter,
    calculateDDA,
    DDAState,
} from './difficulty';
import { getHighScore, setHighScore } from './storage';

export interface UseGameEngineOptions {
    mode: GameMode;
    levelConfig?: {
        password?: string;
        timeLimitSec?: number;
    };
    gridType: GridType;
    onVictory?: (score: number) => void;
    onDefeat?: () => void;
}

export interface UseGameEngineReturn {
    // State
    grid: (TileData | null)[][];
    score: number;
    highScore: number;
    combo: number;
    comboTimeLeft: number;
    gameOver: boolean;
    gameVictory: boolean;
    availableWordsCount: number;
    isProcessing: boolean;
    selectedPositions: Position[];
    currentWord: string;
    scorePopups: ScorePopup[];
    particles: Particle[];
    invalidPositions: Position[];
    difficultyPhase: DifficultyPhase;
    elapsedSeconds: number;
    wordsClearedCount: number;
    shuffleToast: string | null;
    // Secret Password specific
    passwordProgress: string[];       // letters unlocked in order
    passwordTarget: string;           // full password
    timeLeftSec: number | null;       // null if no timer
    easyModeUntil: number;
    explosionEffect: { x: number; y: number; key: number } | null;
    // Handlers
    handlePointerDown: (r: number, c: number, e: React.PointerEvent) => void;
    handlePointerMove: (e: React.PointerEvent) => void;
    handlePointerUp: () => void;
    handleRestart: () => void;
    getDragLinePoints: () => string;
    // Refs
    boardRef: React.RefObject<HTMLDivElement | null>;
}

export function useGameEngine({
    mode,
    levelConfig,
    gridType,
    onVictory,
    onDefeat,
}: UseGameEngineOptions): UseGameEngineReturn {
    // === Grid & Board ===
    const [grid, setGrid] = useState<(TileData | null)[][]>([]);

    // === Score & Combo ===
    const [score, setScore] = useState<number>(0);
    const [highScore, setHighScoreState] = useState<number>(() => getHighScore());
    const [combo, setCombo] = useState<number>(1);
    const [comboTimeLeft, setComboTimeLeft] = useState<number>(0);
    const [comboWindowMs, setComboWindowMs] = useState<number>(CONFIG.comboDurationMs);

    // === Game State ===
    const [gameOver, setGameOver] = useState<boolean>(false);
    const [gameVictory, setGameVictory] = useState<boolean>(false);
    const [deadlockCount, setDeadlockCount] = useState<number>(0);
    const [shuffleToast, setShuffleToast] = useState<string | null>(null);
    const [availableWordsCount, setAvailableWordsCount] = useState<number>(0);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    // === Difficulty ===
    const [difficultyPhase, setDifficultyPhase] = useState<DifficultyPhase>(1);
    const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
    const [wordsClearedCount, setWordsClearedCount] = useState<number>(0);
    const [clearedHistory, setClearedHistory] = useState<
        { timestamp: number; word: string; length: number }[]
    >([]);
    const [ddaState, setDdaState] = useState<DDAState | null>(null);
    const [lastDeadlockSoftenedUntil, setLastDeadlockSoftenedUntil] = useState<number>(0);

    // === Timer ===
    const [timeLeftSec, setTimeLeftSec] = useState<number | null>(
        levelConfig?.timeLimitSec ?? null
    );

    // === NEW: Explosion & Easy Mode ===
    const [easyModeUntil, setEasyModeUntil] = useState<number>(0);
    const [explosionEffect, setExplosionEffect] = useState<{
        x: number;
        y: number;
        key: number;
    } | null>(null);

    // === Secret Password ===
    const passwordTarget = levelConfig?.password ?? '';
    const [passwordProgress, setPasswordProgress] = useState<string[]>([]);

    // === Input ===
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [selectedPositions, setSelectedPositions] = useState<Position[]>([]);
    const [currentWord, setCurrentWord] = useState<string>('');
    const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(null);

    // === Visual Effects ===
    const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);
    const [particles, setParticles] = useState<Particle[]>([]);
    const [invalidPositions, setInvalidPositions] = useState<Position[]>([]);

    // === Refs ===
    const boardRef = useRef<HTMLDivElement>(null);
    const comboIntervalRef = useRef<number | null>(null);
    const particleAnimFrameRef = useRef<number | null>(null);
    const isBusyRef = useRef<boolean>(false);

    const rows = 7;
    const cols = 7;

    // === NEW: Password helpers ===
    const getPasswordNeededLetters = useCallback((): string[] => {
        if (mode !== 'secret-password' || !passwordTarget) return [];
        const unlockedLetters = new Set(passwordProgress.map((p) => p.split(':')[1]));
        return Array.from(
            new Set(passwordTarget.split('').filter((l) => !unlockedLetters.has(l)))
        );
    }, [mode, passwordTarget, passwordProgress]);

    // === NEW: Smart letter spawn ===
    // - Guarantee at least 1 password letter on board
    // - Force phase 1 during easy mode
    const getSmartLetter = useCallback(
        (tempBoard: (TileData | null)[][]): string => {
            // Secret Password: guarantee needed letter
            if (mode === 'secret-password' && passwordTarget) {
                const needed = getPasswordNeededLetters();
                if (needed.length > 0) {
                    const survivingLetters = new Set<string>();
                    for (let rr = 0; rr < rows; rr++) {
                        for (let cc = 0; cc < cols; cc++) {
                            const t = tempBoard[rr]?.[cc];
                            if (t && !t.clearing) survivingLetters.add(t.letter);
                        }
                    }
                    const missing = needed.filter((l) => !survivingLetters.has(l));
                    if (missing.length > 0) {
                        return missing[Math.floor(Math.random() * missing.length)];
                    }
                }
            }

            // Easy mode override (30s)
            const now = Date.now();
            const activePhase = now < easyModeUntil
                ? (1 as DifficultyPhase)
                : ddaState?.effectivePhase ?? difficultyPhase;

            return getPhaseLetter(activePhase, tempBoard, ddaState?.rareBonus ?? 0);
        },
        [
            mode,
            passwordTarget,
            getPasswordNeededLetters,
            easyModeUntil,
            ddaState,
            difficultyPhase,
        ]
    );

    // Store levelConfig trong ref để không trigger re-init
    const levelConfigRef = useRef(levelConfig);
    useEffect(() => {
        levelConfigRef.current = levelConfig;
    }, [levelConfig]);

    // === INIT BOARD ===
    const initBoard = useCallback(
        (type: GridType) => {
            const config = levelConfigRef.current;
            let newGrid: (TileData | null)[][] = [];
            let valid = false;
            let attempts = 0;

            while (!valid && attempts < 25) {
                newGrid = Array.from({ length: rows }, () => Array(cols).fill(null));

                if (type === 'square') {
                    for (let r = 0; r < rows; r++) {
                        for (let c = 0; c < cols; c++) {
                            // Không dùng difficulty spawn lúc init — dùng random đều
                            const letters = 'EEEEEEEAAAAAIIIII OOOOOTTTTTNNNNRRRRSSSSLLLLCCCCUUUUDDDDPPPPMMMMHHHHGGGGBBBBFFFYYYWWWKKKVVVXZZJJQ'.replace(/\s/g, '');
                            const letter = letters[Math.floor(Math.random() * letters.length)];
                            newGrid[r][c] = {
                                id: `sq-${r}-${c}-${Date.now()}-${Math.random()}`,
                                letter,
                                r,
                                c,
                                points: LETTER_POINTS[letter] || 1,
                                isNew: false,
                            };
                        }
                    }
                } else {
                    const radius = CONFIG.hexRadius;
                    for (let r = 0; r < rows; r++) {
                        for (let c = 0; c < cols; c++) {
                            const axialQ = c - radius;
                            const axialR = r - radius;
                            if (
                                Math.abs(axialQ) <= radius &&
                                Math.abs(axialR) <= radius &&
                                Math.abs(axialQ + axialR) <= radius
                            ) {
                                const letters = 'EEEEEEEAAAAAIIIII OOOOOTTTTTNNNNRRRRSSSSLLLLCCCCUUUUDDDDPPPPMMMMHHHHGGGGBBBBFFFYYYWWWKKKVVVXZZJJQ'.replace(/\s/g, '');
                                const letter = letters[Math.floor(Math.random() * letters.length)];
                                newGrid[r][c] = {
                                    id: `hex-${r}-${c}-${Date.now()}-${Math.random()}`,
                                    letter,
                                    r,
                                    c,
                                    q: axialQ,
                                    points: LETTER_POINTS[letter] || 1,
                                    isNew: false,
                                };
                            }
                        }
                    }
                }

                // === NEW: Force spawn password letters for secret-password mode ===
                if (mode === 'secret-password' && passwordTarget) {
                    const needed = Array.from(new Set(passwordTarget.split('')));
                    const allPositions: { r: number; c: number }[] = [];

                    for (let r = 0; r < rows; r++) {
                        for (let c = 0; c < cols; c++) {
                            if (newGrid[r][c]) allPositions.push({ r, c });
                        }
                    }

                    // Fisher-Yates shuffle positions
                    for (let i = allPositions.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [allPositions[i], allPositions[j]] = [allPositions[j], allPositions[i]];
                    }

                    needed.forEach((letter, idx) => {
                        if (allPositions[idx]) {
                            const { r, c } = allPositions[idx];
                            const tile = newGrid[r][c];
                            if (tile) {
                                newGrid[r][c] = {
                                    ...tile,
                                    letter,
                                    points: LETTER_POINTS[letter] || 1,
                                };
                            }
                        }
                    });
                }

                const available = findAvailableWords(newGrid, type, 3, 5);
                if (available.length >= 3) {
                    valid = true;
                    setAvailableWordsCount(available.length);
                }
                attempts++;
            }

            setGrid(newGrid);
            setSelectedPositions([]);
            setCurrentWord('');
            setDeadlockCount(0);
            setGameOver(false);
            setGameVictory(false);
            isBusyRef.current = false;
            setIsProcessing(false);
            setElapsedSeconds(0);
            setWordsClearedCount(0);
            setClearedHistory([]);
            setDifficultyPhase(1);
            setDdaState(null);
            setLastDeadlockSoftenedUntil(0);
            setComboWindowMs(PHASE_CONFIGS[1].comboWindowMs);
            setPasswordProgress([]);
            setEasyModeUntil(0);
            setExplosionEffect(null);
            if (config?.timeLimitSec !== undefined) {
                setTimeLeftSec(config.timeLimitSec);
            }
        },
        [levelConfig, mode, passwordTarget]
    );

    // Init board on mount + on gridType change
    useEffect(() => {
        initBoard(gridType);
    }, [gridType, initBoard]);

    // === High Score ===
    useEffect(() => {
        if (score > highScore) {
            setHighScoreState(score);
            setHighScore(score);
        }
    }, [score, highScore]);

    // === Combo Decay ===
    useEffect(() => {
        if (comboTimeLeft > 0) {
            comboIntervalRef.current = window.setInterval(() => {
                setComboTimeLeft((prev) => {
                    const next = prev - 100;
                    if (next <= 0) {
                        setCombo(1);
                        return 0;
                    }
                    return next;
                });
            }, 100);
        } else {
            if (comboIntervalRef.current) clearInterval(comboIntervalRef.current);
        }
        return () => {
            if (comboIntervalRef.current) clearInterval(comboIntervalRef.current);
        };
    }, [comboTimeLeft]);

    // === Game Timer (difficulty + level timer) ===
    useEffect(() => {
        if (gameOver || gameVictory) return;
        const timer = setInterval(() => {
            setElapsedSeconds((prev) => prev + 1);
            if (timeLeftSec !== null) {
                setTimeLeftSec((prev) => {
                    if (prev === null) return null;
                    const next = prev - 1;
                    if (next <= 0) {
                        setGameOver(true);
                        if (onDefeat) onDefeat();
                        return 0;
                    }
                    return next;
                });
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [gameOver, gameVictory, timeLeftSec, onDefeat]);

    // === Reset isNew after spawn animation ===
    useEffect(() => {
        if (!grid.length) return;
        const hasNewTiles = grid.some((row) => row.some((t) => t?.isNew));
        if (!hasNewTiles) return;

        const timeout = setTimeout(() => {
            setGrid((prev) =>
                prev.map((row) =>
                    row.map((t) =>
                        t ? { ...t, isNew: false, spawnDistance: undefined, spawnDelay: undefined } : t
                    )
                )
            );
        }, 500);

        return () => clearTimeout(timeout);
    }, [grid]);

    // === NEW: Apply isHint flag based on password progress ===
    useEffect(() => {
        if (mode !== 'secret-password' || !passwordTarget) return;
        const needed = getPasswordNeededLetters();
        const neededSet = new Set(needed);

        setGrid((prev) =>
            prev.map((row) =>
                row.map((tile) => {
                    if (!tile) return null;
                    const shouldBeHint = neededSet.has(tile.letter);
                    if (tile.isHint === shouldBeHint) return tile;
                    return { ...tile, isHint: shouldBeHint };
                })
            )
        );
    }, [passwordProgress, mode, passwordTarget, getPasswordNeededLetters]);

    // === Particle physics ===
    useEffect(() => {
        if (particles.length === 0) return;
        let lastTime = performance.now();
        const updateParticles = (now: number) => {
            const dt = Math.min((now - lastTime) / 1000, 0.1);
            lastTime = now;
            setParticles((prev) =>
                prev
                    .map((p) => ({
                        ...p,
                        x: p.x + p.vx * dt * 60,
                        y: p.y + p.vy * dt * 60,
                        vy: p.vy + 0.35,
                        rotation: p.rotation + p.vr * dt * 60,
                        opacity: p.opacity - dt * 1.4,
                    }))
                    .filter((p) => p.opacity > 0)
            );
            particleAnimFrameRef.current = requestAnimationFrame(updateParticles);
        };
        particleAnimFrameRef.current = requestAnimationFrame(updateParticles);
        return () => {
            if (particleAnimFrameRef.current) cancelAnimationFrame(particleAnimFrameRef.current);
        };
    }, [particles.length]);

    // === Particle burst ===
    const triggerParticleBurst = (centerX: number, centerY: number) => {
        const palette = ['#F4D58D', '#E89B7B', '#A8D5BA', '#8B6F5C', '#F7B267', '#FFFDF9'];
        const newParticles: Particle[] = [];
        const count = 16;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
            const speed = 2.5 + Math.random() * 4.5;
            newParticles.push({
                id: `p-${Date.now()}-${i}-${Math.random()}`,
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2.5,
                color: palette[Math.floor(Math.random() * palette.length)],
                size: 5 + Math.random() * 6,
                rotation: Math.random() * 360,
                vr: (Math.random() - 0.5) * 15,
                opacity: 1,
                shape: Math.random() > 0.4 ? 'rect' : 'circle',
            });
        }
        setParticles((prev) => [...prev, ...newParticles]);
    };

    // === Pointer → Board coords ===
    const getBoardRelativePoint = (clientX: number, clientY: number) => {
        if (!boardRef.current) return { x: 0, y: 0 };
        const rect = boardRef.current.getBoundingClientRect();
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const getTileAtPoint = (clientX: number, clientY: number): Position | null => {
        const elem = document.elementFromPoint(clientX, clientY);
        if (!elem) return null;
        const tileElem = elem.closest('[data-tile-r]');
        if (!tileElem) return null;
        const r = parseInt(tileElem.getAttribute('data-tile-r') || '-1', 10);
        const c = parseInt(tileElem.getAttribute('data-tile-c') || '-1', 10);
        if (r >= 0 && c >= 0) return { r, c };
        return null;
    };

    // === INPUT HANDLERS ===
    const handlePointerDown = (r: number, c: number, e: React.PointerEvent) => {
        if (isBusyRef.current || gameOver || gameVictory) return;
        const tile = grid[r]?.[c];
        if (!tile) return;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        setIsDragging(true);
        setSelectedPositions([{ r, c }]);
        setCurrentWord(tile.letter);
        setPointerPos(getBoardRelativePoint(e.clientX, e.clientY));
        SOUND.playTileSelect(1);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging || isBusyRef.current || gameOver || gameVictory) return;
        setPointerPos(getBoardRelativePoint(e.clientX, e.clientY));
        const target = getTileAtPoint(e.clientX, e.clientY);
        if (!target) return;
        const { r, c } = target;
        const lastPos = selectedPositions[selectedPositions.length - 1];
        if (!lastPos) return;
        if (lastPos.r === r && lastPos.c === c) return;

        // Backtrack
        if (selectedPositions.length > 1) {
            const secondToLast = selectedPositions[selectedPositions.length - 2];
            if (secondToLast.r === r && secondToLast.c === c) {
                const newPositions = selectedPositions.slice(0, -1);
                setSelectedPositions(newPositions);
                const newWord = newPositions
                    .map((pos) => grid[pos.r]?.[pos.c]?.letter || '')
                    .join('');
                setCurrentWord(newWord);
                SOUND.playTileSelect(newPositions.length);
                return;
            }
        }

        const alreadySelected = selectedPositions.some((pos) => pos.r === r && pos.c === c);
        if (alreadySelected) return;

        if (areNeighbors(lastPos, { r, c }, rows, cols, gridType, grid)) {
            const newPositions = [...selectedPositions, { r, c }];
            setSelectedPositions(newPositions);
            const newWord = newPositions.map((pos) => grid[pos.r]?.[pos.c]?.letter || '').join('');
            setCurrentWord(newWord);
            SOUND.playTileSelect(newPositions.length);
        }
    };

    const handlePointerUp = () => {
        if (!isDragging || isBusyRef.current || gameOver || gameVictory) {
            setIsDragging(false);
            setPointerPos(null);
            return;
        }
        setIsDragging(false);
        setPointerPos(null);

        const word = currentWord.trim().toUpperCase();
        if (word.length >= CONFIG.minWordLength && GAME_TRIE.has(word)) {
            handleWordValid(word, selectedPositions);
        } else {
            handleWordInvalid(selectedPositions);
        }
    };

    // === NEW: Compute 3x3 explosion positions ===
    const computeExplosionPositions = (excludeWordPositions: Position[]): Position[] => {
        const excludeSet = new Set(excludeWordPositions.map((p) => `${p.r},${p.c}`));
        const explosion: Position[] = [];

        if (gridType === 'square') {
            // Center of 7x7 grid = (3, 3). 3x3 = rows 2-4, cols 2-4.
            const centerR = Math.floor(rows / 2);
            const centerC = Math.floor(cols / 2);
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const r = centerR + dr;
                    const c = centerC + dc;
                    if (
                        r >= 0 &&
                        r < rows &&
                        c >= 0 &&
                        c < cols &&
                        grid[r]?.[c] &&
                        !excludeSet.has(`${r},${c}`)
                    ) {
                        explosion.push({ r, c });
                    }
                }
            }
        } else {
            // Hex grid: use Euclidean distance fallback from board center
            // Center tile at axial (0, 0) — find closest 9 tiles by distance
            const candidates: { pos: Position; dist: number }[] = [];
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (!grid[r]?.[c]) continue;
                    if (excludeSet.has(`${r},${c}`)) continue;
                    const axialQ = c - CONFIG.hexRadius;
                    const axialR = r - CONFIG.hexRadius;
                    const dist = Math.sqrt(axialQ * axialQ + axialQ * axialR + axialR * axialR);
                    candidates.push({ pos: { r, c }, dist });
                }
            }
            candidates.sort((a, b) => a.dist - b.dist);
            for (let i = 0; i < Math.min(9, candidates.length); i++) {
                explosion.push(candidates[i].pos);
            }
        }

        return explosion;
    };

    // === VALID WORD ===
    const handleWordValid = (word: string, positions: Position[]) => {
        isBusyRef.current = true;
        setIsProcessing(true);

        const lengthMult = getLengthMultiplier(word.length);
        const comboMult = getComboMultiplier(combo);
        const wordScore = Math.round(CONFIG.baseWordScore * lengthMult * comboMult);

        if (combo >= 4) SOUND.playComboMax();
        else SOUND.playWordValid(word.length, combo);

        const nextCombo = Math.min(combo + 1, 5);
        setCombo(nextCombo);
        setComboTimeLeft(comboWindowMs);
        setScore((prev) => prev + wordScore);

        // === DDA tracking ===
        const now = Date.now();
        const newHistory = [...clearedHistory, { timestamp: now, word, length: word.length }]
            .filter((h) => now - h.timestamp <= 60000);
        const newWordsCleared = wordsClearedCount + 1;
        setClearedHistory(newHistory);
        setWordsClearedCount(newWordsCleared);

        const newDDA = calculateDDA(
            elapsedSeconds,
            newWordsCleared,
            newHistory,
            deadlockCount,
            lastDeadlockSoftenedUntil,
            now
        );
        setDdaState(newDDA);

        if (newDDA.effectivePhase !== difficultyPhase) {
            setDifficultyPhase(newDDA.effectivePhase);
            setComboWindowMs(PHASE_CONFIGS[newDDA.effectivePhase].comboWindowMs);
            SOUND.playPhaseTransition();
        }

        // === Secret Password progress ===
                // === Secret Password progress (NEW LOGIC) ===
        if (mode === 'secret-password' && passwordTarget) {
            const upperWord = word.toUpperCase();
            const newProgress = [...passwordProgress];
            const newlyUnlockedLetters = new Set<string>();

            passwordTarget.split('').forEach((letter, idx) => {
                const key = `${idx}:${letter}`;
                if (!newProgress.includes(key) && upperWord.includes(letter)) {
                    newProgress.push(key);
                    newlyUnlockedLetters.add(letter);
                }
            });

            // === NEW: Trigger explosion + easy mode (chỉ 1 lần dù unlock nhiều chữ) ===
            if (newlyUnlockedLetters.size > 0 && !gameVictory) {
                const explosionPositions = computeExplosionPositions(positions);
                if (explosionPositions.length > 0) {
                    // Visual effect
                    const centerR = Math.floor(rows / 2);
                    const centerC = Math.floor(cols / 2);
                    setExplosionEffect({ x: centerC, y: centerR, key: Date.now() });
                    setTimeout(() => setExplosionEffect(null), 800);
                    
                    // NEW: Bắn mảnh vỡ (particles) ở tâm vụ nổ
                    if (boardRef.current) {
                        const rect = boardRef.current.getBoundingClientRect();
                        const centerX = rect.width / 2;
                        const centerY = rect.height / 2;
                        
                        // Bắn 2 lớp particle để nhìn cho "dày" (cách nhau 150ms)
                        triggerParticleBurst(centerX, centerY);
                        setTimeout(() => triggerParticleBurst(centerX, centerY), 150);
                    }

                    // Mark exploded tiles
                    const explodedGrid = grid.map((row) => [...row]);
                    explosionPositions.forEach((pos) => {
                        const t = explodedGrid[pos.r][pos.c];
                        if (t) explodedGrid[pos.r][pos.c] = { ...t, clearing: true };
                    });
                    setGrid(explodedGrid);

                    // Trigger cascade for exploded tiles after short delay
                    setTimeout(() => {
                        executeCascade(explosionPositions);
                    }, 200);
                }

                // Easy mode for 30s
                setEasyModeUntil(Date.now() + 30000);
            }

            // Check victory
            if (newProgress.length >= passwordTarget.length && !gameVictory) {
                setPasswordProgress(newProgress);
                setGameVictory(true);
                isBusyRef.current = false;
                setIsProcessing(false);
                SOUND.playPhaseTransition();
                if (onVictory) setTimeout(() => onVictory(score + wordScore), 800);
                return;
            }

            setPasswordProgress(newProgress);
        }

        // === Score popup + particles ===
        if (boardRef.current) {
            let sumX = 0;
            let sumY = 0;
            positions.forEach((pos) => {
                const tileElem = boardRef.current?.querySelector(
                    `[data-tile-r="${pos.r}"][data-tile-c="${pos.c}"]`
                );
                if (tileElem) {
                    const rect = tileElem.getBoundingClientRect();
                    const boardRect = boardRef.current!.getBoundingClientRect();
                    sumX += rect.left + rect.width / 2 - boardRect.left;
                    sumY += rect.top + rect.height / 2 - boardRect.top;
                }
            });
            const centerX = sumX / positions.length;
            const centerY = sumY / positions.length;

            const newPopup: ScorePopup = {
                id: `popup-${Date.now()}`,
                x: centerX,
                y: centerY,
                score: wordScore,
                word,
                combo: nextCombo,
            };
            setScorePopups((prev) => [...prev, newPopup]);
            setTimeout(() => {
                setScorePopups((prev) => prev.filter((p) => p.id !== newPopup.id));
            }, 900);
            triggerParticleBurst(centerX, centerY);
        }

        // === Mark tiles clearing ===
        const newGrid = grid.map((row) => [...row]);
        positions.forEach((pos) => {
            const tile = newGrid[pos.r][pos.c];
            if (tile) newGrid[pos.r][pos.c] = { ...tile, clearing: true };
        });
        setGrid(newGrid);

        setTimeout(() => {
            executeCascade(positions);
        }, TIMING.CASCADE_DELAY);
    };

    const handleWordInvalid = (positions: Position[]) => {
        SOUND.playInvalid();
        setInvalidPositions([...positions]);
        setTimeout(() => {
            setInvalidPositions([]);
            setSelectedPositions([]);
            setCurrentWord('');
        }, 350);
    };

    // === CASCADE ===
    const executeCascade = (clearedPositions: Position[]) => {
        SOUND.playCascade();
        const currentRows = rows;
        const currentCols = cols;
        const nextGrid: (TileData | null)[][] = Array.from({ length: currentRows }, () =>
            Array(currentCols).fill(null)
        );
        const clearedSet = new Set(clearedPositions.map((p) => `${p.r},${p.c}`));
        const tempGrid: (TileData | null)[][] = grid.map((row, r) =>
            row.map((tile, c) => (clearedSet.has(`${r},${c}`) ? null : tile))
        );

        for (let c = 0; c < currentCols; c++) {
            if (gridType === 'square') {
                const survivingTiles: TileData[] = [];
                for (let r = 0; r < currentRows; r++) {
                    const tile = tempGrid[r][c];
                    if (tile && !tile.clearing) survivingTiles.push(tile);
                }
                const emptyCount = currentRows - survivingTiles.length;
                for (let r = 0; r < emptyCount; r++) {
                    const newLetter = getSmartLetter(tempGrid);
                    const spawnDist = (emptyCount - r) * 56;
                    const spawnDelay = Math.abs(c - Math.floor(currentCols / 2)) * 25;
                    nextGrid[r][c] = {
                        id: `sq-${r}-${c}-${Date.now()}-${Math.random()}`,
                        letter: newLetter,
                        r,
                        c,
                        points: LETTER_POINTS[newLetter] || 1,
                        isNew: true,
                        spawnDistance: spawnDist,
                        spawnDelay,
                    };
                }
                for (let i = 0; i < survivingTiles.length; i++) {
                    const r = emptyCount + i;
                    nextGrid[r][c] = { ...survivingTiles[i], r, c, isNew: false, clearing: false };
                }
            } else {
                const validRowsInCol: number[] = [];
                for (let r = 0; r < currentRows; r++) {
                    const axialQ = c - CONFIG.hexRadius;
                    const axialR = r - CONFIG.hexRadius;
                    if (
                        Math.abs(axialQ) <= CONFIG.hexRadius &&
                        Math.abs(axialR) <= CONFIG.hexRadius &&
                        Math.abs(axialQ + axialR) <= CONFIG.hexRadius
                    ) {
                        validRowsInCol.push(r);
                    }
                }
                if (validRowsInCol.length > 0) {
                    const survivingTiles: TileData[] = [];
                    for (const r of validRowsInCol) {
                        const tile = tempGrid[r][c];
                        if (tile && !tile.clearing) survivingTiles.push(tile);
                    }
                    const emptyCount = validRowsInCol.length - survivingTiles.length;
                    for (let i = 0; i < emptyCount; i++) {
                        const r = validRowsInCol[i];
                        const newLetter = getSmartLetter(tempGrid);
                        const spawnDist = (emptyCount - i) * 56;
                        const spawnDelay = Math.abs(c - CONFIG.hexRadius) * 25;
                        nextGrid[r][c] = {
                            id: `hex-${r}-${c}-${Date.now()}-${Math.random()}`,
                            letter: newLetter,
                            r,
                            c,
                            q: c - CONFIG.hexRadius,
                            points: LETTER_POINTS[newLetter] || 1,
                            isNew: true,
                            spawnDistance: spawnDist,
                            spawnDelay,
                        };
                    }
                    for (let i = 0; i < survivingTiles.length; i++) {
                        const r = validRowsInCol[emptyCount + i];
                        nextGrid[r][c] = {
                            ...survivingTiles[i],
                            r,
                            c,
                            q: c - CONFIG.hexRadius,
                            isNew: false,
                            clearing: false,
                        };
                    }
                }
            }
        }

        setGrid(nextGrid);
        setSelectedPositions([]);
        setCurrentWord('');

        setTimeout(() => {
            checkDeadlockAndFinalize(nextGrid);
        }, TIMING.CASCADE_DURATION + 350);
    };

    const checkDeadlockAndFinalize = (board: (TileData | null)[][]) => {
        const available = findAvailableWords(board, gridType, CONFIG.minWordLength, 5);
        setAvailableWordsCount(available.length);

        // === FIX: Recompute activePhase (easy mode override) ===
        const now = Date.now();
        const activePhase: DifficultyPhase =
            now < easyModeUntil
                ? 1
                : ddaState?.effectivePhase ?? difficultyPhase;

        const threshold = PHASE_CONFIGS[activePhase].autoShuffleThreshold;
        const isDeadlocked = available.length < threshold;

        if (isDeadlocked) {
            const nextDeadlocks = deadlockCount + 1;
            setDeadlockCount(nextDeadlocks);
            setLastDeadlockSoftenedUntil(Date.now() + 30000);
            if (nextDeadlocks >= CONFIG.maxConsecutiveDeadlocks) {
                setGameOver(true);
                isBusyRef.current = false;
                setIsProcessing(false);
                if (onDefeat) onDefeat();
                return;
            }
            SOUND.playShuffle();
            setShuffleToast(`No moves left! Shuffling board (Strike ${nextDeadlocks}/3)...`);
            setTimeout(() => {
                const shuffleResult = shuffleBoard(board, gridType, 2, 30);
                setGrid(shuffleResult.newGrid);
                setAvailableWordsCount(shuffleResult.availableWords.length);
                setShuffleToast(null);
                isBusyRef.current = false;
                setIsProcessing(false);
            }, 900);
        } else {
            setDeadlockCount(0);
            isBusyRef.current = false;
            setIsProcessing(false);
        }
    };

    const handleRestart = () => {
        setScore(0);
        setCombo(1);
        setComboTimeLeft(0);
        setGameOver(false);
        setGameVictory(false);
        setDeadlockCount(0);
        initBoard(gridType);
    };

    // === Drag line ===
    const getDragLinePoints = () => {
        if (!boardRef.current || selectedPositions.length === 0) return '';
        const boardRect = boardRef.current.getBoundingClientRect();
        const points: string[] = [];
        selectedPositions.forEach((pos) => {
            const tileElem = boardRef.current?.querySelector(
                `[data-tile-r="${pos.r}"][data-tile-c="${pos.c}"]`
            );
            if (tileElem) {
                const rect = tileElem.getBoundingClientRect();
                const x = rect.left + rect.width / 2 - boardRect.left;
                const y =
                    gridType === 'hex'
                        ? rect.top + rect.height * (53 / 120) - boardRect.top
                        : rect.top + rect.height / 2 - boardRect.top;
                points.push(`${x},${y}`);
            }
        });
        if (isDragging && pointerPos) points.push(`${pointerPos.x},${pointerPos.y}`);
        return points.join(' ');
    };

    return {
        grid,
        score,
        highScore,
        combo,
        comboTimeLeft,
        gameOver,
        gameVictory,
        availableWordsCount,
        isProcessing,
        selectedPositions,
        currentWord,
        scorePopups,
        particles,
        invalidPositions,
        difficultyPhase,
        elapsedSeconds,
        wordsClearedCount,
        shuffleToast,
        passwordProgress,
        passwordTarget,
        timeLeftSec,
        easyModeUntil,
        explosionEffect,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        handleRestart,
        getDragLinePoints,
        boardRef,
    };
}