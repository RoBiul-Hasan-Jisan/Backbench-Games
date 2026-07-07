"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import type { RoomView } from "@/lib/socket";

export default function WaitingRoom({
  room,
  isReady,
  onReady,
}: {
  room: RoomView;
  isReady: boolean;
  onReady: () => void;
}) {
  const [copied, setCopied] = useState<"link" | "code" | null>(null);
  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/play/${room.gameType}/${room.code}` : "";

  function copy(value: string, kind: "link" | "code") {
    navigator.clipboard?.writeText(value);
    setCopied(kind);
    setTimeout(() => setCopied(null), 1500);
  }

  const waitingForOpponent = room.players.length < 2;

  return (
    <div className="mx-auto max-w-lg">
      <div className="room-nameplate mx-auto mb-8 w-fit rounded-md px-8 py-4 text-center">
        <p className="mb-1 text-xs uppercase tracking-widest text-chalk/60">Room code</p>
        <p className="chalk-text text-4xl tracking-[0.2em] text-chalk">{room.code}</p>
      </div>

      <div className="mb-6 flex justify-center gap-3">
        <button
          onClick={() => copy(shareUrl, "link")}
          className="flex items-center gap-2 rounded-md border border-paper-line bg-white/70 px-4 py-2 text-sm font-medium text-chalkboard-dark"
        >
          {copied === "link" ? <Check size={16} /> : <Copy size={16} />}
          Copy Link
        </button>
        <button
          onClick={() => copy(room.code, "code")}
          className="flex items-center gap-2 rounded-md border border-paper-line bg-white/70 px-4 py-2 text-sm font-medium text-chalkboard-dark"
        >
          {copied === "code" ? <Check size={16} /> : <Copy size={16} />}
          Copy Code
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`Join my Backbench Games match: ${shareUrl}`)}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-md border border-paper-line bg-white/70 px-4 py-2 text-sm font-medium text-chalkboard-dark"
        >
          <MessageCircle size={16} /> WhatsApp
        </a>
      </div>

      <div className="mb-6 space-y-2">
        {[0, 1].map((slot) => {
          const player = room.players[slot];
          return (
            <div
              key={slot}
              className="flex items-center justify-between rounded-lg border border-paper-line bg-white/70 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-inkblue/10 font-semibold text-inkblue">
                  {player ? player.name.charAt(0).toUpperCase() : "?"}
                </div>
                <div>
                  <p className="text-sm font-medium text-chalkboard-dark">
                    {player ? player.name : "Waiting for player..."}
                  </p>
                  {player && (
                    <p className="text-xs text-chalkboard-dark/50">
                      {player.connected ? "Connected" : "Reconnecting..."}
                    </p>
                  )}
                </div>
              </div>
              {player?.ready && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  Ready
                </span>
              )}
            </div>
          );
        })}
      </div>

      <button
        disabled={waitingForOpponent || isReady}
        onClick={onReady}
        className="w-full rounded-md bg-pencil px-4 py-3 font-semibold text-chalkboard-dark transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {waitingForOpponent ? "Waiting for opponent..." : isReady ? "Waiting on opponent to ready up" : "I'm Ready"}
      </button>
    </div>
  );
}
