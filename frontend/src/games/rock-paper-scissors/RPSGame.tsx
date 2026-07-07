"use client";

import clsx from "clsx";

const PICKS = [
  { id: "rock", emoji: "✊", label: "Rock" },
  { id: "paper", emoji: "✋", label: "Paper" },
  { id: "scissors", emoji: "✌️", label: "Scissors" },
] as const;

export default function RPSGame({
  hasPicked,
  disabled,
  lastRoundResult,
  onPick,
}: {
  hasPicked: boolean;
  disabled: boolean;
  lastRoundResult: { picks: Record<string, string>; winnerId: string | null } | null;
  onPick: (pick: string) => void;
}) {
  return (
    <div className="mx-auto max-w-sm text-center">
      {hasPicked && !lastRoundResult && (
        <p className="mb-4 text-sm text-chalkboard-dark/60">
          Waiting for opponent's pick...
        </p>
      )}

      <div className="flex justify-center gap-4">
        {PICKS.map((p) => (
          <button
            key={p.id}
            disabled={disabled || hasPicked}
            onClick={() => onPick(p.id)}
            className={clsx(
              "flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-paper-line bg-white/70 text-3xl transition hover:-translate-y-1 hover:shadow-md",
              (disabled || hasPicked) && "cursor-not-allowed opacity-50"
            )}
          >
            <span>{p.emoji}</span>
            <span className="text-xs font-medium text-chalkboard-dark/60">{p.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
