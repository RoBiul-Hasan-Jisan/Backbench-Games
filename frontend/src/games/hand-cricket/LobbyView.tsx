"use client";

import { useState } from "react";
import { Copy, Check, Users, LogOut, Play } from "lucide-react";
import { soundSynthesizer } from "./soundSynthesizer";
import type { GameRoom } from "./types";

export function LobbyView({
  room,
  currentPlayerId,
  onSetReady,
  onStartGame,
  onLeaveRoom,
}: {
  room: GameRoom;
  currentPlayerId: string;
  onSetReady: (ready: boolean) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const host = room.players.find((p) => p.isHost);
  const guest = room.players.find((p) => !p.isHost);
  const me = room.players.find((p) => p.id === currentPlayerId);
  if (!host || !me) return null;

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

  const isStartDisabled = !guest || !guest.connected || !guest.isReady;

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl space-y-8 rounded-2xl border border-paper-line bg-white/70 p-8">
        <div className="space-y-2 border-b border-paper-line pb-6 text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-inkblue/25 bg-inkblue/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-inkblue">
            <Users className="h-3.5 w-3.5" /> Room Lobby
          </div>
          <h2 className="text-2xl font-semibold text-chalkboard-dark">Private Cricket Arena</h2>
          <p className="text-xs text-chalkboard-dark/50">
            Share the code below with your opponent to start the match.
          </p>
        </div>

        <div className="room-nameplate flex flex-col items-center justify-between gap-4 rounded-xl p-5 text-chalk sm:flex-row">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-[10px] font-bold uppercase tracking-widest text-chalk/60">
              Lobby Invite Code
            </span>
            <div className="font-mono text-3xl font-black tracking-widest">{room.code}</div>
          </div>
          <button
            onClick={handleCopyCode}
            className={`flex w-full items-center justify-center gap-2 rounded-lg border px-5 py-3 text-xs font-bold uppercase tracking-wider transition sm:w-auto ${
              copied
                ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                : "border-chalk/30 bg-chalk/10 text-chalk hover:bg-chalk/20"
            }`}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" /> Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" /> Copy Code
              </>
            )}
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-chalkboard-dark/50">
            Players Connected ({room.players.length}/2)
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border border-paper-line bg-paper/70 p-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-pencil" />
                  <span className="font-bold text-chalkboard-dark">{host.nickname}</span>
                </div>
                <span className="block font-mono text-[10px] uppercase tracking-widest text-chalkboard-dark/40">
                  Host • {host.connected ? "Online" : "Offline"}
                </span>
              </div>
              <span className="text-xs font-bold italic text-chalkboard-dark/40">Ready</span>
            </div>

            {guest ? (
              <div className="flex items-center justify-between rounded-lg border border-paper-line bg-paper/70 p-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        guest.connected ? "bg-inkblue" : "animate-pulse bg-redpen"
                      }`}
                    />
                    <span className="font-bold text-chalkboard-dark">{guest.nickname}</span>
                  </div>
                  <span className="block font-mono text-[10px] uppercase tracking-widest text-chalkboard-dark/40">
                    Guest • {guest.connected ? "Online" : "Offline"}
                  </span>
                </div>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-black uppercase tracking-wider ${
                    guest.isReady ? "bg-emerald-500/15 text-emerald-700" : "bg-pencil/15 text-wood-dark"
                  }`}
                >
                  {guest.isReady ? "READY" : "WAITING"}
                </span>
              </div>
            ) : (
              <div className="flex h-[74px] items-center justify-center rounded-lg border border-dashed border-paper-line text-center">
                <span className="animate-pulse text-xs font-bold uppercase tracking-wider text-chalkboard-dark/40">
                  Waiting for opponent...
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-paper-line pt-6 sm:flex-row">
          <button
            onClick={() => {
              soundSynthesizer.playClick();
              onLeaveRoom();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-paper-line px-5 py-3 text-xs font-bold text-chalkboard-dark/60 transition hover:bg-chalkboard-dark/5 sm:w-auto"
          >
            <LogOut className="h-4 w-4" /> Leave Room
          </button>

          {me.isHost ? (
            <button
              onClick={handleStart}
              disabled={isStartDisabled}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-inkblue px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition hover:brightness-110 disabled:opacity-30 sm:w-auto"
            >
              Start Match <Play className="h-4 w-4 fill-current" />
            </button>
          ) : (
            <button
              onClick={toggleReady}
              disabled={!me.connected}
              className={`flex w-full items-center justify-center gap-2 rounded-lg px-8 py-3.5 text-xs font-bold uppercase tracking-wider transition sm:w-auto ${
                me.isReady ? "bg-pencil text-chalkboard-dark" : "bg-emerald-500 text-white"
              }`}
            >
              {me.isReady ? "Cancel Ready" : "I am Ready!"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
