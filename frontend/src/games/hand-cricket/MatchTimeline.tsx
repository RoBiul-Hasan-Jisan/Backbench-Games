"use client";

import type { GameRoom } from "./types";

export function MatchTimeline({ room, currentPlayerId }: { room: GameRoom; currentPlayerId: string }) {
  const moves = [...room.moves].reverse();

  if (moves.length === 0) {
    return (
      <div className="rounded-xl border border-paper-line bg-white/70 p-6 text-center text-sm text-chalkboard-dark/50">
        No deliveries bowled yet. Play starts when both pick a number!
      </div>
    );
  }

  const getPlayerName = (id: string) => room.players.find((p) => p.id === id)?.nickname ?? "Player";

  return (
    <div className="flex h-full max-h-[300px] w-full flex-col rounded-xl border border-paper-line bg-white/70 p-5">
      <h3 className="mb-3 border-b border-paper-line pb-2 text-sm font-bold uppercase tracking-wider text-chalkboard-dark/60">
        Match Timeline
      </h3>
      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {moves.map((move) => {
          const isBatterMe = move.batterId === currentPlayerId;
          const batterName = isBatterMe ? "You" : getPlayerName(move.batterId);
          const otherId = room.players.find((p) => p.id !== currentPlayerId)?.id;
          const bowlerName = isBatterMe ? getPlayerName(otherId ?? "") : "You";

          return (
            <div
              key={move.turnNumber}
              className={`flex items-center justify-between rounded-lg border p-3 text-sm ${
                move.isOut
                  ? "border-redpen/30 bg-redpen/10 text-redpen"
                  : "border-paper-line bg-paper/60 text-chalkboard-dark/80"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="rounded bg-chalkboard-dark/5 px-1.5 py-0.5 font-mono text-xs text-chalkboard-dark/40">
                  B{move.turnNumber}
                </span>
                <div>
                  <span className="font-semibold text-chalkboard-dark">{batterName}</span> batted,{" "}
                  <span className="font-semibold text-chalkboard-dark">{bowlerName}</span> bowled
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex gap-1.5 rounded bg-chalkboard-dark/5 px-2 py-1 font-mono text-xs">
                  <span className={isBatterMe ? "text-inkblue" : "text-chalkboard-dark/50"}>
                    {move.batterChoice}
                  </span>
                  <span className="text-chalkboard-dark/30">v</span>
                  <span className={!isBatterMe ? "text-redpen" : "text-chalkboard-dark/50"}>
                    {move.bowlerChoice}
                  </span>
                </div>

                <div
                  className={`min-w-[50px] rounded px-2 py-0.5 text-center text-xs font-bold ${
                    move.isOut
                      ? "bg-redpen text-white"
                      : "bg-pencil/15 text-wood-dark"
                  }`}
                >
                  {move.isOut ? "OUT" : `+${move.runsAdded}`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
