import { GAME_TRIE } from './dictionary';
import { GridType, Position, TileData } from './types';
import { CONFIG } from './config';

/**
 * Returns valid adjacent neighbor coordinates based on grid type.
 * Square: 8-directional (orthogonal + diagonal)
 * Hex: 6-directional axial neighbors (+1,0), (+1,-1), (0,-1), (-1,0), (-1,+1), (0,+1)
 */
export function getNeighbors(
  r: number,
  c: number,
  rows: number,
  cols: number,
  gridType: GridType,
  grid?: (TileData | null)[][]
): Position[] {
  const neighbors: Position[] = [];

  if (gridType === 'square') {
    // 8-directional neighbors (orthogonal + diagonal)
    const deltas = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    for (const [dr, dc] of deltas) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        neighbors.push({ r: nr, c: nc });
      }
    }
  } else {
    // === UPDATED: HEX AXIAL NEIGHBORS (6-WAY) ===
    // Axial coordinates: q = c - HEX_RADIUS, r = r - HEX_RADIUS
    // 6 axial directions: (+1, 0), (+1, -1), (0, -1), (-1, 0), (-1, +1), (0, +1)
    // in array delta (dr, dc): (0, +1), (-1, +1), (-1, 0), (0, -1), (+1, -1), (+1, 0)
    const hexDeltas = [
      [0, 1],   // (+1, 0)  -> dc = +1, dr = 0
      [-1, 1],  // (+1, -1) -> dc = +1, dr = -1
      [-1, 0],  // (0, -1)  -> dc = 0,  dr = -1
      [0, -1],  // (-1, 0)  -> dc = -1, dr = 0
      [1, -1],  // (-1, +1) -> dc = -1, dr = +1
      [1, 0],   // (0, +1)  -> dc = 0,  dr = +1
    ];

    const radius = CONFIG.hexRadius; // N = 3
    for (const [dr, dc] of hexDeltas) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        const axialQ = nc - radius;
        const axialR = nr - radius;
        // Hexagonal board boundary condition: |q| <= N, |r| <= N, |q + r| <= N
        if (Math.abs(axialQ) <= radius && Math.abs(axialR) <= radius && Math.abs(axialQ + axialR) <= radius) {
          if (!grid || grid[nr]?.[nc] !== null) {
            neighbors.push({ r: nr, c: nc, q: axialQ });
          }
        }
      }
    }
  }

  return neighbors;
}

/**
 * Checks if two positions are adjacent.
 */
export function areNeighbors(
  p1: Position,
  p2: Position,
  rows: number,
  cols: number,
  gridType: GridType,
  grid?: (TileData | null)[][]
): boolean {
  const neighbors = getNeighbors(p1.r, p1.c, rows, cols, gridType, grid);
  return neighbors.some((n) => n.r === p2.r && n.c === p2.c);
}

/**
 * Fast DFS traversal with Trie pruning to find all available words on the board.
 * Supports active Phase Trie for difficulty matching.
 */
export function findAvailableWords(
  grid: (TileData | null)[][],
  gridType: GridType,
  minLength: number = 3,
  maxFound: number = 10,
  trie = GAME_TRIE
): string[] {
  const rows = grid.length;
  if (rows === 0) return [];
  const cols = grid[0].length;
  const foundWords = new Set<string>();
  const visited: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));

  function dfs(r: number, c: number, currentWord: string) {
    if (foundWords.size >= maxFound) return;
    if (currentWord.length >= 7) return; // Cap search depth for speed

    if (!trie.startsWith(currentWord)) {
      return; // Trie pruning: no word starts with this prefix
    }

    if (currentWord.length >= minLength && trie.has(currentWord)) {
      foundWords.add(currentWord);
    }

    const neighbors = getNeighbors(r, c, rows, cols, gridType, grid);
    for (const n of neighbors) {
      if (!visited[n.r][n.c]) {
        const nextTile = grid[n.r][n.c];
        if (nextTile) {
          visited[n.r][n.c] = true;
          dfs(n.r, n.c, currentWord + nextTile.letter);
          visited[n.r][n.c] = false;
        }
      }
    }
  }

  // Launch DFS from each tile
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tile = grid[r][c];
      if (tile) {
        visited[r][c] = true;
        dfs(r, c, tile.letter);
        visited[r][c] = false;
        if (foundWords.size >= maxFound) break;
      }
    }
    if (foundWords.size >= maxFound) break;
  }

  return Array.from(foundWords);
}

export interface AvailableWordPath {
  word: string;
  path: Position[];
}

/**
 * Finds available word paths with tile coordinates for tutorial hints and suggestions.
 */
export function findAvailableWordPaths(
  grid: (TileData | null)[][],
  gridType: GridType,
  minLength: number = 3,
  maxFound: number = 5,
  trie = GAME_TRIE
): AvailableWordPath[] {
  const rows = grid.length;
  if (rows === 0) return [];
  const cols = grid[0].length;
  const results: AvailableWordPath[] = [];
  const seenWords = new Set<string>();
  const visited: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));

  function dfs(r: number, c: number, currentWord: string, currentPath: Position[]) {
    if (results.length >= maxFound) return;
    if (currentWord.length >= 6) return;

    if (!trie.startsWith(currentWord)) {
      return;
    }

    if (currentWord.length >= minLength && trie.has(currentWord) && !seenWords.has(currentWord)) {
      seenWords.add(currentWord);
      results.push({ word: currentWord, path: [...currentPath] });
    }

    const neighbors = getNeighbors(r, c, rows, cols, gridType, grid);
    for (const n of neighbors) {
      if (!visited[n.r][n.c]) {
        const nextTile = grid[n.r][n.c];
        if (nextTile) {
          visited[n.r][n.c] = true;
          currentPath.push({ r: n.r, c: n.c, q: nextTile.q });
          dfs(n.r, n.c, currentWord + nextTile.letter, currentPath);
          currentPath.pop();
          visited[n.r][n.c] = false;
        }
      }
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tile = grid[r][c];
      if (tile) {
        visited[r][c] = true;
        const initialPath: Position[] = [{ r, c, q: tile.q }];
        dfs(r, c, tile.letter, initialPath);
        visited[r][c] = false;
        if (results.length >= maxFound) break;
      }
    }
    if (results.length >= maxFound) break;
  }

  return results;
}

/**
 * Performs board shuffle by swapping existing tile positions.
 * Attempts up to maxAttempts to find a permutation with >= targetWords.
 */
export function shuffleBoard(
  grid: (TileData | null)[][],
  gridType: GridType,
  targetWords: number = 2,
  maxAttempts: number = 25,
  trie = GAME_TRIE
): { success: boolean; newGrid: (TileData | null)[][]; availableWords: string[] } {
  const rows = grid.length;
  const cols = grid[0].length;

  // Extract all valid tiles
  const tiles: TileData[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const t = grid[r][c];
      if (t) tiles.push(t);
    }
  }

  if (tiles.length === 0) {
    return { success: false, newGrid: grid, availableWords: [] };
  }

  let bestGrid = grid;
  let bestWords: string[] = [];

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Fisher-Yates shuffle tile array
    const shuffled = [...tiles];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Place into test grid
    const testGrid: (TileData | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));
    let tileIdx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] !== null && tileIdx < shuffled.length) {
          const old = shuffled[tileIdx++];
          testGrid[r][c] = {
            ...old,
            r,
            c,
            q: gridType === 'hex' ? c - CONFIG.hexRadius : undefined,
            id: `tile-${r}-${c}-${Date.now()}-${attempt}`,
          };
        }
      }
    }

    const available = findAvailableWords(testGrid, gridType, 3, 5, trie);
    if (available.length >= targetWords) {
      return { success: true, newGrid: testGrid, availableWords: available };
    }

    if (available.length > bestWords.length) {
      bestWords = available;
      bestGrid = testGrid;
    }
  }

  // If after max attempts we found at least 1 word:
  if (bestWords.length > 0) {
    return { success: true, newGrid: bestGrid, availableWords: bestWords };
  }

  return { success: false, newGrid: bestGrid, availableWords: [] };
}

