import React from 'react';
import type { GameRoom } from '../shared';

interface MatchTimelineProps {
  room: GameRoom;
  currentPlayerId: string;
}

export const MatchTimeline: React.FC<MatchTimelineProps> = ({ room, currentPlayerId }) => {
  const moves = [...room.moves].reverse(); // Show newest turns first

  if (moves.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-6 text-center text-slate-500 text-sm">
        No deliveries bowled yet. Play starts when both pick a number!
      </div>
    );
  }

  const getPlayerName = (id: string) => {
    const player = room.players.find((p) => p.id === id);
    return player ? player.nickname : 'Player';
  };

  return (
    <div className="w-full glass-panel rounded-2xl p-5 shadow-glass flex flex-col h-full max-h-[300px]">
      <h3 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider border-b border-slate-800 pb-2">
        Match Timeline
      </h3>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {moves.map((move) => {
          const isBatterMe = move.batterId === currentPlayerId;
          const batterName = isBatterMe ? 'You' : getPlayerName(move.batterId);
          const bowlerName = isBatterMe ? getPlayerName(room.players.find((p) => p.id !== currentPlayerId)!.id) : 'You';

          return (
            <div
              key={move.turnNumber}
              className={`flex items-center justify-between p-3 rounded-xl text-sm border ${
                move.isOut
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : 'bg-slate-800/30 border-slate-800/40 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-slate-500 bg-slate-900/60 px-1.5 py-0.5 rounded">
                  B{move.turnNumber}
                </span>
                <div>
                  <span className="font-semibold text-slate-200">{batterName}</span> batted,{' '}
                  <span className="font-semibold text-slate-200">{bowlerName}</span> bowled
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex gap-1.5 font-mono text-xs bg-slate-900/40 px-2 py-1 rounded">
                  <span className={isBatterMe ? 'text-neonCyan' : 'text-slate-400'}>
                    {move.batterChoice}
                  </span>
                  <span className="text-slate-600">v</span>
                  <span className={!isBatterMe ? 'text-neonPink' : 'text-slate-400'}>
                    {move.bowlerChoice}
                  </span>
                </div>

                <div
                  className={`font-bold px-2 py-0.5 rounded text-xs min-w-[50px] text-center ${
                    move.isOut
                      ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse'
                      : 'bg-emerald-500/10 text-emerald-400'
                  }`}
                >
                  {move.isOut ? 'OUT' : `+${move.runsAdded}`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
