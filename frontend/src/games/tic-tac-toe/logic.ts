// Client-side mirror of the backend's Tic Tac Toe rules, used for the
// offline "Practice vs Computer" mode where there's no server round-trip.

export type Cell = "X" | "O" | null;

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export function checkWinner(board: Cell[]) {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line };
    }
  }
  if (board.every((cell) => cell !== null)) return { winner: "draw" as const, line: null };
  return null;
}

export function pickAiMove(board: Cell[], aiSymbol: "X" | "O"): number {
  const human = aiSymbol === "X" ? "O" : "X";
  const empty = board.map((v, i) => (v === null ? i : -1)).filter((i) => i !== -1);

  const tryWinOrBlock = (symbol: "X" | "O") => {
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
