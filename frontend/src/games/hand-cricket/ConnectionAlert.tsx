"use client";

import { useEffect, useState } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";
import type { ConnectionState, GameRoom } from "./types";

export function ConnectionAlert({
  connectionState,
  room,
  currentPlayerId,
  onExit,
}: {
  connectionState: ConnectionState;
  room: GameRoom | null;
  currentPlayerId: string;
  onExit: () => void;
}) {
  const [localReconnectTimer, setLocalReconnectTimer] = useState<number>(45);
  const [opponentTimeLeft, setOpponentTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    let interval: any;
    if (connectionState === "reconnecting") {
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

  const opponent = room?.players.find((p) => p.id !== currentPlayerId);
  const isOpponentDisconnected = !!(opponent && !opponent.connected && opponent.disconnectedAt !== null);

  useEffect(() => {
    let interval: any;

    if (isOpponentDisconnected && opponent?.disconnectedAt) {
      const updateTimer = () => {
        const elapsed = Date.now() - opponent.disconnectedAt!;
        const remaining = Math.max(0, Math.round((45000 - elapsed) / 1000));
        setOpponentTimeLeft(remaining);
        if (remaining <= 0) clearInterval(interval);
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

  if (connectionState === "reconnecting") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-chalkboard-dark/95 p-4 backdrop-blur-md">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-pencil/20 bg-chalkboard p-8 text-center text-chalk">
          <div className="relative flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-pencil/30 bg-pencil/10">
              <RefreshCw className="h-8 w-8 animate-spin text-pencil" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">Connection Interrupted</h2>
            <p className="text-sm text-chalk/60">
              We lost connection to the server. Attempting to restore your session...
            </p>
          </div>
          <div className="rounded-xl border border-pencil/10 bg-pencil/5 p-4">
            <span className="text-xs font-bold uppercase tracking-widest text-pencil">
              Reconnecting in
            </span>
            <div className="mt-1 font-mono text-3xl font-extrabold">{localReconnectTimer}s</div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full rounded-xl border border-chalk/20 bg-chalk/10 px-4 py-3 text-sm font-semibold transition hover:bg-chalk/20"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  const isPlaying =
    room &&
    (room.status === "FIRST_INNINGS" || room.status === "SECOND_INNINGS" || room.status === "CHANGE_INNINGS");
  if (isOpponentDisconnected && isPlaying) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-chalkboard-dark/80 p-4 backdrop-blur-sm">
        <div className="w-full max-w-sm space-y-4 rounded-2xl border border-redpen/25 bg-chalkboard p-6 text-center text-chalk">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-redpen/30 bg-redpen/10">
            <AlertTriangle className="h-6 w-6 animate-pulse text-redpen" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Opponent Disconnected</h3>
            <p className="mt-1 text-xs text-chalk/60">
              Waiting for <span className="font-semibold text-chalk">{opponent?.nickname}</span> to rejoin.
            </p>
          </div>
          <div className="rounded-lg border border-redpen/15 bg-redpen/5 py-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-redpen">Forfeit in</div>
            <div className="mt-0.5 font-mono text-2xl font-black">
              {opponentTimeLeft !== null ? `${opponentTimeLeft}s` : "--"}
            </div>
          </div>
          <button
            onClick={onExit}
            className="w-full rounded-xl border border-chalk/15 bg-chalk/5 px-4 py-2.5 text-xs font-bold transition hover:bg-chalk/10"
          >
            Leave Match &amp; Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 rounded-full border border-paper-line bg-white/60 px-2.5 py-1 text-xs">
      {connectionState === "connected" ? (
        <>
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="font-semibold text-emerald-600">Connected</span>
        </>
      ) : (
        <>
          <span className="h-2 w-2 rounded-full bg-redpen" />
          <span className="font-semibold text-redpen">Disconnected</span>
        </>
      )}
    </div>
  );
}
