import React, { useMemo } from 'react';
import { Position, TileData, GridType } from '../game/types';
import { CONFIG, LETTER_POINTS } from '../game/config';

interface GameBoardProps {
    grid: (TileData | null)[][];
    gridType: GridType;
    isProcessing: boolean;
    selectedPositions: Position[];
    invalidPositions: Position[];
    scorePopups: any[];
    particles: any[];
    boardRef: React.RefObject<HTMLDivElement | null>
    onPointerDown: (r: number, c: number, e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: () => void;
    getDragLinePoints: () => string;
    isDragging: boolean;
    showPhaseTransition?: boolean;
    explosionEffect?: { x: number; y: number; key: number } | null;
}

const rows = 7;
const cols = 7;

export function GameBoard({
    grid,
    gridType,
    isProcessing,
    selectedPositions,
    invalidPositions,
    scorePopups,
    particles,
    boardRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    getDragLinePoints,
    showPhaseTransition,
    explosionEffect,
}: GameBoardProps) {
    // ==== HEX LAYOUT CONSTANTS (copy từ App.tsx cũ) ====
    const hexSize = 39.5;
    const boardCenterX = 230;
    const boardCenterY = 230;
    const hexTileScale = hexSize / 39.5;
    const hexWidth = 63.67 * hexTileScale;
    const hexHeight = hexWidth * (102 / 92);
    const hexRowStepY = hexHeight * (76 / 102);
    const svgBoxW = hexWidth * (100 / 92);
    const svgBoxH = hexHeight * (120 / 102);
    const tileCx = svgBoxW * 0.5;
    const tileCy = svgBoxH * (53 / 120);
    const hexTopFacePoints = '50,2 96,28 96,78 50,104 4,78 4,28';
    const hexSideFacePoints = '50,7 96,33 96,83 50,109 4,83 4,33';
    const hexSideFaceSelectedPoints = '50,10 96,36 96,86 50,112 4,86 4,36';
    const hexHighlightPolylinePoints = '50,2 4,28 4,78';

    const hexClusterOutline = useMemo(() => {
        const activeTiles: { q: number; r: number; px: number; py: number }[] = [];
        grid.forEach((row, r) => {
            row.forEach((tile, c) => {
                if (!tile) return;
                const axialQ = tile.q ?? c - CONFIG.hexRadius;
                const axialR = r - CONFIG.hexRadius;
                const px = boardCenterX + hexWidth * (axialQ + 0.5 * axialR);
                const py = boardCenterY + hexRowStepY * axialR;
                activeTiles.push({ q: axialQ, r: axialR, px, py });
            });
        });
        if (activeTiles.length === 0) {
            return { outlinePoints: '', skirtPoints: '', topHighlightPoints: '' };
        }
        const tileSet = new Set(activeTiles.map((t) => `${t.q},${t.r}`));
        const hw = hexWidth * 0.5;
        const hh = hexHeight * (51 / 102);
        const qh = hexHeight * (25 / 102);
        interface Point {
            x: number;
            y: number;
        }
        const outerEdges: { start: Point; end: Point }[] = [];
        activeTiles.forEach(({ q, r, px, py }) => {
            const v = [
                { x: px, y: py - hh },
                { x: px + hw, y: py - qh },
                { x: px + hw, y: py + qh },
                { x: px, y: py + hh },
                { x: px - hw, y: py + qh },
                { x: px - hw, y: py - qh },
            ];
            const neighbors = [
                { dq: 0, dr: -1 },
                { dq: 1, dr: -1 },
                { dq: 1, dr: 0 },
                { dq: 0, dr: 1 },
                { dq: -1, dr: 1 },
                { dq: -1, dr: 0 },
            ];
            for (let i = 0; i < 6; i++) {
                const nq = q + neighbors[i].dq;
                const nr = r + neighbors[i].dr;
                if (!tileSet.has(`${nq},${nr}`)) {
                    const start = i === 0 ? v[5] : v[i - 1];
                    const end = v[i];
                    outerEdges.push({ start, end });
                }
            }
        });
        if (outerEdges.length === 0) {
            return { outlinePoints: '', skirtPoints: '', topHighlightPoints: '' };
        }
        let startIdx = 0;
        let minY = Infinity;
        outerEdges.forEach((edge, idx) => {
            if (edge.start.y < minY) {
                minY = edge.start.y;
                startIdx = idx;
            }
        });
        const orderedLoop: Point[] = [outerEdges[startIdx].start];
        let currEdge = outerEdges[startIdx];
        const visited = new Set<number>([startIdx]);
        for (let step = 0; step < outerEdges.length; step++) {
            orderedLoop.push(currEdge.end);
            let nextIdx = -1;
            let bestDist = Infinity;
            for (let j = 0; j < outerEdges.length; j++) {
                if (!visited.has(j)) {
                    const dx = outerEdges[j].start.x - currEdge.end.x;
                    const dy = outerEdges[j].start.y - currEdge.end.y;
                    const dist = Math.hypot(dx, dy);
                    if (dist < 0.5 && dist < bestDist) {
                        bestDist = dist;
                        nextIdx = j;
                    }
                }
            }
            if (nextIdx === -1) break;
            visited.add(nextIdx);
            currEdge = outerEdges[nextIdx];
        }
        if (
            orderedLoop.length > 1 &&
            Math.hypot(
                orderedLoop[0].x - orderedLoop[orderedLoop.length - 1].x,
                orderedLoop[0].y - orderedLoop[orderedLoop.length - 1].y
            ) < 0.5
        ) {
            orderedLoop.pop();
        }
        const outlinePoints = orderedLoop
            .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
            .join(' ');
        let minXIdx = 0;
        let maxXIdx = 0;
        orderedLoop.forEach((p, idx) => {
            if (p.x < orderedLoop[minXIdx].x) minXIdx = idx;
            if (p.x > orderedLoop[maxXIdx].x) maxXIdx = idx;
        });
        const topArc: Point[] =
            minXIdx <= maxXIdx
                ? orderedLoop.slice(minXIdx, maxXIdx + 1)
                : orderedLoop.slice(minXIdx).concat(orderedLoop.slice(0, maxXIdx + 1));
        const topHighlightPoints = topArc
            .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
            .join(' ');
        const bottomArc: Point[] =
            maxXIdx <= minXIdx
                ? orderedLoop.slice(maxXIdx, minXIdx + 1)
                : orderedLoop.slice(maxXIdx).concat(orderedLoop.slice(0, minXIdx + 1));
        const sideShiftY = 6.0;
        const skirtPolygon: Point[] = [
            ...bottomArc,
            ...bottomArc.slice().reverse().map((p) => ({ x: p.x, y: p.y + sideShiftY })),
        ];
        const skirtPoints = skirtPolygon
            .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
            .join(' ');
        return { outlinePoints, skirtPoints, topHighlightPoints };
    }, [grid, hexWidth, hexHeight, hexRowStepY]);

    return (
        <div
            ref={boardRef}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            className={`touch-none select-none relative w-full flex items-center justify-center max-w-[460px] aspect-square transition-all duration-300 ${gridType === 'square' ? 'wood-board-tray p-3 sm:p-4' : ''
                } ${isProcessing ? 'opacity-95' : 'opacity-100'} ${showPhaseTransition ? 'board-phase-flash' : ''
                } ${explosionEffect ? 'board-shake' : ''}`}
            style={{ touchAction: 'none' }}
        >
            {/* Shared SVG defs */}
            <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
                <defs>
                    <filter id="hexBoardShadow" x="-15%" y="-15%" width="130%" height="130%">
                        <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#4A3527" floodOpacity="0.2" />
                    </filter>
                    <filter id="hexTileShadow" x="-20%" y="-15%" width="140%" height="150%">
                        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#4A3527" floodOpacity="0.25" />
                    </filter>
                    <linearGradient id="hexMosaicTopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#F5EFE6" />
                        <stop offset="100%" stopColor="#EAE0D0" />
                    </linearGradient>
                    <linearGradient id="hexMosaicSelectedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FDF0D5" />
                        <stop offset="50%" stopColor="#F4D58D" />
                        <stop offset="100%" stopColor="#E89B7B" />
                    </linearGradient>
                    <linearGradient id="hexMosaicInvalidGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FEE2E2" />
                        <stop offset="100%" stopColor="#FECDD3" />
                    </linearGradient>
                    <linearGradient id="dragGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#F4D58D" />
                        <stop offset="50%" stopColor="#F7B267" />
                        <stop offset="100%" stopColor="#E89B7B" />
                    </linearGradient>
                    <filter id="dragGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#9E4B16" floodOpacity="0.35" />
                    </filter>
                </defs>
            </svg>

            {/* Hex board outline */}
            {gridType === 'hex' && hexClusterOutline.outlinePoints && (
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox="0 0 460 460"
                    style={{ zIndex: 10 }}
                >
                    {hexClusterOutline.skirtPoints && (
                        <polygon
                            points={hexClusterOutline.skirtPoints}
                            fill="#D4C4A8"
                            stroke="#C4B498"
                            strokeWidth="2"
                            strokeLinejoin="round"
                            filter="url(#hexBoardShadow)"
                        />
                    )}
                    <polygon
                        points={hexClusterOutline.outlinePoints}
                        fill="url(#hexMosaicTopGrad)"
                        stroke="#8B6F5C"
                        strokeWidth="3.5"
                        strokeLinejoin="round"
                    />
                </svg>
            )}

            {/* Drag line */}
            <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ overflow: 'visible', zIndex: 30 }}
            >
                {selectedPositions.length > 0 && (
                    <polyline
                        points={getDragLinePoints()}
                        fill="none"
                        stroke="url(#dragGrad)"
                        strokeWidth={window.innerWidth < 640 ? '6' : '7.5'}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#dragGlow)"
                    />
                )}
            </svg>

            {/* Score popups */}
            {scorePopups.map((popup: any) => (
                <div
                    key={popup.id}
                    className="absolute pointer-events-none z-50 animate-score-float flex flex-col items-center"
                    style={{ left: `${popup.x}px`, top: `${popup.y}px`, transform: 'translate(-50%, -50%)' }}
                >
                    <span className="text-xl sm:text-2xl font-black text-[#D97706] drop-shadow-[0_2px_0_#FFF] tracking-tight">
                        +{popup.score}
                    </span>
                    {popup.combo > 1 && (
                        <span className="text-xs font-black text-[#E89B7B] bg-[#FFFDF9] px-2 py-0.5 rounded-full border border-[#E89B7B] shadow-sm">
                            COMBO x{popup.combo}!
                        </span>
                    )}
                </div>
            ))}

            {/* Particles */}
            <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
                {particles.map((p: any) => (
                    <div
                        key={p.id}
                        className="absolute"
                        style={{
                            left: `${p.x}px`,
                            top: `${p.y}px`,
                            width: `${p.size}px`,
                            height: `${p.size}px`,
                            backgroundColor: p.color,
                            borderRadius: p.shape === 'circle' ? '50%' : '2px',
                            transform: `translate(-50%, -50%) rotate(${p.rotation}deg)`,
                            opacity: p.opacity,
                        }}
                    />
                ))}
            </div>

                  {/* === NEW: Explosion Visual === */}
                {explosionEffect && (
                    <div
                    key={explosionEffect.key}
                    className="explosion-container"
                    style={{
                        left: `${((explosionEffect.x + 0.5) / cols) * 100}%`,
                        top: `${((explosionEffect.y + 0.5) / rows) * 100}%`,
                    }}
                    >
                    <div className="explosion-flash" />
                    <div className="explosion-shockwave" />
                    <div className="explosion-core" />
                    </div>
                )}

            {/* SQUARE GRID */}
            {gridType === 'square' ? (
                <div
                    className="grid w-full h-full gap-1.5 sm:gap-2 z-20"
                    style={{
                        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                    }}
                >
                    {grid.map((row, r) =>
                        row.map((tile, c) => {
                            const isSelected = selectedPositions.some((p) => p.r === r && p.c === c);
                            const isInvalid = invalidPositions.some((p) => p.r === r && p.c === c);
                            const isClearing = tile?.clearing;
                            const isSpawning = tile?.isNew;
                            return (
                                <div
                                    key={tile?.id || `sq-${r}-${c}`}
                                    data-tile-r={r}
                                    data-tile-c={c}
                                    onPointerDown={(e) => onPointerDown(r, c, e)}
                                    className={`tile-3d-square relative flex flex-col items-center justify-center cursor-pointer select-none ${tile?.isHint ? 'is-hint' : ''
                                        } ${isSelected ? 'is-selected' : ''} ${isInvalid ? 'is-invalid' : ''} ${isClearing ? 'is-clearing' : ''
                                        } ${isSpawning ? 'is-spawning' : ''} ${!isSelected && !isInvalid && !isClearing && !isSpawning ? 'animate-breathe' : ''
                                        }`}
                                    style={{
                                        animationDelay: isSpawning && tile?.spawnDelay !== undefined
                                            ? `${tile.spawnDelay}ms`
                                            : undefined,
                                        ['--breathe-delay' as string]: `${(r * cols + c) * 0.08}s`,
                                        ['--spawn-distance' as string]:
                                            tile?.spawnDistance !== undefined ? `${tile.spawnDistance}px` : '38px',
                                    } as React.CSSProperties}
                                >
                                    <span className="text-2xl sm:text-3xl font-extrabold wordplay-letter-square leading-none pointer-events-none mt-0.5">
                                        {tile?.letter || ''}
                                    </span>
                                    <span className="absolute bottom-1 right-1.5 text-[10px] sm:text-[11px] font-extrabold text-[#8B6F5C]/80 leading-none pointer-events-none">
                                        {tile?.points || 1}
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>
            ) : (
                /* HEX GRID */
                <div className="relative w-[460px] h-[460px] z-20">
                    {grid.map((row, r) =>
                        row.map((tile, c) => {
                            if (!tile) return null;
                            const axialQ = tile.q ?? c - CONFIG.hexRadius;
                            const axialR = r - CONFIG.hexRadius;
                            const px = boardCenterX + hexWidth * (axialQ + 0.5 * axialR);
                            const py = boardCenterY + hexRowStepY * axialR;
                            const isSelected = selectedPositions.some((p) => p.r === r && p.c === c);
                            const isInvalid = invalidPositions.some((p) => p.r === r && p.c === c);
                            const isClearing = tile.clearing;
                            const isSpawning = tile.isNew;
                            return (
                                <div
                                    key={tile.id}
                                    data-tile-r={r}
                                    data-tile-c={c}
                                    onPointerDown={(e) => onPointerDown(r, c, e)}
                                    className={`mosaic-hex-tile ${tile.isHint ? 'is-hint' : ''} ${isSelected ? 'is-selected' : ''
                                        } ${isInvalid ? 'is-invalid' : ''} ${isClearing ? 'is-clearing' : ''} ${isSpawning ? 'is-spawning' : ''
                                        } ${!isSelected && !isInvalid && !isClearing && !isSpawning ? 'animate-breathe' : ''}`}
                                    style={{
                                        width: `${svgBoxW}px`,
                                        height: `${svgBoxH}px`,
                                        left: `${px - tileCx}px`,
                                        top: `${py - tileCy}px`,
                                        animationDelay:
                                            isSpawning && tile.spawnDelay !== undefined
                                                ? `${tile.spawnDelay}ms`
                                                : `${((axialQ + 3) * 7 + (axialR + 3)) * 0.05}s`,
                                        ['--spawn-distance' as string]:
                                            tile.spawnDistance !== undefined ? `${tile.spawnDistance}px` : '38px',
                                    } as React.CSSProperties}
                                >
                                    <svg viewBox="0 0 100 120" className="w-full h-full pointer-events-none overflow-visible">
                                        <g
                                            style={{
                                                transformOrigin: '50px 53px',
                                            }}
                                        >
                                            <polygon
                                                points={isSelected ? hexSideFaceSelectedPoints : hexSideFacePoints}
                                                fill={isSelected ? '#9E4B16' : isInvalid ? '#DC2626' : '#D4C4A8'}
                                                stroke={isSelected ? '#7C3A10' : isInvalid ? '#B91C1C' : '#C4B498'}
                                                strokeWidth="2"
                                                strokeLinejoin="round"
                                                filter="url(#hexTileShadow)"
                                            />
                                            <polygon
                                                points={hexTopFacePoints}
                                                transform={isSelected ? 'translate(0, -4)' : 'translate(0, 0)'}
                                                fill={
                                                    isSelected
                                                        ? 'url(#hexMosaicSelectedGrad)'
                                                        : isInvalid
                                                            ? 'url(#hexMosaicInvalidGrad)'
                                                            : 'url(#hexMosaicTopGrad)'
                                                }
                                                stroke={isSelected ? '#D97706' : isInvalid ? '#F87171' : '#D4C4A8'}
                                                strokeWidth="2"
                                                strokeLinejoin="round"
                                            />
                                            <polyline
                                                points={hexHighlightPolylinePoints}
                                                transform={isSelected ? 'translate(0, -4)' : 'translate(0, 0)'}
                                                stroke="white"
                                                strokeOpacity={isSelected ? 0.9 : 0.65}
                                                strokeWidth={isSelected ? '2' : '1.8'}
                                                fill="none"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                            <g transform={isSelected ? 'translate(0, -4)' : 'translate(0, 0)'}>
                                                <text
                                                    x="50"
                                                    y="55"
                                                    textAnchor="middle"
                                                    dominantBaseline="central"
                                                    fontFamily="'Fredoka', 'Baloo 2', sans-serif"
                                                    fontSize="48"
                                                    fontWeight="700"
                                                    letterSpacing="-1"
                                                    fill="#1A2A3A"
                                                >
                                                    {tile.letter}
                                                </text>
                                                <text
                                                    x="76"
                                                    y="86"
                                                    textAnchor="middle"
                                                    dominantBaseline="central"
                                                    fontFamily="'Fredoka', sans-serif"
                                                    fontSize="17"
                                                    fontWeight="800"
                                                    fill={isSelected ? '#78350F' : '#8B6F5C'}
                                                    opacity="0.85"
                                                >
                                                    {tile.points}
                                                </text>
                                            </g>
                                        </g>
                                    </svg>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Board frame overlay */}
            {gridType === 'hex' && hexClusterOutline.outlinePoints && (
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ zIndex: 22 }}
                    viewBox="0 0 460 460"
                >
                    <polygon
                        points={hexClusterOutline.outlinePoints}
                        fill="none"
                        stroke="#8B6F5C"
                        strokeWidth="3.5"
                        strokeLinejoin="round"
                    />
                    {hexClusterOutline.topHighlightPoints && (
                        <polyline
                            points={hexClusterOutline.topHighlightPoints}
                            stroke="white"
                            strokeOpacity="0.5"
                            strokeWidth="2.5"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    )}
                </svg>
            )}
        </div>
    );
}