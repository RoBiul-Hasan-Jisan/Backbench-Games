"use client";

import type { GameRoom } from "./types";

export function Scoreboard({ room, currentPlayerId }: { room: GameRoom; currentPlayerId: string }) {
  const isBatter = room.batterId === currentPlayerId;
  const batter = room.players.find((p) => p.id === room.batterId);
  if (!batter) return null;

  const inningsText = room.status === "FIRST_INNINGS" ? "1st Innings" : "2nd Innings";

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-paper-line bg-white/70 p-6 text-center">
      <div
        className={`absolute top-0 left-0 h-[3px] w-full ${
          isBatter ? "bg-pencil" : "bg-inkblue"
        }`}
      />

      <div className="mt-2 mb-1 font-mono text-xs uppercase tracking-widest text-chalkboard-dark/50">
        {inningsText}
      </div>

      <div className="my-2 flex items-baseline justify-center gap-1">
        <span className="text-5xl font-extrabold tracking-tight text-chalkboard-dark">
          {batter.score}
        </span>
        <span className="text-2xl font-bold text-chalkboard-dark/30">/</span>
        <span className="text-xl font-semibold text-chalkboard-dark/50">
          {batter.wickets === 1 ? "1" : "0"}
        </span>
      </div>

      <div className="mt-1">
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
            isBatter
              ? "border border-pencil/40 bg-pencil/15 text-wood-dark"
              : "border border-inkblue/30 bg-inkblue/10 text-inkblue"
          }`}
        >
          {isBatter ? "🏏 BATTING" : "🥎 BOWLING"}
        </span>
      </div>

      {room.status === "SECOND_INNINGS" && room.targetRuns !== null && (
        <div className="mt-4 w-full border-t border-paper-line pt-3 text-sm">
          <div className="flex justify-between px-2 text-chalkboard-dark/60">
            <span>Target:</span>
            <span className="font-bold text-chalkboard-dark">{room.targetRuns}</span>
          </div>
          <div className="mt-1 flex justify-between px-2 text-chalkboard-dark/60">
            <span>Needed:</span>
            <span className="font-bold text-inkblue">
              {Math.max(0, room.targetRuns - batter.score)} runs
            </span>
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-chalkboard-dark/40">{room.moves.length} balls bowled</div>
    </div>
  );
}
