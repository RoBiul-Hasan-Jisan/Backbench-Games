import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { soundSynthesizer } from '../utils/soundSynthesizer';

interface LandingProps {
  onSetupComplete: (nickname: string, playerId: string) => void;
}

export const Landing: React.FC<LandingProps> = ({ onSetupComplete }) => {
  const [nickname, setNickname] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nickname.trim();

    if (!trimmed) {
      setError('Nickname cannot be empty!');
      return;
    }

    if (trimmed.length > 15) {
      setError('Nickname must be 15 characters or less.');
      return;
    }

    // Initialize/resume Web Audio context on user action
    soundSynthesizer.init();
    soundSynthesizer.playClick();

    // Generate random UUID
    const playerId = window.crypto.randomUUID();

    // Save to LocalStorage
    localStorage.setItem('hc_nickname', trimmed);
    localStorage.setItem('hc_player_id', playerId);

    onSetupComplete(trimmed, playerId);
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4">
      {/* Game Title Logo block */}
      <div className="text-center space-y-3 mb-10 max-w-lg">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-neonCyan via-neonBlue to-neonPurple bg-clip-text text-transparent drop-shadow-sm select-none">
          Backbench Games
        </h1>
        <p className="text-slate-300 text-base md:text-lg font-bold">Pick a desk. Start a match.</p>
        <p className="text-slate-400 text-sm md:text-base font-medium">
          The games you played when the teacher stepped out — now online, with a room code you can text a friend.
        </p>
      </div>

      {/* Input Form card */}
      <div className="glass-panel max-w-sm w-full p-8 rounded-3xl border border-slate-700/20 shadow-glass relative overflow-hidden group">
        {/* Soft corner glowing gradients */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-neonCyan/10 rounded-full blur-2xl group-hover:bg-neonCyan/20 transition-all duration-700"></div>
        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-neonPink/10 rounded-full blur-2xl group-hover:bg-neonPink/20 transition-all duration-700"></div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="nickname" className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Enter Nickname
            </label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setError(null);
              }}
              placeholder="e.g. Shourjya"
              maxLength={15}
              autoFocus
              className="w-full bg-slate-900/60 border border-slate-800 focus:border-neonCyan focus:ring-1 focus:ring-neonCyan/30 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 outline-none transition-all text-sm font-medium"
            />
            {error && (
              <p className="text-red-400 text-xs font-semibold animate-shake mt-1">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-neonCyan to-neonBlue hover:from-neonCyan/90 hover:to-neonBlue/90 text-slate-950 font-bold py-3.5 px-4 rounded-xl shadow-[0_0_15px_rgba(0,240,255,0.25)] hover:shadow-[0_0_25px_rgba(0,240,255,0.4)] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider cursor-pointer"
          >
            Grab a Desk <Play className="w-4 h-4 fill-current" />
          </button>
        </form>
      </div>

      <div className="mt-8 text-center text-[10px] text-slate-600 uppercase tracking-widest font-mono">
        Hand Cricket &bull; Tic Tac Toe &bull; More Coming Soon
      </div>
    </div>
  );
};
