import React, { useEffect, useRef, useState } from 'react';
import { Circle, RotateCcw, Users, Bot, X } from 'lucide-react';
import type { C4Cell, C4Difficulty } from '../game/connect4Engine';
import { C4_ROWS, C4_COLS, getDropRow, checkWinner, isBoardFull, getComputerMove } from '../game/connect4Engine';
import { soundSynthesizer } from '../utils/soundSynthesizer';

type Mode = 'setup' | 'playing';
type Opponent = 'computer' | 'human';

export const Connect4Game: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [mode, setMode] = useState<Mode>('setup');
  const [opponent, setOpponent] = useState<Opponent>('computer');
  const [difficulty, setDifficulty] = useState<C4Difficulty>('medium');

  const [board, setBoard] = useState<C4Cell[]>(Array(C4_ROWS * C4_COLS).fill(null));
  const [turn, setTurn] = useState<'R' | 'Y'>('R');
  const [winInfo, setWinInfo] = useState<{ line: number[]; player: 'R' | 'Y' } | null>(null);
  const [draw, setDraw] = useState(false);
  const [scores, setScores] = useState({ R: 0, Y: 0, draws: 0 });
  const thinking = useRef(false);

  const humanMark: 'R' | 'Y' = 'R';
  const cpuMark: 'R' | 'Y' = 'Y';

  const startGame = () => {
    setBoard(Array(C4_ROWS * C4_COLS).fill(null));
    setTurn('R');
    setWinInfo(null);
    setDraw(false);
    setMode('playing');
  };

  const resetBoardOnly = () => {
    setBoard(Array(C4_ROWS * C4_COLS).fill(null));
    setTurn('R');
    setWinInfo(null);
    setDraw(false);
  };

  const drop = (col: number, mark: 'R' | 'Y') => {
    const row = getDropRow(board, col);
    if (row < 0) return;
    soundSynthesizer.playClick();
    setBoard((prev) => {
      const next = prev.slice();
      next[row * C4_COLS + col] = mark;
      const win = checkWinner(next);
      if (win) {
        setWinInfo(win);
        setScores((s) => ({ ...s, [win.player]: s[win.player] + 1 }));
        soundSynthesizer.playCheer();
      } else if (isBoardFull(next)) {
        setDraw(true);
        setScores((s) => ({ ...s, draws: s.draws + 1 }));
      } else {
        setTurn(mark === 'R' ? 'Y' : 'R');
      }
      return next;
    });
  };

  const handleColClick = (col: number) => {
    if (winInfo || draw) return;
    if (opponent === 'computer' && turn !== humanMark) return;
    drop(col, turn);
  };

  useEffect(() => {
    if (opponent !== 'computer' || winInfo || draw || turn !== cpuMark || thinking.current) return;
    thinking.current = true;
    const t = setTimeout(() => {
      const col = getComputerMove(board, cpuMark, humanMark, difficulty);
      if (col >= 0) drop(col, cpuMark);
      thinking.current = false;
    }, 500);
    return () => clearTimeout(t);
  }, [turn, board, opponent, winInfo, draw, difficulty]);

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 p-4 select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-300">
          <Circle className="w-5 h-5 text-neonCyan" />
          <span className="font-bold uppercase tracking-widest text-xs">Connect 4</span>
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
              <button onClick={() => setOpponent('computer')} className={`p-4 rounded-2xl border flex items-center justify-center gap-2 font-bold cursor-pointer ${opponent === 'computer' ? 'bg-neonCyan/10 border-neonCyan/50 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                <Bot className="w-4 h-4" /> Vs Computer
              </button>
              <button onClick={() => setOpponent('human')} className={`p-4 rounded-2xl border flex items-center justify-center gap-2 font-bold cursor-pointer ${opponent === 'human' ? 'bg-neonPink/10 border-neonPink/50 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                <Users className="w-4 h-4" /> 2 Players (Pass & Play)
              </button>
            </div>
          </div>
          {opponent === 'computer' && (
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">CPU Difficulty</h3>
              <div className="grid grid-cols-3 gap-4">
                {(['easy', 'medium', 'hard'] as C4Difficulty[]).map((d) => (
                  <button key={d} onClick={() => setDifficulty(d)} className={`p-3 rounded-2xl border text-center font-bold text-xs uppercase cursor-pointer ${difficulty === d ? 'bg-neonCyan/10 border-neonCyan/50 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
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
            <span className="text-red-400 font-bold">🔴 {scores.R}</span>
            <span className="text-slate-500">Draws: {scores.draws}</span>
            <span className="text-yellow-400 font-bold">🟡 {scores.Y}</span>
          </div>

          <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-slate-700/20 flex flex-col items-center gap-4">
            {!winInfo && !draw && (
              <div className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                {opponent === 'computer' ? (turn === humanMark ? 'Your turn (Red)' : 'CPU is thinking...') : `Player ${turn === 'R' ? '1 (Red)' : '2 (Yellow)'}'s turn`}
              </div>
            )}
            {winInfo && (
              <div className={`text-lg font-black uppercase tracking-wider ${winInfo.player === 'R' ? 'text-red-400' : 'text-yellow-400'}`}>
                {opponent === 'computer' ? (winInfo.player === humanMark ? 'You Win! 🎉' : 'CPU Wins') : `Player ${winInfo.player === 'R' ? '1' : '2'} Wins! 🎉`}
              </div>
            )}
            {draw && <div className="text-lg font-black uppercase tracking-wider text-slate-400">It's a Draw!</div>}

            <div className="bg-blue-950/40 border border-blue-900/40 rounded-2xl p-2 sm:p-3 w-full max-w-md mx-auto">
              <div className="grid gap-1 sm:gap-1.5" style={{ gridTemplateColumns: `repeat(${C4_COLS}, minmax(0, 1fr))` }}>
                {Array.from({ length: C4_COLS }).map((_, col) => (
                  <button
                    key={col}
                    onClick={() => handleColClick(col)}
                    disabled={!!winInfo || draw || getDropRow(board, col) < 0}
                    className="flex flex-col gap-1 sm:gap-1.5 cursor-pointer disabled:cursor-not-allowed group"
                  >
                    {Array.from({ length: C4_ROWS }).map((__, row) => {
                      const cell = board[row * C4_COLS + col];
                      const isWinning = winInfo?.line.includes(row * C4_COLS + col);
                      return (
                        <div
                          key={row}
                          className={`aspect-square rounded-full border-2 transition-all ${
                            isWinning
                              ? 'border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]'
                              : 'border-blue-900/60 group-hover:border-blue-700'
                          } ${cell === 'R' ? 'bg-red-500' : cell === 'Y' ? 'bg-yellow-400' : 'bg-slate-950/60'}`}
                        />
                      );
                    })}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button onClick={resetBoardOnly} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-neonCyan to-neonBlue text-slate-950 font-bold text-xs uppercase cursor-pointer flex items-center gap-2">
              <RotateCcw className="w-4 h-4" /> Play Again
            </button>
            <button onClick={() => setMode('setup')} className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase cursor-pointer">
              Change Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
