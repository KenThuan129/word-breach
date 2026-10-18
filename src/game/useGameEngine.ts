/**
 * useGameEngine — Encapsulates all gameplay logic
 * Extracted from legacy App.tsx.
 * Supports: endless, secret-password modes.
 * Includes: Tutorial mode, Booster System (Magic Wand, Bomb).
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
import { areNeighbors, findAvailableWords, shuffleBoard, findAvailableWordPaths } from './deadlock';
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
    isTutorial?: boolean; // Thêm prop này để nhận diện Tutorial
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
    passwordProgress: string[];
    passwordTarget: string;
    timeLeftSec: number | null;
    easyModeUntil: number;
    explosionEffect: { x: number; y: number; key: number } | null;
    // Booster System
    bombMode: boolean;
    setBombMode: (val: boolean) => void;
    useMagicWand: () => boolean;
    // Handlers
    handlePointerDown: (r: number, c: number, e: React.PointerEvent) => void;
    handlePointerMove: (e: React.PointerEvent) => void;
    handlePointerUp: () => void;
    handleRestart: () => void;
    getDragLinePoints: () => string;
    // Refs
    boardRef: React.RefObject<HTMLDivElement | null>;
    suggestions: string[];
}

export function useGameEngine({
    mode,
    levelConfig,
    gridType,
    onVictory,
    onDefeat,
    isTutorial = false,
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

    // === Explosion & Easy Mode ===
    const [easyModeUntil, setEasyModeUntil] = useState<number>(0);
    const [explosionEffect, setExplosionEffect] = useState<{
        x: number;
        y: number;
        key: number;
    } | null>(null);

    // === Booster State ===
    const [bombMode, setBombMode] = useState<boolean>(false);

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

    // === Suggestion State ===
    const [suggestions, setSuggestions] = useState<string[]>([]);

    const rows = 7;
    const cols = 7;

    // === Password helpers ===
    const getPasswordNeededLetters = useCallback((): string[] => {
        if (mode !== 'secret-password' || !passwordTarget) return [];
        const unlockedLetters = new Set(passwordProgress.map((p) => p.split(':')[1]));
        return Array.from(
            new Set(passwordTarget.split('').filter((l) => !unlockedLetters.has(l)))
        );
    }, [mode, passwordTarget, passwordProgress]);

    // === Smart letter spawn ===
    const getSmartLetter = useCallback(
        (tempBoard: (TileData | null)[][]): string => {
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
            // === TUTORIAL OVERRIDE ===
            if (isTutorial) {
                const tutorialGrid = Array(3).fill(null).map((_, r) => 
                  Array(3).fill(null).map((_, c) => {
                    let letter = 'X';
                    if (r === 0 && c === 0) letter = 'C';
                    if (r === 1 && c === 1) letter = 'A';
                    if (r === 2 && c === 2) letter = 'T';
                    
                    return {
                      id: `tut-${r}-${c}`,
                      letter,
                      r,
                      c,
                      points: LETTER_POINTS[letter] || 1,
                      isNew: false,
                    };
                  })
                );
                setGrid(tutorialGrid as any);
                setSelectedPositions([]);
                setCurrentWord('');
                setDeadlockCount(0);
                setGameOver(false);
                setGameVictory(false);
                setIsProcessing(false);
                isBusyRef.current = false;
                return;
            }
            // === KẾT THÚC TUTORIAL OVERRIDE ===

            const config = levelConfigRef.current;
            let newGrid: (TileData | null)[][] = [];
            let valid = false;
            let attempts = 0;

            while (!valid && attempts < 25) {
                newGrid = Array.from({ length: rows }, () => Array(cols).fill(null));

                if (type === 'square') {
                    for (let r = 0; r < rows; r++) {
                        for (let c = 0; c < cols; c++) {
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

                if (mode === 'secret-password' && passwordTarget) {
                    const needed = Array.from(new Set(passwordTarget.split('')));
                    const allPositions: { r: number; c: number }[] = [];

                    for (let r = 0; r < rows; r++) {
                        for (let c = 0; c < cols; c++) {
                            if (newGrid[r][c]) allPositions.push({ r, c });
                        }
                    }

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
            setBombMode(false); // Reset bomb mode
            if (config?.timeLimitSec !== undefined) {
                setTimeLeftSec(config.timeLimitSec);
            }
            // === THÊM ĐOẠN NÀY ĐỂ CÓ SUGGESTION NGAY KHI VÀO GAME ===
            const paths = findAvailableWordPaths(newGrid, type, 3, 20);
            paths.sort((a, b) => a.word.length - b.word.length);
            let picked: string[] = [];
            if (paths.length > 0) {
                for (let i = 0; i < paths.length && picked.length < 3; i++) {
                    if (!picked.includes(paths[i].word)) picked.push(paths[i].word);
                }
            }
            setSuggestions(picked);
        },
        [levelConfig, mode, passwordTarget, isTutorial]
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
        if (isTutorial) return; // Tắt combo trong tutorial
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
    }, [comboTimeLeft, isTutorial]);

    // === Game Timer ===
    useEffect(() => {
        if (gameOver || gameVictory || isTutorial) return; // Tắt timer trong tutorial
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
    }, [gameOver, gameVictory, timeLeftSec, onDefeat, isTutorial]);

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

    // === Apply isHint flag ===
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

    // === BOOSTER LOGIC ===
        const useMagicWand = () => {
        if (isBusyRef.current || gameOver || gameVictory) return false;
        const availableWords = findAvailableWordPaths(grid, gridType, 3, 10);
        if (availableWords.length === 0) return false;
        
        availableWords.sort((a, b) => b.word.length - a.word.length);
        const bestWord = availableWords[0];

        isBusyRef.current = true;
        setIsProcessing(true);

        // Giả lập animation kéo từng chữ cái
        let currentIndex = 0;
        
        const animateStep = () => {
            if (currentIndex < bestWord.path.length) {
                const pos = bestWord.path[currentIndex];
                setSelectedPositions(bestWord.path.slice(0, currentIndex + 1));
                setCurrentWord(bestWord.word.slice(0, currentIndex + 1));
                SOUND.playTileSelect(currentIndex + 1);
                
                currentIndex++;
                setTimeout(animateStep, 150); // Tốc độ kéo (150ms/chữ)
            } else {
                // Kéo xong -> Đợi 300ms rồi nổ
                setTimeout(() => {
                    setSelectedPositions([]);
                    setCurrentWord('');
                    handleWordValid(bestWord.word, bestWord.path);
                }, 300);
            }
        };
        
        animateStep();
        return true;
    };

    const useBomb = (r: number, c: number) => {
        if (isBusyRef.current || gameOver || gameVictory) return;
        
        const positionsToClear: Position[] = [];
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (grid[r+dr]?.[c+dc]) {
                    positionsToClear.push({ r: r+dr, c: c+dc });
                }
            }
        }
        
        // Hiệu ứng nổ
        setExplosionEffect({ x: c, y: r, key: Date.now() });
        setTimeout(() => setExplosionEffect(null), 800);
        triggerParticleBurst(230, 230); // Nổ giữa board

        // Gọi logic xóa
        const newGrid = grid.map((row) => [...row]);
        positionsToClear.forEach((pos) => {
            const tile = newGrid[pos.r][pos.c];
            if (tile) newGrid[pos.r][pos.c] = { ...tile, clearing: true };
        });
        setGrid(newGrid);
        
        setTimeout(() => {
            executeCascade(positionsToClear);
        }, TIMING.CASCADE_DELAY);

        setBombMode(false);
    };

    // === INPUT HANDLERS ===
    const handlePointerDown = (r: number, c: number, e: React.PointerEvent) => {
        if (isBusyRef.current || gameOver || gameVictory) return;
        
        if (bombMode) {
            useBomb(r, c);
            return;
        }

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
        if (!isDragging || isBusyRef.current || gameOver || gameVictory || bombMode) return;
        setPointerPos(getBoardRelativePoint(e.clientX, e.clientY));
        const target = getTileAtPoint(e.clientX, e.clientY);
        if (!target) return;
        const { r, c } = target;
        const lastPos = selectedPositions[selectedPositions.length - 1];
        if (!lastPos) return;
        if (lastPos.r === r && lastPos.c === c) return;

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
        if (isTutorial) return; // Không check deadlock trong tutorial
        
        const available = findAvailableWords(board, gridType, CONFIG.minWordLength, 5);
        setAvailableWordsCount(available.length);

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

            // === CẬP NHẬT SUGGESTIONS ===
            const paths = findAvailableWordPaths(board, gridType, 3, 20);
            // Lấy ngẫu nhiên 3 từ ngắn nhất
            paths.sort((a, b) => a.word.length - b.word.length);
            let picked: string[] = [];
            if (paths.length > 0) {
                // Cứ 5 lần (dựa vào wordsClearedCount) thì nhét 1 từ hiếm (dài > 3)
                const isRareTurn = wordsClearedCount > 0 && wordsClearedCount % 5 === 0;
                const rareWords = paths.filter(p => p.word.length > 3);
                
                if (isRareTurn && rareWords.length > 0) {
                    picked.push(rareWords[0].word);
                }
                
                // Lấp đầy 3 slot còn lại bằng từ ngắn
                for (let i = 0; i < paths.length && picked.length < 3; i++) {
                    if (!picked.includes(paths[i].word)) picked.push(paths[i].word);
                }
            }
            setSuggestions(picked);
            isBusyRef.current = false;
            setIsProcessing(false);
        }
    };

    // === VALID WORD & PASSWORD LOGIC ===
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

            if (newlyUnlockedLetters.size > 0 && !gameVictory) {
                const centerR = Math.floor(rows / 2);
                const centerC = Math.floor(cols / 2);
                setExplosionEffect({ x: centerC, y: centerR, key: Date.now() });
                setTimeout(() => setExplosionEffect(null), 800);
                
                if (boardRef.current) {
                    const rect = boardRef.current.getBoundingClientRect();
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    triggerParticleBurst(centerX, centerY);
                    setTimeout(() => triggerParticleBurst(centerX, centerY), 150);
                }

                setEasyModeUntil(Date.now() + 30000);
                SOUND.playComboMax();
            }

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

    const handleRestart = () => {
        setScore(0);
        setCombo(1);
        setComboTimeLeft(0);
        setGameOver(false);
        setGameVictory(false);
        setDeadlockCount(0);
        initBoard(gridType);
    };

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
        bombMode,
        setBombMode,
        useMagicWand,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        handleRestart,
        getDragLinePoints,
        boardRef,
        suggestions,
    };
}