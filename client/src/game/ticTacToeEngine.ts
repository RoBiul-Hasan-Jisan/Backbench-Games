export type Cell = 'X' | 'O' | null;
export type BoardSize = 3 | 5 | 8;
export type TttDifficulty = 'easy' | 'medium' | 'hard';

export interface WinInfo {
  line: number[]; // flat indices of the winning run
  player: 'X' | 'O';
}

/** Win condition: get N marks in a row, where N equals the board size (real-world rule). */
export function winLengthFor(size: BoardSize): number {
  return size;
}

function idx(size: number, r: number, c: number) {
  return r * size + c;
}

/** Scans the whole board for a completed run of `winLen` identical marks. */
export function checkWinner(board: Cell[], size: BoardSize): WinInfo | null {
  const winLen = winLengthFor(size);
  const dirs = [
    [0, 1], // horizontal
    [1, 0], // vertical
    [1, 1], // diagonal down-right
    [1, -1], // diagonal down-left
  ];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const start = board[idx(size, r, c)];
      if (!start) continue;

      for (const [dr, dc] of dirs) {
        const line: number[] = [idx(size, r, c)];
        let rr = r;
        let cc = c;
        let ok = true;
        for (let k = 1; k < winLen; k++) {
          rr += dr;
          cc += dc;
          if (rr < 0 || rr >= size || cc < 0 || cc >= size) {
            ok = false;
            break;
          }
          if (board[idx(size, rr, cc)] !== start) {
            ok = false;
            break;
          }
          line.push(idx(size, rr, cc));
        }
        if (ok) return { line, player: start };
      }
    }
  }
  return null;
}

export function isBoardFull(board: Cell[]): boolean {
  return board.every((c) => c !== null);
}

/** Picks the CPU's next move index given the current board. */
export function getComputerMove(
  board: Cell[],
  size: BoardSize,
  cpuMark: 'X' | 'O',
  humanMark: 'X' | 'O',
  difficulty: TttDifficulty
): number {
  const empties = board.map((c, i) => (c === null ? i : -1)).filter((i) => i >= 0);
  if (empties.length === 0) return -1;

  if (difficulty === 'easy') {
    return empties[Math.floor(Math.random() * empties.length)];
  }

  // 1. Always take an immediate winning move if one exists.
  for (const i of empties) {
    const trial = board.slice();
    trial[i] = cpuMark;
    if (checkWinner(trial, size)?.player === cpuMark) return i;
  }

  // 2. Block the human's immediate winning move.
  for (const i of empties) {
    const trial = board.slice();
    trial[i] = humanMark;
    if (checkWinner(trial, size)?.player === humanMark) return i;
  }

  if (difficulty === 'medium') {
    // Prefer center/near-center cells, otherwise random.
    const center = (size - 1) / 2;
    const scored = empties
      .map((i) => {
        const r = Math.floor(i / size);
        const c = i % size;
        const dist = Math.abs(r - center) + Math.abs(c - center);
        return { i, dist: dist + Math.random() * 2 };
      })
      .sort((a, b) => a.dist - b.dist);
    return scored[0].i;
  }

  // HARD: exact minimax for small boards (3x3), heuristic look-ahead for bigger ones.
  if (size === 3) {
    return minimaxBestMove(board, size, cpuMark, humanMark);
  }
  return heuristicBestMove(board, size, cpuMark, humanMark);
}

/** Full minimax (with depth limiting) — only tractable for the 3x3 board. */
function minimaxBestMove(board: Cell[], size: BoardSize, cpuMark: 'X' | 'O', humanMark: 'X' | 'O'): number {
  const empties = board.map((c, i) => (c === null ? i : -1)).filter((i) => i >= 0);

  let bestScore = -Infinity;
  let bestMove = empties[0];

  for (const i of empties) {
    const trial = board.slice();
    trial[i] = cpuMark;
    const score = minimax(trial, size, 0, false, cpuMark, humanMark);
    if (score > bestScore) {
      bestScore = score;
      bestMove = i;
    }
  }
  return bestMove;
}

function minimax(
  board: Cell[],
  size: BoardSize,
  depth: number,
  isMaximizing: boolean,
  cpuMark: 'X' | 'O',
  humanMark: 'X' | 'O'
): number {
  const win = checkWinner(board, size);
  if (win) return win.player === cpuMark ? 10 - depth : depth - 10;
  if (isBoardFull(board)) return 0;

  const empties = board.map((c, i) => (c === null ? i : -1)).filter((i) => i >= 0);

  if (isMaximizing) {
    let best = -Infinity;
    for (const i of empties) {
      const trial = board.slice();
      trial[i] = cpuMark;
      best = Math.max(best, minimax(trial, size, depth + 1, false, cpuMark, humanMark));
    }
    return best;
  } else {
    let best = Infinity;
    for (const i of empties) {
      const trial = board.slice();
      trial[i] = humanMark;
      best = Math.min(best, minimax(trial, size, depth + 1, true, cpuMark, humanMark));
    }
    return best;
  }
}

/**
 * Heuristic move scorer for 5x5 / 8x8 boards, where full minimax is computationally infeasible.
 * Scores each empty cell by how many potential winning lines it contributes to for the CPU,
 * minus how many it would open up for the human, weighted by run length already achieved.
 */
function heuristicBestMove(board: Cell[], size: BoardSize, cpuMark: 'X' | 'O', humanMark: 'X' | 'O'): number {
  const empties = board.map((c, i) => (c === null ? i : -1)).filter((i) => i >= 0);
  const winLen = winLengthFor(size);
  const dirs = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];

  const scoreFor = (i: number, mark: 'X' | 'O') => {
    const r = Math.floor(i / size);
    const c = i % size;
    let score = 0;

    for (const [dr, dc] of dirs) {
      // Look at every window of length `winLen` through this cell along this direction.
      for (let offset = -(winLen - 1); offset <= 0; offset++) {
        let count = 0;
        let blocked = false;
        for (let k = 0; k < winLen; k++) {
          const rr = r + (offset + k) * dr;
          const cc = c + (offset + k) * dc;
          if (rr < 0 || rr >= size || cc < 0 || cc >= size) {
            blocked = true;
            break;
          }
          const cell = rr === r && cc === c ? mark : board[idx(size, rr, cc)];
          if (cell === mark) count++;
          else if (cell !== null) {
            blocked = true;
            break;
          }
        }
        if (!blocked) score += Math.pow(3, count);
      }
    }
    return score;
  };

  let bestMove = empties[0];
  let bestScore = -Infinity;
  for (const i of empties) {
    const offense = scoreFor(i, cpuMark);
    const defense = scoreFor(i, humanMark);
    const centerBonus = 1 / (1 + Math.abs(Math.floor(i / size) - (size - 1) / 2) + Math.abs((i % size) - (size - 1) / 2));
    const total = offense * 1.1 + defense + centerBonus;
    if (total > bestScore) {
      bestScore = total;
      bestMove = i;
    }
  }
  return bestMove;
}
