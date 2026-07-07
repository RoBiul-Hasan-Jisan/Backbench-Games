import React from 'react';
import type { GameRoom } from '../shared';

interface ScoreboardProps {
  room: GameRoom;
  currentPlayerId: string;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({ room, currentPlayerId }) => {
  const isBatter = room.batterId === currentPlayerId;
  const batter = room.players.find((p) => p.id === room.batterId)!;

  // Determine current innings
  const inningsText = room.status === 'FIRST_INNINGS' ? '1st Innings' : '2nd Innings';

  return (
    <div className="w-full glass-panel rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-glass relative overflow-hidden">
      {/* Small Glowing top header line */}
      <div className={`absolute top-0 left-0 w-full h-[3px] ${isBatter ? 'bg-neonCyan shadow-[0_3px_10px_rgba(0,240,255,0.5)]' : 'bg-neonPink shadow-[0_3px_10px_rgba(255,0,127,0.5)]'}`}></div>

      <div className="text-xs uppercase tracking-widest text-slate-400 mt-3 mb-1 font-semibold">
        {inningsText}
      </div>

      <div className="flex items-baseline justify-center gap-1 my-2">
        {/* Animated Score */}
        <span className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
          {batter.score}
        </span>
        <span className="text-2xl font-bold text-slate-500">/</span>
        <span className="text-xl font-semibold text-slate-400">
          {batter.wickets === 1 ? '1' : '0'}
        </span>
      </div>

      {/* Role Indicator Badge */}
      <div className="mt-1">
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            isBatter
              ? 'bg-neonCyan/10 text-neonCyan border border-neonCyan/30 shadow-neonCyan/10'
              : 'bg-neonPink/10 text-neonPink border border-neonPink/30 shadow-neonPink/10'
          }`}
        >
          {isBatter ? '🏏 BATTING' : '🥎 BOWLING'}
        </span>
      </div>

      {/* Target details for 2nd Innings */}
      {room.status === 'SECOND_INNINGS' && room.targetRuns !== null && (
        <div className="mt-4 pt-3 border-t border-slate-800 w-full text-sm">
          <div className="text-slate-400 flex justify-between px-2">
            <span>Target:</span>
            <span className="font-bold text-white">{room.targetRuns}</span>
          </div>
          <div className="text-slate-400 flex justify-between px-2 mt-1">
            <span>Needed:</span>
            <span className="font-bold text-neonCyan">
              {Math.max(0, room.targetRuns - batter.score)} runs
            </span>
          </div>
        </div>
      )}

      {/* Small status line */}
      <div className="text-xs text-slate-500 mt-4">
        {room.moves.length} balls bowled
      </div>
    </div>
  );
};
