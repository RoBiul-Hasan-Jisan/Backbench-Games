import React, { useState } from 'react';
import { Copy, Check, Users, LogOut, Play } from 'lucide-react';
import type { GameRoom } from '../shared';
import { soundSynthesizer } from '../utils/soundSynthesizer';

interface LobbyViewProps {
  room: GameRoom;
  currentPlayerId: string;
  onSetReady: (ready: boolean) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  room,
  currentPlayerId,
  onSetReady,
  onStartGame,
  onLeaveRoom,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  const host = room.players.find((p) => p.isHost)!;
  const guest = room.players.find((p) => !p.isHost);
  const me = room.players.find((p) => p.id === currentPlayerId)!;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    soundSynthesizer.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleReady = () => {
    soundSynthesizer.playClick();
    onSetReady(!me.isReady);
  };

  const handleStart = () => {
    soundSynthesizer.playClick();
    onStartGame();
  };

  // Start game disabled checks
  const isStartDisabled = !guest || !guest.connected || !guest.isReady;

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-xl glass-panel p-8 rounded-3xl border border-slate-700/20 shadow-glass relative overflow-hidden space-y-8">
        
        {/* Top Header */}
        <div className="text-center space-y-2 border-b border-slate-800 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-neonCyan/10 text-neonCyan border border-neonCyan/20 rounded-full text-xs font-bold uppercase tracking-widest mb-2">
            <Users className="w-3.5 h-3.5" /> Room Lobby
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-wide">
            Private Cricket Arena
          </h2>
          <p className="text-slate-500 text-xs">
            Share the code below with your opponent to initiate the match.
          </p>
        </div>

        {/* Room Code Card */}
        <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Lobby Invite Code
            </span>
            <div className="text-3xl font-black text-white font-mono tracking-widest">
              {room.code}
            </div>
          </div>
          <button
            onClick={handleCopyCode}
            className={`w-full sm:w-auto px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all border ${
              copied
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-750'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" /> ✓ Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copy Code
              </>
            )}
          </button>
        </div>

        {/* Connected Players list */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Players Connected ({room.players.length}/2)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Host Card */}
            <div className="glass-panel p-5 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-neonCyan"></span>
                  <span className="font-bold text-slate-200">{host.nickname}</span>
                </div>
                <span className="text-3xs text-slate-500 uppercase tracking-widest font-mono block">
                  Host • {host.connected ? 'Online' : 'Offline'}
                </span>
              </div>
              <span className="text-xs font-bold text-slate-500 italic">
                Ready
              </span>
            </div>

            {/* Guest Card */}
            {guest ? (
              <div className="glass-panel p-5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${guest.connected ? 'bg-neonPink' : 'bg-red-500 animate-pulse'}`}></span>
                    <span className="font-bold text-slate-200">{guest.nickname}</span>
                  </div>
                  <span className="text-3xs text-slate-500 uppercase tracking-widest font-mono block">
                    Guest • {guest.connected ? 'Online' : 'Offline'}
                  </span>
                </div>
                <span
                  className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                    guest.isReady
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-amber-500/10 text-amber-500'
                  }`}
                >
                  {guest.isReady ? 'READY' : 'WAITING'}
                </span>
              </div>
            ) : (
              <div className="glass-panel p-5 rounded-xl border border-dashed border-slate-800 flex items-center justify-center text-center h-[74px]">
                <span className="text-xs text-slate-600 font-bold uppercase tracking-wider animate-pulse">
                  Waiting for opponent...
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Lobby Actions */}
        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <button
            onClick={() => {
              soundSynthesizer.playClick();
              onLeaveRoom();
            }}
            className="w-full sm:w-auto py-3 px-5 bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Leave Room
          </button>

          {me.isHost ? (
            <button
              onClick={handleStart}
              disabled={isStartDisabled}
              className="w-full sm:w-auto py-3.5 px-8 bg-gradient-to-r from-neonCyan to-neonBlue text-slate-950 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(0,240,255,0.15)] flex items-center justify-center gap-2 cursor-pointer"
            >
              Start Match <Play className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              onClick={toggleReady}
              disabled={!me.connected}
              className={`w-full sm:w-auto py-3.5 px-8 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                me.isReady
                  ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                  : 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
              }`}
            >
              {me.isReady ? 'Cancel Ready' : 'I am Ready!'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
