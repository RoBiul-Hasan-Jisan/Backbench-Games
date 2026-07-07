"use client";

import { useEffect, useState } from "react";
import { HelpCircle } from "lucide-react";
import { soundSynthesizer } from "./soundSynthesizer";
import type { GameRoom } from "./types";

export function Toss({
  room,
  currentPlayerId,
  onSubmitTossGuess,
  onSubmitTossDecision,
}: {
  room: GameRoom;
  currentPlayerId: string;
  onSubmitTossGuess: (prediction: "heads" | "tails") => void;
  onSubmitTossDecision: (choice: "bat" | "bowl") => void;
}) {
  const [isFlipping, setIsFlipping] = useState(false);
  const [showOutcome, setShowOutcome] = useState(false);

  const me = room.players.find((p) => p.id === currentPlayerId);
  const guest = room.players.find((p) => !p.isHost);
  if (!me || !guest) return null;
  const isGuest = me.id === guest.id;

  const isDeciderMe = room.tossWinnerId === currentPlayerId;
  const tossWinner = room.players.find((p) => p.id === room.tossWinnerId);

  useEffect(() => {
    if (room.coinFlipResult && !showOutcome && !isFlipping) {
      setIsFlipping(true);
      soundSynthesizer.init();
      soundSynthesizer.playToss();

      const timer = setTimeout(() => {
        setIsFlipping(false);
        setShowOutcome(true);
        soundSynthesizer.playTossLand();
      }, 1500);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.coinFlipResult]);

  const handleGuess = (prediction: "heads" | "tails") => {
    soundSynthesizer.playClick();
    onSubmitTossGuess(prediction);
  };

  const handleDecision = (decision: "bat" | "bowl") => {
    soundSynthesizer.playClick();
    onSubmitTossDecision(decision);
  };

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg space-y-8 rounded-2xl border border-paper-line bg-white/70 p-8 text-center">
        {room.status === "TOSS" && !room.coinFlipResult && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold uppercase tracking-wider text-chalkboard-dark/70">
              The Coin Toss
            </h2>

            {isGuest ? (
              <div className="space-y-6">
                <p className="text-sm text-chalkboard-dark/60">
                  As the visiting guest, make your prediction:
                </p>
                <div className="mx-auto grid max-w-sm grid-cols-2 gap-4">
                  <button
                    onClick={() => handleGuess("heads")}
                    className="rounded-xl border border-inkblue/30 bg-inkblue/10 py-4 text-sm font-black uppercase tracking-widest text-inkblue transition hover:bg-inkblue/20"
                  >
                    Heads
                  </button>
                  <button
                    onClick={() => handleGuess("tails")}
                    className="rounded-xl border border-redpen/30 bg-redpen/10 py-4 text-sm font-black uppercase tracking-widest text-redpen transition hover:bg-redpen/20"
                  >
                    Tails
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-6">
                <HelpCircle className="mx-auto h-12 w-12 animate-pulse text-chalkboard-dark/30" />
                <p className="text-sm italic text-chalkboard-dark/50">
                  Waiting for opponent ({guest.nickname}) to predict Heads or Tails...
                </p>
              </div>
            )}
          </div>
        )}

        {room.coinFlipResult && (isFlipping || !showOutcome) && (
          <div className="space-y-6 py-6">
            <h2 className="animate-pulse text-xl font-bold uppercase tracking-wider text-chalkboard-dark/70">
              Flipping Coin...
            </h2>
            <div className="my-8 flex justify-center">
              <div className="animate-coin-flip flex h-24 w-24 select-none items-center justify-center rounded-full border-4 border-wood bg-paper text-lg font-black text-chalkboard-dark">
                🪙
              </div>
            </div>
          </div>
        )}

        {room.coinFlipResult && showOutcome && room.status === "BAT_OR_BOWL" && (
          <div className="space-y-8">
            <div className="space-y-2">
              <span className="font-mono text-[11px] uppercase tracking-widest text-chalkboard-dark/40">
                Toss Result
              </span>
              <h2 className="text-3xl font-black tracking-wide text-chalkboard-dark">
                Coin showed <span className="uppercase text-inkblue">{room.coinFlipResult}</span>!
              </h2>
            </div>

            <div className="mx-auto max-w-sm rounded-xl border border-paper-line bg-paper/70 p-4">
              <p className="text-sm text-chalkboard-dark/70">
                🎉 <span className="font-bold text-chalkboard-dark">{tossWinner?.nickname}</span> won
                the Toss!
              </p>
            </div>

            {isDeciderMe ? (
              <div className="space-y-6">
                <p className="text-sm text-chalkboard-dark/60">
                  Congratulations! Choose your role for the 1st Innings:
                </p>
                <div className="mx-auto grid max-w-sm grid-cols-2 gap-4">
                  <button
                    onClick={() => handleDecision("bat")}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-inkblue py-4 text-xs font-black uppercase tracking-widest text-white transition hover:brightness-110"
                  >
                    🏏 Bat
                  </button>
                  <button
                    onClick={() => handleDecision("bowl")}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-wood py-4 text-xs font-black uppercase tracking-widest text-white transition hover:brightness-110"
                  >
                    🥎 Bowl
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 py-4">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-paper-line border-t-inkblue" />
                <p className="text-xs italic text-chalkboard-dark/50">
                  Waiting for {tossWinner?.nickname} to decide whether to Bat or Bowl...
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
