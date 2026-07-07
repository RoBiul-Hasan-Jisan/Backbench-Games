import React, { useEffect, useRef, useState } from 'react';
import { Grid3x3, RotateCcw, Users, Bot, X } from 'lucide-react';
import type { Cell, BoardSize, TttDifficulty } from '../game/ticTacToeEngine';
import { checkWinner, isBoardFull, getComputerMove, winLengthFor } from '../game/ticTacToeEngine';
import { soundSynthesizer } from '../utils/soundSynthesizer';

interface TicTacToeGameProps {
  onExit: () => void;
}

type Mode = 'setup' | 'playing';
type Opponent = 'computer' | 'human';

const SIZE_OPTIONS: BoardSize[] = [3, 5, 8];
const DIFFICULTY_INFO: Record<TttDifficulty, string> = {
  easy: 'Random moves',
  medium: 'Blocks you, plays sensibly',
  hard: 'Near-unbeatable',
};

export const TicTacToeGame: React.FC<TicTacToeGameProps> = ({ onExit }) => {
  const [mode, setMode] = useState<Mode>('setup');
  const [size, setSize] = useState<BoardSize>(3);
  const [opponent, setOpponent] = useState<Opponent>('computer');
  const [difficulty, setDifficulty] = useState<TttDifficulty>('medium');

  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<'X' | 'O'>('X');
  const [winInfo, setWinInfo] = useState<{ line: number[]; player: 'X' | 'O' } | null>(null);
  const [draw, setDraw] = useState(false);
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });

  const humanMark: 'X' | 'O' = 'X';
  const cpuMark: 'X' | 'O' = 'O';
  const thinking = useRef(false);

  const startGame = () => {
    setBoard(Array(size * size).fill(null));
    setTurn('X');
    setWinInfo(null);
    setDraw(false);
    setMode('playing');
  };

  const resetBoardOnly = () => {
    setBoard(Array(size * size).fill(null));
    setTurn('X');
    setWinInfo(null);
    setDraw(false);
  };

  const applyMove = (i: number, mark: 'X' | 'O') => {
    setBoard((prev) => {
      if (prev[i] !== null) return prev;
      const next = prev.slice();
      next[i] = mark;

      const win = checkWinner(next, size);
      if (win) {
        setWinInfo(win);
        setScores((s) => ({ ...s, [win.player]: s[win.player] + 1 }));
        soundSynthesizer.playCheer();
      } else if (isBoardFull(next)) {
        setDraw(true);
        setScores((s) => ({ ...s, draws: s.draws + 1 }));
      } else {
        setTurn(mark === 'X' ? 'O' : 'X');
      }
      return next;
    });
  };

  const handleCellClick = (i: number) => {
    if (winInfo || draw || board[i] !== null) return;
    if (opponent === 'computer' && turn !== humanMark) return;

    soundSynthesizer.playClick();
    applyMove(i, turn);
  };

  // CPU move effect
  useEffect(() => {
    if (opponent !== 'computer') return;
    if (winInfo || draw) return;
    if (turn !== cpuMark) return;
    if (thinking.current) return;

    thinking.current = true;
    const t = setTimeout(() => {
      const move = getComputerMove(board, size, cpuMark, humanMark, difficulty);
      if (move >= 0) applyMove(move, cpuMark);
      thinking.current = false;
    }, 450);
    return () => clearTimeout(t);
  }, [turn, board, opponent, winInfo, draw, difficulty, size]);

  const winLen = winLengthFor(size);

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 p-4 select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-300">
          <Grid3x3 className="w-5 h-5 text-neonCyan" />
          <span className="font-bold uppercase tracking-widest text-xs">Tic Tac Toe</span>
        </div>
        <button onClick={onExit} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>

      {mode === 'setup' && (
        <div className="glass-panel p-8 rounded-3xl border border-slate-700/20 space-y-8">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Board Size</h3>
            <div className="grid grid-cols-3 gap-4">
              {SIZE_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`p-4 rounded-2xl border font-black text-center cursor-pointer transition-all ${
                    size === s ? 'bg-neonCyan/10 border-neonCyan/50 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-lg">{s}×{s}</div>
                  <div className="text-2xs text-slate-500 font-normal mt-1">{s} in a row to win</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Opponent</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setOpponent('computer')}
                className={`p-4 rounded-2xl border flex items-center justify-center gap-2 font-bold cursor-pointer ${
                  opponent === 'computer' ? 'bg-neonCyan/10 border-neonCyan/50 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Bot className="w-4 h-4" /> Vs Computer
              </button>
              <button
                onClick={() => setOpponent('human')}
                className={`p-4 rounded-2xl border flex items-center justify-center gap-2 font-bold cursor-pointer ${
                  opponent === 'human' ? 'bg-neonPink/10 border-neonPink/50 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Users className="w-4 h-4" /> 2 Players (Pass & Play)
              </button>
            </div>
          </div>

          {opponent === 'computer' && (
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">CPU Difficulty</h3>
              <div className="grid grid-cols-3 gap-4">
                {(Object.keys(DIFFICULTY_INFO) as TttDifficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`p-3 rounded-2xl border text-center cursor-pointer ${
                      difficulty === d ? 'bg-neonCyan/10 border-neonCyan/50 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs uppercase">{d}</div>
                    <div className="text-3xs text-slate-500 mt-1">{DIFFICULTY_INFO[d]}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={startGame}
            className="w-full py-3 px-4 bg-gradient-to-r from-neonCyan to-neonBlue text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
          >
            Start Game
          </button>
        </div>
      )}

      {mode === 'playing' && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center glass-panel p-4 rounded-2xl border border-slate-800/80 text-xs">
            <div className="flex gap-4 font-mono text-slate-300">
              <span className="text-neonCyan font-bold">X: {scores.X}</span>
              <span className="text-slate-500">Draws: {scores.draws}</span>
              <span className="text-neonPink font-bold">O: {scores.O}</span>
            </div>
            <div className="text-slate-400 uppercase tracking-wider font-bold">
              {winLen} in a row to win &bull; {size}×{size}
            </div>
          </div>

          <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-slate-700/20 flex flex-col items-center gap-4">
            {!winInfo && !draw && (
              <div className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                {opponent === 'computer'
                  ? turn === humanMark ? 'Your turn (X)' : 'CPU is thinking...'
                  : `Player ${turn}'s turn`}
              </div>
            )}
            {winInfo && (
              <div className={`text-lg font-black uppercase tracking-wider ${winInfo.player === 'X' ? 'text-neonCyan' : 'text-neonPink'}`}>
                {opponent === 'computer'
                  ? winInfo.player === humanMark ? 'You Win! 🎉' : 'CPU Wins'
                  : `Player ${winInfo.player} Wins! 🎉`}
              </div>
            )}
            {draw && <div className="text-lg font-black uppercase tracking-wider text-slate-400">It's a Draw!</div>}

            <div
              className="grid gap-1.5 sm:gap-2 w-full max-w-md mx-auto"
              style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
            >
              {board.map((cell, i) => {
                const isWinning = winInfo?.line.includes(i);
                return (
                  <button
                    key={i}
                    onClick={() => handleCellClick(i)}
                    disabled={cell !== null || !!winInfo || draw}
                    className={`aspect-square rounded-lg sm:rounded-xl border flex items-center justify-center font-black transition-all cursor-pointer ${
                      size === 8 ? 'text-sm sm:text-lg' : size === 5 ? 'text-lg sm:text-2xl' : 'text-2xl sm:text-4xl'
                    } ${
                      isWinning
                        ? 'bg-emerald-500/20 border-emerald-500/60'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    } ${cell === 'X' ? 'text-neonCyan' : cell === 'O' ? 'text-neonPink' : 'text-transparent'} disabled:cursor-not-allowed`}
                  >
                    {cell || '·'}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={resetBoardOnly}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-neonCyan to-neonBlue text-slate-950 font-bold text-xs uppercase cursor-pointer flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Play Again
            </button>
            <button
              onClick={() => setMode('setup')}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase cursor-pointer"
            >
              Change Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
