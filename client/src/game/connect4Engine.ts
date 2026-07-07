export type C4Cell = 'R' | 'Y' | null;
export type C4Difficulty = 'easy' | 'medium' | 'hard';

export const C4_ROWS = 6;
export const C4_COLS = 7;

function idx(col: number, row: number) {
  return row * C4_COLS + col;
}

/** Returns the row index the disc will land on for a given column, or -1 if full. */
export function getDropRow(board: C4Cell[], col: number): number {
  for (let r = C4_ROWS - 1; r >= 0; r--) {
    if (board[idx(col, r)] === null) return r;
  }
  return -1;
}

export function isBoardFull(board: C4Cell[]): boolean {
  return board.every((c) => c !== null);
}

export function checkWinner(board: C4Cell[]): { line: number[]; player: 'R' | 'Y' } | null {
  const dirs = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  for (let r = 0; r < C4_ROWS; r++) {
    for (let c = 0; c < C4_COLS; c++) {
      const start = board[idx(c, r)];
      if (!start) continue;
      for (const [dr, dc] of dirs) {
        const line = [idx(c, r)];
        let rr = r;
        let cc = c;
        let ok = true;
        for (let k = 1; k < 4; k++) {
          rr += dr;
          cc += dc;
          if (rr < 0 || rr >= C4_ROWS || cc < 0 || cc >= C4_COLS || board[idx(cc, rr)] !== start) {
            ok = false;
            break;
          }
          line.push(idx(cc, rr));
        }
        if (ok) return { line, player: start };
      }
    }
  }
  return null;
}

function scoreWindow(cells: C4Cell[], mark: 'R' | 'Y', opp: 'R' | 'Y'): number {
  const markCount = cells.filter((c) => c === mark).length;
  const oppCount = cells.filter((c) => c === opp).length;
  const emptyCount = cells.filter((c) => c === null).length;
  if (markCount === 4) return 1000;
  if (markCount === 3 && emptyCount === 1) return 25;
  if (markCount === 2 && emptyCount === 2) return 5;
  if (oppCount === 3 && emptyCount === 1) return -60;
  return 0;
}

function evaluateBoard(board: C4Cell[], mark: 'R' | 'Y', opp: 'R' | 'Y'): number {
  let score = 0;
  // center column preference
  for (let r = 0; r < C4_ROWS; r++) {
    if (board[idx(3, r)] === mark) score += 4;
  }
  const dirs = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  for (let r = 0; r < C4_ROWS; r++) {
    for (let c = 0; c < C4_COLS; c++) {
      for (const [dr, dc] of dirs) {
        const cells: C4Cell[] = [];
        let ok = true;
        for (let k = 0; k < 4; k++) {
          const rr = r + dr * k;
          const cc = c + dc * k;
          if (rr < 0 || rr >= C4_ROWS || cc < 0 || cc >= C4_COLS) {
            ok = false;
            break;
          }
          cells.push(board[idx(cc, rr)]);
        }
        if (ok) score += scoreWindow(cells, mark, opp);
      }
    }
  }
  return score;
}

function validCols(board: C4Cell[]): number[] {
  const cols: number[] = [];
  for (let c = 0; c < C4_COLS; c++) if (getDropRow(board, c) >= 0) cols.push(c);
  return cols;
}

function minimax(
  board: C4Cell[],
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  mark: 'R' | 'Y',
  opp: 'R' | 'Y'
): number {
  const win = checkWinner(board);
  if (win) return win.player === mark ? 100000 - depth : depth - 100000;
  if (isBoardFull(board) || depth === 0) return evaluateBoard(board, mark, opp);

  const cols = validCols(board);
  if (maximizing) {
    let best = -Infinity;
    for (const c of cols) {
      const row = getDropRow(board, c);
      const trial = board.slice();
      trial[idx(c, row)] = mark;
      const val = minimax(trial, depth - 1, alpha, beta, false, mark, opp);
      best = Math.max(best, val);
      alpha = Math.max(alpha, best);
      if (alpha >= beta) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const c of cols) {
      const row = getDropRow(board, c);
      const trial = board.slice();
      trial[idx(c, row)] = opp;
      const val = minimax(trial, depth - 1, alpha, beta, true, mark, opp);
      best = Math.min(best, val);
      beta = Math.min(beta, best);
      if (alpha >= beta) break;
    }
    return best;
  }
}

export function getComputerMove(board: C4Cell[], cpuMark: 'R' | 'Y', humanMark: 'R' | 'Y', difficulty: C4Difficulty): number {
  const cols = validCols(board);
  if (difficulty === 'easy') {
    return cols[Math.floor(Math.random() * cols.length)];
  }

  // Immediate win check
  for (const c of cols) {
    const row = getDropRow(board, c);
    const trial = board.slice();
    trial[idx(c, row)] = cpuMark;
    if (checkWinner(trial)?.player === cpuMark) return c;
  }
  // Immediate block check
  for (const c of cols) {
    const row = getDropRow(board, c);
    const trial = board.slice();
    trial[idx(c, row)] = humanMark;
    if (checkWinner(trial)?.player === humanMark) return c;
  }

  const depth = difficulty === 'hard' ? 5 : 3;
  let bestScore = -Infinity;
  let bestCol = cols[Math.floor(cols.length / 2)];
  for (const c of cols) {
    const row = getDropRow(board, c);
    const trial = board.slice();
    trial[idx(c, row)] = cpuMark;
    const score = minimax(trial, depth - 1, -Infinity, Infinity, false, cpuMark, humanMark);
    if (score > bestScore) {
      bestScore = score;
      bestCol = c;
    }
  }
  return bestCol;
}
