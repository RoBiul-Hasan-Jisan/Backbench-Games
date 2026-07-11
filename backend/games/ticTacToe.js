// Server-authoritative Tic Tac Toe logic.
// Board is a length-9 array: null | "X" | "O"

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],            // diagonals
];

function createInitialState() {
  return {
    board: Array(9).fill(null),
    turn: "X",
    winner: null,   // "X" | "O" | "draw" | null
    winLine: null,
  };
}

function checkWinner(board) {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line };
    }
  }
  if (board.every((cell) => cell !== null)) {
    return { winner: "draw", line: null };
  }
  return null;
}

// symbols: { [socketId]: "X" | "O" }
function applyMove(state, symbol, cellIndex) {
  if (state.winner) return { ok: false, reason: "Game already finished." };
  if (symbol !== state.turn) return { ok: false, reason: "Not your turn." };
  if (cellIndex < 0 || cellIndex > 8) return { ok: false, reason: "Invalid cell." };
  if (state.board[cellIndex] !== null) return { ok: false, reason: "Cell already taken." };

  const nextBoard = [...state.board];
  nextBoard[cellIndex] = symbol;

  const result = checkWinner(nextBoard);

  const nextState = {
    board: nextBoard,
    turn: symbol === "X" ? "O" : "X",
    winner: result ? result.winner : null,
    winLine: result ? result.line : null,
  };

  return { ok: true, state: nextState };
}

// Very small heuristic AI for single-player / local practice mode.
function pickAiMove(board, aiSymbol) {
  const human = aiSymbol === "X" ? "O" : "X";
  const empty = board.map((v, i) => (v === null ? i : -1)).filter((i) => i !== -1);

  const tryWinOrBlock = (symbol) => {
    for (const i of empty) {
      const copy = [...board];
      copy[i] = symbol;
      if (checkWinner(copy)?.winner === symbol) return i;
    }
    return null;
  };

  return (
    tryWinOrBlock(aiSymbol) ??
    tryWinOrBlock(human) ??
    (board[4] === null ? 4 : null) ??
    empty[Math.floor(Math.random() * empty.length)]
  );
}

module.exports = { createInitialState, applyMove, checkWinner, pickAiMove };
