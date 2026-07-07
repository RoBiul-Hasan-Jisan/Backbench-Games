import React, { useState } from 'react';
import { Hand as HandIcon, RotateCcw, Users, Bot, X } from 'lucide-react';
import { soundSynthesizer } from '../utils/soundSynthesizer';

type Choice = 'rock' | 'paper' | 'scissors';
type Difficulty = 'easy' | 'medium' | 'hard';
type Mode = 'setup' | 'playing';
type Opponent = 'computer' | 'human';

const EMOJI: Record<Choice, string> = { rock: '🪨', paper: '📄', scissors: '✂️' };
const CHOICES: Choice[] = ['rock', 'paper', 'scissors'];

function beats(a: Choice, b: Choice): boolean {
  return (a === 'rock' && b === 'scissors') || (a === 'paper' && b === 'rock') || (a === 'scissors' && b === 'paper');
}

export const RockPaperScissorsGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [mode, setMode] = useState<Mode>('setup');
  const [opponent, setOpponent] = useState<Opponent>('computer');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  const [p1Choice, setP1Choice] = useState<Choice | null>(null);
  const [p2Choice, setP2Choice] = useState<Choice | null>(null);
  const [awaitingP2, setAwaitingP2] = useState(false); // local 2p hand-off screen
  const [result, setResult] = useState<'p1' | 'p2' | 'draw' | null>(null);
  const [scores, setScores] = useState({ p1: 0, p2: 0, draws: 0 });
  const [history, setHistory] = useState<Choice[]>([]); // human choice history, for "hard" CPU

  const startGame = () => {
    setP1Choice(null);
    setP2Choice(null);
    setResult(null);
    setAwaitingP2(false);
    setMode('playing');
  };

  const cpuPick = (): Choice => {
    if (difficulty === 'easy' || history.length === 0) {
      return CHOICES[Math.floor(Math.random() * 3)];
    }
    // medium/hard: lean on beating the human's most frequent recent pick
    const freq: Record<Choice, number> = { rock: 0, paper: 0, scissors: 0 };
    for (const c of history.slice(-8)) freq[c]++;
    const mostCommon = (Object.keys(freq) as Choice[]).sort((a, b) => freq[b] - freq[a])[0];
    const counter: Record<Choice, Choice> = { rock: 'paper', paper: 'scissors', scissors: 'rock' };
    const bias = difficulty === 'hard' ? 0.75 : 0.4;
    return Math.random() < bias ? counter[mostCommon] : CHOICES[Math.floor(Math.random() * 3)];
  };

  const resolve = (a: Choice, b: Choice) => {
    if (a === b) return 'draw' as const;
    return beats(a, b) ? ('p1' as const) : ('p2' as const);
  };

  const handleP1Pick = (choice: Choice) => {
    if (p1Choice) return;
    soundSynthesizer.playClick();
    setHistory((h) => [...h, choice]);
    setP1Choice(choice);

    if (opponent === 'computer') {
      const cpu = cpuPick();
      setTimeout(() => finish(choice, cpu), 500);
    } else {
      setAwaitingP2(true);
    }
  };

  const handleP2Pick = (choice: Choice) => {
    if (!p1Choice) return;
    soundSynthesizer.playClick();
    finish(p1Choice, choice);
  };

  const finish = (a: Choice, b: Choice) => {
    setP2Choice(b);
    setAwaitingP2(false);
    const res = resolve(a, b);
    setResult(res);
    if (res === 'draw') setScores((s) => ({ ...s, draws: s.draws + 1 }));
    else {
      setScores((s) => ({ ...s, [res]: s[res] + 1 }));
      soundSynthesizer.playCheer();
    }
  };

  const playAgain = () => {
    setP1Choice(null);
    setP2Choice(null);
    setResult(null);
    setAwaitingP2(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 p-4 select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-300">
          <HandIcon className="w-5 h-5 text-neonCyan" />
          <span className="font-bold uppercase tracking-widest text-xs">Rock Paper Scissors</span>
        </div>
        <button onClick={onExit} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>

      {mode === 'setup' && (
        <div className="glass-panel p-8 rounded-3xl border border-slate-700/20 space-y-8">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Opponent</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setOpponent('computer')}
                className={`p-4 rounded-2xl border flex items-center justify-center gap-2 font-bold cursor-pointer ${opponent === 'computer' ? 'bg-neonCyan/10 border-neonCyan/50 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
              >
                <Bot className="w-4 h-4" /> Vs Computer
              </button>
              <button
                onClick={() => setOpponent('human')}
                className={`p-4 rounded-2xl border flex items-center justify-center gap-2 font-bold cursor-pointer ${opponent === 'human' ? 'bg-neonPink/10 border-neonPink/50 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
              >
                <Users className="w-4 h-4" /> 2 Players (Pass & Play)
              </button>
            </div>
          </div>

          {opponent === 'computer' && (
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">CPU Difficulty</h3>
              <div className="grid grid-cols-3 gap-4">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`p-3 rounded-2xl border text-center font-bold text-xs uppercase cursor-pointer ${difficulty === d ? 'bg-neonCyan/10 border-neonCyan/50 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button onClick={startGame} className="w-full py-3 px-4 bg-gradient-to-r from-neonCyan to-neonBlue text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer">
            Start Game
          </button>
        </div>
      )}

      {mode === 'playing' && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center glass-panel p-4 rounded-2xl border border-slate-800/80 text-xs font-mono">
            <span className="text-neonCyan font-bold">P1: {scores.p1}</span>
            <span className="text-slate-500">Draws: {scores.draws}</span>
            <span className="text-neonPink font-bold">{opponent === 'computer' ? 'CPU' : 'P2'}: {scores.p2}</span>
          </div>

          <div className="glass-panel p-8 rounded-3xl border border-slate-700/20 flex flex-col items-center gap-6">
            <div className="flex items-center justify-center gap-8 sm:gap-16 text-6xl sm:text-7xl h-24">
              <div className={`transition-all ${p1Choice ? 'scale-100' : 'scale-75 opacity-40'}`}>
                {p1Choice ? EMOJI[p1Choice] : '❔'}
              </div>
              <span className="text-slate-600 text-2xl font-black">VS</span>
              <div className={`transition-all ${p2Choice ? 'scale-100' : 'scale-75 opacity-40'}`}>
                {p2Choice ? EMOJI[p2Choice] : awaitingP2 ? '🙈' : '❔'}
              </div>
            </div>

            {result && (
              <div
                className={`text-lg font-black uppercase tracking-wider ${
                  result === 'draw' ? 'text-slate-400' : result === 'p1' ? 'text-neonCyan' : 'text-neonPink'
                }`}
              >
                {result === 'draw' ? "It's a Draw!" : result === 'p1' ? 'Player 1 Wins! 🎉' : opponent === 'computer' ? 'CPU Wins' : 'Player 2 Wins! 🎉'}
              </div>
            )}

            {!p1Choice && (
              <div className="w-full">
                <div className="text-center text-2xs text-slate-500 uppercase tracking-widest font-bold mb-3">Player 1: choose</div>
                <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
                  {CHOICES.map((c) => (
                    <button key={c} onClick={() => handleP1Pick(c)} className="aspect-square rounded-2xl bg-slate-900 border border-slate-800 hover:border-neonCyan/50 text-4xl flex items-center justify-center cursor-pointer transition-all">
                      {EMOJI[c]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {awaitingP2 && (
              <div className="w-full">
                <div className="text-center text-2xs text-slate-500 uppercase tracking-widest font-bold mb-3">Pass the device — Player 2: choose</div>
                <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
                  {CHOICES.map((c) => (
                    <button key={c} onClick={() => handleP2Pick(c)} className="aspect-square rounded-2xl bg-slate-900 border border-slate-800 hover:border-neonPink/50 text-4xl flex items-center justify-center cursor-pointer transition-all">
                      {EMOJI[c]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {result && (
            <div className="flex gap-3 justify-center">
              <button onClick={playAgain} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-neonCyan to-neonBlue text-slate-950 font-bold text-xs uppercase cursor-pointer flex items-center gap-2">
                <RotateCcw className="w-4 h-4" /> Play Again
              </button>
              <button onClick={() => setMode('setup')} className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase cursor-pointer">
                Change Settings
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
