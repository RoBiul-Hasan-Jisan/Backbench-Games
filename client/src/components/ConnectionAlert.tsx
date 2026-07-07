import React, { useEffect, useState } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import type { ConnectionState } from '../hooks/useSocket';
import type { GameRoom } from '../shared';

interface ConnectionAlertProps {
  connectionState: ConnectionState;
  room: GameRoom | null;
  currentPlayerId: string;
  onExit: () => void;
}

export const ConnectionAlert: React.FC<ConnectionAlertProps> = ({
  connectionState,
  room,
  currentPlayerId,
  onExit,
}) => {
  const [localReconnectTimer, setLocalReconnectTimer] = useState<number>(45);
  const [opponentTimeLeft, setOpponentTimeLeft] = useState<number | null>(null);

  // 1. Handle client's own reconnection timer
  useEffect(() => {
    let interval: any;
    if (connectionState === 'reconnecting') {
      setLocalReconnectTimer(45);
      interval = setInterval(() => {
        setLocalReconnectTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [connectionState]);

  // 2. Handle opponent's reconnection timer based on server timestamp
  const opponent = room?.players.find((p) => p.id !== currentPlayerId);
  const isOpponentDisconnected = opponent && !opponent.connected && opponent.disconnectedAt !== null;

  useEffect(() => {
    let interval: any;

    if (isOpponentDisconnected && opponent?.disconnectedAt) {
      const updateTimer = () => {
        const elapsed = Date.now() - opponent.disconnectedAt!;
        const remaining = Math.max(0, Math.round((45000 - elapsed) / 1000));
        setOpponentTimeLeft(remaining);
        if (remaining <= 0) {
          clearInterval(interval);
        }
      };

      updateTimer();
      interval = setInterval(updateTimer, 1000);
    } else {
      setOpponentTimeLeft(null);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpponentDisconnected, opponent?.disconnectedAt]);

  // Render Overlays or small badges based on state

  // State 1: We are reconnecting (blocking overlay)
  if (connectionState === 'reconnecting') {
    return (
      <div className="fixed inset-0 bg-darkBg/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4">
        <div className="glass-panel max-w-md w-full p-8 rounded-3xl text-center space-y-6 border border-yellow-500/20 shadow-[0_0_50px_rgba(234,179,8,0.05)]">
          <div className="relative flex justify-center">
            <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center border border-yellow-500/20">
              <RefreshCw className="w-8 h-8 text-yellow-500 animate-spin" />
            </div>
            <div className="absolute top-0 right-[42%] w-4 h-4 bg-yellow-500 rounded-full border-4 border-darkBg animate-ping"></div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Connection Interrupted</h2>
            <p className="text-slate-400 text-sm">
              We lost connection to the server. Attempting to restore your session...
            </p>
          </div>

          <div className="p-4 bg-yellow-500/5 rounded-xl border border-yellow-500/10">
            <span className="text-xs text-yellow-500 uppercase tracking-widest font-bold">
              Reconnecting in
            </span>
            <div className="text-3xl font-extrabold text-white mt-1 font-mono">
              {localReconnectTimer}s
            </div>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer border border-slate-700/50"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // State 2: Opponent disconnected (non-blocking banner/overlay if playing)
  const isPlaying = room && (room.status === 'FIRST_INNINGS' || room.status === 'SECOND_INNINGS' || room.status === 'CHANGE_INNINGS');
  if (isOpponentDisconnected && isPlaying) {
    return (
      <div className="fixed inset-0 bg-darkBg/80 backdrop-blur-sm z-40 flex items-center justify-center p-4">
        <div className="glass-panel max-w-sm w-full p-6 rounded-2xl text-center space-y-4 border border-red-500/20">
          <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 mx-auto">
            <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Opponent Disconnected</h3>
            <p className="text-slate-400 text-xs mt-1">
              Waiting for <span className="text-white font-semibold">{opponent?.nickname}</span> to rejoin.
            </p>
          </div>

          <div className="py-2.5 bg-red-500/5 rounded-lg border border-red-500/10">
            <div className="text-xs text-red-400 font-bold uppercase tracking-wider">
              Forfeit in
            </div>
            <div className="text-2xl font-black text-white font-mono mt-0.5">
              {opponentTimeLeft !== null ? `${opponentTimeLeft}s` : '--'}
            </div>
          </div>

          <button
            onClick={onExit}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-800"
          >
            Leave Match & Return Home
          </button>
        </div>
      </div>
    );
  }

  // State 3: Normal small connectivity header dot
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/60 rounded-full border border-slate-800 text-xs text-slate-400">
      {connectionState === 'connected' ? (
        <>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-emerald-500">Connected</span>
        </>
      ) : (
        <>
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          <span className="font-semibold text-red-500">Disconnected</span>
        </>
      )}
    </div>
  );
};
