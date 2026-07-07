"use client";

import clsx from "clsx";

type Cell = "X" | "O" | null;

export default function TicTacToeBoard({
  board,
  winLine,
  disabled,
  onCellClick,
}: {
  board: Cell[];
  winLine: number[] | null;
  disabled: boolean;
  onCellClick: (index: number) => void;
}) {
  return (
    <div className="mx-auto grid w-72 grid-cols-3 gap-2">
      {board.map((cell, i) => {
        const isWinCell = winLine?.includes(i);
        return (
          <button
            key={i}
            disabled={disabled || cell !== null}
            onClick={() => onCellClick(i)}
            className={clsx(
              "flex aspect-square items-center justify-center rounded-lg border-2 text-4xl font-bold transition",
              isWinCell
                ? "border-pencil bg-pencil/20"
                : "border-paper-line bg-white/70 hover:bg-white",
              cell === "X" && "text-inkblue",
              cell === "O" && "text-redpen",
              !cell && !disabled && "cursor-pointer"
            )}
          >
            {cell}
          </button>
        );
      })}
    </div>
  );
}
