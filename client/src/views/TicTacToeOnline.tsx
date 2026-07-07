import React, { useEffect, useState } from 'react';
import { Copy, Check, RotateCcw, Users, X, Grid3x3, RefreshCw } from 'lucide-react';
import { useTttSocket } from '../hooks/useTttSocket';
import { soundSynthesizer } from '../utils/soundSynthesizer';

interface TicTacToeOnlineProps {
  nickname: string;
  playerId: string;
  initialAction: 'create' | 'join';
  onExit: () => void;
}

const SIZE_OPTIONS: Array<3 | 5 | 8> = [3, 5, 8];

export const TicTacToeOnline: React.FC<TicTacToeOnlineProps> = ({ nickname, playerId, initialAction, onExit }) => {
  const { isConnected, connectionState, room, error, createRoom, joinRoom, startGame, makeMove, rematch, leaveRoom, resetRoomState } =
    useTttSocket();

  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [chosenSize, setChosenSize] = useState<3 | 5 | 8>(3);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (initialAction === 'create' && isConnected && !room) {
      createRoom(playerId, nickname).catch(() => {});
    }
  }, [initialAction, isConnected]);

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    soundSynthesizer.playClick();
    try {
      await joinRoom(code, playerId, nickname);
    } catch {
      // error surfaced via hook's `error` state
    }
  };

  const handleCopy = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleStart = async () => {
    if (!room) return;
    setBusy(true);
    try {
      await startGame(room.code, playerId, chosenSize);
    } finally {
      setBusy(false);
    }
  };

  const handleCellClick = async (i: number) => {
    if (!room || room.status !== 'PLAYING' || busy) return;
    if (room.board[i] !== null) return;
    if (room.turnPlayerId !== playerId) return;
    soundSynthesizer.playClick();
    setBusy(true);
    try {
      await makeMove(room.code, playerId, i);
    } finally {
      setBusy(false);
    }
  };

  const handleRematch = async () => {
    if (!room) return;
    soundSynthesizer.playClick();
    await rematch(room.code, playerId);
  };

  const handleExit = async () => {
    if (room) {
      await leaveRoom(room.code, playerId).catch(() => {});
    }
    resetRoomState();
    onExit();
  };

  const me = room?.players.find((p) => p.id === playerId);
  const opponent = room?.players.find((p) => p.id !== playerId);
  const isHost = me?.isHost ?? false;

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 p-4 select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-300">
          <Grid3x3 className="w-5 h-5 text-neonCyan" />
          <span className="font-bold uppercase tracking-widest text-xs">Tic Tac Toe • Online</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/60 rounded-full border border-slate-800 text-xs text-slate-400">
            {connectionState === 'connected' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-semibold text-emerald-500">Connected</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3 h-3 animate-spin text-yellow-500" />
                <span className="font-semibold text-yellow-500">Connecting...</span>
              </>
            )}
          </div>
          <button onClick={handleExit} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">{error}</div>
      )}

      {/* Join code entry, only relevant when we don't have a room yet and asked to join */}
      {!room && initialAction === 'join' && (
        <div className="glass-panel p-8 rounded-3xl border border-slate-700/20 text-center space-y-6">
          <h2 className="text-lg font-bold text-white">Enter Room Code</h2>
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
            placeholder="ABC123"
            className="w-full max-w-xs mx-auto bg-slate-900/60 border border-slate-800 focus:border-neonCyan rounded-xl px-4 py-3.5 text-white text-center tracking-[0.3em] font-mono text-lg outline-none"
          />
          <button
            onClick={handleJoin}
            disabled={!isConnected || joinCode.trim().length < 4}
            className="w-full max-w-xs mx-auto py-3 px-4 bg-gradient-to-r from-neonCyan to-neonBlue text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed block"
          >
            Join
          </button>
        </div>
      )}

      {!room && initialAction === 'create' && (
        <div className="glass-panel p-8 rounded-3xl border border-slate-700/20 text-center space-y-4">
          <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-neonCyan animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Creating your room...</p>
        </div>
      )}

      {/* Lobby: waiting for opponent / host picks board size */}
      {room && (room.status === 'WAITING' || room.status === 'LOBBY') && (
        <div className="glass-panel p-8 rounded-3xl border border-slate-700/20 text-center space-y-6">
          <div className="space-y-2">
            <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">Room Code</div>
            <div className="flex items-center justify-center gap-3">
              <div className="text-4xl font-black tracking-[0.3em] text-neonCyan font-mono">{room.code}</div>
              <button onClick={handleCopy} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer">
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-slate-500 text-xs">Share this code so a friend can join.</p>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-slate-300">
            <Users className="w-4 h-4" />
            {room.players.length < 2 ? 'Waiting for opponent to join...' : `${opponent?.nickname} has joined!`}
          </div>

          {room.players.length === 2 && isHost && (
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Choose Board Size</h3>
              <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
                {SIZE_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setChosenSize(s)}
                    className={`p-3 rounded-xl border font-bold cursor-pointer ${
                      chosenSize === s ? 'bg-neonCyan/10 border-neonCyan/50 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {s}×{s}
                  </button>
                ))}
              </div>
              <button
                onClick={handleStart}
                disabled={busy}
                className="w-full max-w-sm mx-auto py-3 px-4 bg-gradient-to-r from-neonCyan to-neonBlue text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer block disabled:opacity-50"
              >
                Start Match
              </button>
            </div>
          )}
          {room.players.length === 2 && !isHost && (
            <p className="text-slate-500 text-xs">Waiting for the host to start the match...</p>
          )}
        </div>
      )}

      {/* Active game */}
      {room && (room.status === 'PLAYING' || room.status === 'RESULT') && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center glass-panel p-4 rounded-2xl border border-slate-800/80 text-xs">
            <div className="flex items-center gap-2">
              <span className={`font-bold ${me?.mark === 'X' ? 'text-neonCyan' : 'text-neonPink'}`}>
                {nickname} ({me?.mark})
              </span>
              <span className="text-slate-500">vs</span>
              <span className={`font-bold ${opponent?.mark === 'X' ? 'text-neonCyan' : 'text-neonPink'}`}>
                {opponent?.nickname ?? 'Opponent'} ({opponent?.mark})
              </span>
            </div>
            <div className="text-slate-400 uppercase tracking-wider font-bold">
              {room.boardSize} in a row &bull; {room.boardSize}×{room.boardSize}
            </div>
          </div>

          <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-slate-700/20 flex flex-col items-center gap-4">
            {room.status === 'PLAYING' && (
              <div className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                {room.turnPlayerId === playerId ? 'Your turn' : `Waiting for ${opponent?.nickname}...`}
              </div>
            )}
            {room.status === 'RESULT' && (
              <div className={`text-lg font-black uppercase tracking-wider ${
                room.draw ? 'text-slate-400' : room.winnerId === playerId ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {room.draw ? "It's a Draw!" : room.winnerId === playerId ? 'You Win! 🎉' : `${opponent?.nickname} Wins`}
              </div>
            )}

            <div
              className="grid gap-1.5 sm:gap-2 w-full max-w-md mx-auto"
              style={{ gridTemplateColumns: `repeat(${room.boardSize}, minmax(0, 1fr))` }}
            >
              {room.board.map((cell, i) => {
                const isWinning = room.winLine?.includes(i);
                return (
                  <button
                    key={i}
                    onClick={() => handleCellClick(i)}
                    disabled={cell !== null || room.status !== 'PLAYING' || room.turnPlayerId !== playerId}
                    className={`aspect-square rounded-lg sm:rounded-xl border flex items-center justify-center font-black transition-all cursor-pointer ${
                      room.boardSize === 8 ? 'text-sm sm:text-lg' : room.boardSize === 5 ? 'text-lg sm:text-2xl' : 'text-2xl sm:text-4xl'
                    } ${
                      isWinning ? 'bg-emerald-500/20 border-emerald-500/60' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    } ${cell === 'X' ? 'text-neonCyan' : cell === 'O' ? 'text-neonPink' : 'text-transparent'} disabled:cursor-not-allowed`}
                  >
                    {cell || '·'}
                  </button>
                );
              })}
            </div>
          </div>

          {room.status === 'RESULT' && (
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleRematch}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-neonCyan to-neonBlue text-slate-950 font-bold text-xs uppercase cursor-pointer flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Rematch
              </button>
              <button onClick={handleExit} className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase cursor-pointer">
                Back to Menu
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
