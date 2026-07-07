import React, { useEffect, useState } from 'react';
import { HelpCircle } from 'lucide-react';
import type { GameRoom } from '../shared';
import { soundSynthesizer } from '../utils/soundSynthesizer';

interface TossProps {
  room: GameRoom;
  currentPlayerId: string;
  onSubmitTossGuess: (prediction: 'heads' | 'tails') => void;
  onSubmitTossDecision: (choice: 'bat' | 'bowl') => void;
}

export const Toss: React.FC<TossProps> = ({
  room,
  currentPlayerId,
  onSubmitTossGuess,
  onSubmitTossDecision,
}) => {
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [showOutcome, setShowOutcome] = useState<boolean>(false);

  const me = room.players.find((p) => p.id === currentPlayerId)!;
  const guest = room.players.find((p) => !p.isHost)!;
  const isGuest = me.id === guest.id;

  const isDeciderMe = room.tossWinnerId === currentPlayerId;
  const tossWinner = room.players.find((p) => p.id === room.tossWinnerId);

  // Play coin flip trigger
  useEffect(() => {
    if (room.coinFlipResult && !showOutcome && !isFlipping) {
      // Trigger animation
      setIsFlipping(true);
      soundSynthesizer.init();
      soundSynthesizer.playToss();
      
      const timer = setTimeout(() => {
        setIsFlipping(false);
        setShowOutcome(true);
        soundSynthesizer.playTossLand();
      }, 1500); // Animation duration

      return () => clearTimeout(timer);
    }
  }, [room.coinFlipResult]);

  const handleGuess = (prediction: 'heads' | 'tails') => {
    soundSynthesizer.playClick();
    onSubmitTossGuess(prediction);
  };

  const handleDecision = (decision: 'bat' | 'bowl') => {
    soundSynthesizer.playClick();
    onSubmitTossDecision(decision);
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-lg glass-panel p-8 rounded-3xl border border-slate-700/20 shadow-glass space-y-8 text-center relative overflow-hidden">
        
        {/* Glowing background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-neonCyan/5 rounded-full blur-3xl"></div>

        {/* Phase 1: Waiting for Guess (Guest must choose, Host waits) */}
        {room.status === 'TOSS' && !room.coinFlipResult && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-300 uppercase tracking-wider">
              The Coin Toss
            </h2>
            
            {isGuest ? (
              <div className="space-y-6">
                <p className="text-slate-400 text-sm">
                  As the visiting guest, make your prediction:
                </p>
                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                  <button
                    onClick={() => handleGuess('heads')}
                    className="py-4 bg-gradient-to-r from-neonCyan/10 to-neonBlue/10 hover:from-neonCyan/25 hover:to-neonBlue/25 text-neonCyan font-black rounded-2xl border border-neonCyan/30 hover:border-neonCyan/60 transition-all text-sm uppercase tracking-widest cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.05)]"
                  >
                    Heads
                  </button>
                  <button
                    onClick={() => handleGuess('tails')}
                    className="py-4 bg-gradient-to-r from-neonPink/10 to-neonPurple/10 hover:from-neonPink/25 hover:to-neonPurple/25 text-neonPink font-black rounded-2xl border border-neonPink/30 hover:border-neonPink/60 transition-all text-sm uppercase tracking-widest cursor-pointer shadow-[0_0_15px_rgba(255,0,127,0.05)]"
                  >
                    Tails
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-6 space-y-4">
                <HelpCircle className="w-12 h-12 text-slate-600 animate-pulse mx-auto" />
                <p className="text-slate-500 text-sm italic">
                  Waiting for opponent ({guest.nickname}) to predict Heads or Tails...
                </p>
              </div>
            )}
          </div>
        )}

        {/* Phase 2: Flipping Coin / Revealing outcome */}
        {room.coinFlipResult && (isFlipping || !showOutcome) && (
          <div className="space-y-6 py-6">
            <h2 className="text-xl font-bold text-slate-300 uppercase tracking-wider animate-pulse">
              Flipping Coin...
            </h2>
            <div className="flex justify-center my-8">
              {/* Spinning 3D CSS Coin */}
              <div className="w-24 h-24 rounded-full border-4 border-slate-700 bg-slate-900 flex items-center justify-center font-black text-lg text-slate-400 select-none animate-coin-flip shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                🪙
              </div>
            </div>
          </div>
        )}

        {/* Phase 3: Display results & Toss Decision (Winner chooses, Loser waits) */}
        {room.coinFlipResult && showOutcome && room.status === 'BAT_OR_BOWL' && (
          <div className="space-y-8">
            <div className="space-y-2">
              <span className="text-3xs text-slate-500 uppercase tracking-widest font-mono">
                Toss Result
              </span>
              <h2 className="text-3xl font-black text-white tracking-wide">
                Coin showed <span className="uppercase text-neonCyan">{room.coinFlipResult}</span>!
              </h2>
            </div>

            {/* Toss winner declaration */}
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl max-w-sm mx-auto">
              <p className="text-sm text-slate-300">
                🎉 <span className="font-bold text-white">{tossWinner?.nickname}</span> won the Toss!
              </p>
            </div>

            {/* Selection actions */}
            {isDeciderMe ? (
              <div className="space-y-6">
                <p className="text-sm text-slate-400">
                  Congratulations! Choose your role for the 1st Innings:
                </p>
                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                  <button
                    onClick={() => handleDecision('bat')}
                    className="py-4 bg-gradient-to-r from-neonCyan to-neonBlue text-slate-950 font-black rounded-2xl transition-all text-xs uppercase tracking-widest cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.25)] flex items-center justify-center gap-1.5"
                  >
                    🏏 Bat
                  </button>
                  <button
                    onClick={() => handleDecision('bowl')}
                    className="py-4 bg-gradient-to-r from-neonPink to-neonPurple text-white font-black rounded-2xl transition-all text-xs uppercase tracking-widest cursor-pointer shadow-[0_0_15px_rgba(255,0,127,0.25)] flex items-center justify-center gap-1.5"
                  >
                    🥎 Bowl
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-4 space-y-3">
                <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-neonCyan animate-spin mx-auto"></div>
                <p className="text-slate-500 text-xs italic">
                  Waiting for {tossWinner?.nickname} to decide whether to Bat or Bowl...
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
