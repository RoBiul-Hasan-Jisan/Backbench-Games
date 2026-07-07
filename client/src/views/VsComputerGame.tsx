import React, { useMemo, useRef, useState } from 'react';
import { ArrowRight, Bot, RotateCcw, Trophy, X } from 'lucide-react';
import type { GameRoom } from '../shared';
import {
  ComputerBrain,
  CPU_ID,
  HUMAN_ID,
  LocalCricketEngine,
  createVsComputerRoom,
} from '../game/vsComputerEngine';
import type { CpuDifficulty } from '../game/vsComputerEngine';
import { RiggedHand } from '../components/RiggedHand';
import type { HandPose, HandState } from '../components/RiggedHand';
import { Scoreboard } from '../components/Scoreboard';
import { MatchTimeline } from '../components/MatchTimeline';
import { soundSynthesizer } from '../utils/soundSynthesizer';
import { StatsManager } from '../utils/statsManager';

interface VsComputerGameProps {
  nickname: string;
  onExit: () => void;
}

type Phase = 'setup' | 'toss-guess' | 'toss-flip' | 'toss-decision' | 'innings' | 'change-innings' | 'result';

const DIFFICULTY_INFO: Record<CpuDifficulty, { label: string; desc: string }> = {
  easy: { label: 'Easy', desc: 'CPU picks numbers completely at random.' },
  medium: { label: 'Medium', desc: 'CPU leans on safer, mid-range numbers.' },
  hard: { label: 'Hard', desc: 'CPU studies your patterns and adapts.' },
};

export const VsComputerGame: React.FC<VsComputerGameProps> = ({ nickname, onExit }) => {
  const [phase, setPhase] = useState<Phase>('setup');
  const [difficulty, setDifficulty] = useState<CpuDifficulty>('medium');
  const [room, setRoom] = useState<GameRoom>(() => createVsComputerRoom(nickname, 'CPU Bot'));
  const brain = useRef(new ComputerBrain('medium'));

  // Innings-phase local UI state (mirrors GameScreen's animation choreography)
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [countdownText, setCountdownText] = useState<string | null>(null);
  const [playerHandPose, setPlayerHandPose] = useState<HandPose>(0);
  const [playerHandState, setPlayerHandState] = useState<HandState>('idle');
  const [cpuHandPose, setCpuHandPose] = useState<HandPose>(0);
  const [cpuHandState, setCpuHandState] = useState<HandState>('idle');
  const [outcomeBanner, setOutcomeBanner] = useState<{ text: string; subText: string; isOut: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const me = room.players.find((p) => p.id === HUMAN_ID)!;
  const cpu = room.players.find((p) => p.id === CPU_ID)!;

  const startMatch = () => {
    brain.current.setDifficulty(difficulty);
    setRoom(createVsComputerRoom(nickname, `CPU Bot (${DIFFICULTY_INFO[difficulty].label})`));
    setPhase('toss-guess');
  };

  const handleGuess = (prediction: 'heads' | 'tails') => {
    soundSynthesizer.playClick();
    setPhase('toss-flip');
    soundSynthesizer.init();
    soundSynthesizer.playToss();
    setTimeout(() => {
      setRoom((prev) => {
        const next = { ...prev, players: [...prev.players] };
        LocalCricketEngine.handleCoinToss(next, prediction);
        return next;
      });
      soundSynthesizer.playTossLand();
      setPhase('toss-decision');
    }, 1500);
  };

  const handleDecision = (choice: 'bat' | 'bowl') => {
    soundSynthesizer.playClick();
    setRoom((prev) => {
      const next: GameRoom = { ...prev, players: prev.players.map((p) => ({ ...p })) };
      LocalCricketEngine.handleTossDecision(next, HUMAN_ID, choice);
      return next;
    });
    setPhase('innings');
  };

  const isSecondInnings = room.status === 'SECOND_INNINGS';

  // If the CPU won the toss, it auto-decides bat/bowl shortly after landing on this phase.
  const cpuDecisionScheduled = useRef(false);
  React.useEffect(() => {
    if (phase === 'toss-decision' && room.tossWinnerId === CPU_ID && room.status === 'BAT_OR_BOWL' && !cpuDecisionScheduled.current) {
      cpuDecisionScheduled.current = true;
      const t = setTimeout(() => {
        handleDecision(Math.random() < 0.7 ? 'bat' : 'bowl');
        cpuDecisionScheduled.current = false;
      }, 900);
      return () => clearTimeout(t);
    }
  }, [phase, room.tossWinnerId, room.status]);

  const runReveal = (humanChoice: number, cpuChoice: number) => {
    setBusy(true);
    let step = 0;
    const seq = () => {
      step += 1;
      if (step === 1) {
        setCountdownText('3');
        soundSynthesizer.playTick();
        setTimeout(seq, 500);
      } else if (step === 2) {
        setCountdownText('2');
        soundSynthesizer.playTick();
        setTimeout(seq, 500);
      } else if (step === 3) {
        setCountdownText('1');
        soundSynthesizer.playTick();
        setTimeout(seq, 500);
      } else if (step === 4) {
        setCountdownText('GO!');
        soundSynthesizer.playTick();
        if (navigator.vibrate) navigator.vibrate(15);
        setTimeout(seq, 300);
      } else if (step === 5) {
        setCountdownText(null);
        setPlayerHandState('shaking');
        setCpuHandState('shaking');
        setTimeout(seq, 600);
      } else if (step === 6) {
        setPlayerHandPose(humanChoice as HandPose);
        setCpuHandPose(cpuChoice as HandPose);
        setPlayerHandState('reveal');
        setCpuHandState('reveal');
        soundSynthesizer.playReveal();
        if (navigator.vibrate) navigator.vibrate(40);
        setTimeout(seq, 200);
      } else if (step === 7) {
        const result = LocalCricketEngine.resolveTurn(
          { ...room, players: room.players.map((p) => ({ ...p })) },
          humanChoice,
          cpuChoice
        );
        const isMeBatter = room.batterId === HUMAN_ID;

        if (result.isOut) {
          setOutcomeBanner({
            text: 'OUT!',
            subText: isMeBatter ? 'You gave your wicket away!' : 'You bowled the CPU out!',
            isOut: true,
          });
          soundSynthesizer.playOut();
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        } else {
          setOutcomeBanner({
            text: `+${result.runsAdded} Runs`,
            subText: isMeBatter ? 'Runs added to your score!' : 'The CPU scored runs.',
            isOut: false,
          });
          if (result.runsAdded >= 4) soundSynthesizer.playCheer();
        }

        setRoom((prev) => {
          const next: GameRoom = { ...prev, players: prev.players.map((p) => ({ ...p })) };
          const r2 = LocalCricketEngine.resolveTurn(next, humanChoice, cpuChoice);
          if (r2.gameOver) {
            // Persist a lightweight match record so it shows in stats/history.
            StatsManager.recordMatch(
              {
                matchId: `cpu-${Date.now()}`,
                roomCode: 'CPU-VS',
                startTime: prev.lastActive,
                endTime: Date.now(),
                duration: Date.now() - prev.lastActive,
                winnerId: r2.winnerId,
                draw: next.draw,
                hostName: nickname,
                guestName: cpu.nickname,
                hostScore: next.players.find((p) => p.id === HUMAN_ID)!.score,
                guestScore: next.players.find((p) => p.id === CPU_ID)!.score,
              },
              next.moves,
              HUMAN_ID
            );
          }
          return next;
        });

        setTimeout(seq, 650);
      } else if (step === 8) {
        setOutcomeBanner(null);
        setHasSubmitted(false);
        setPlayerHandPose(0);
        setCpuHandPose(0);
        setPlayerHandState('idle');
        setCpuHandState('idle');
        setBusy(false);

        setRoom((prev) => {
          if (prev.status === 'CHANGE_INNINGS') setPhase('change-innings');
          else if (prev.status === 'RESULT') setPhase('result');
          return prev;
        });
      }
    };
    seq();
  };

  const handleMoveSelection = (choice: number) => {
    if (hasSubmitted || busy) return;
    soundSynthesizer.playClick();
    if (navigator.vibrate) navigator.vibrate(15);
    setHasSubmitted(true);

    if (room.batterId === HUMAN_ID) brain.current.recordHumanChoice(choice);
    else brain.current.recordHumanChoice(choice); // human's bowling number also reveals their tendencies

    const cpuChoice = brain.current.chooseMove({
      isCpuBatting: room.batterId === CPU_ID,
      cpuScore: cpu.score,
      targetRuns: room.targetRuns,
      isSecondInnings,
    });

    runReveal(choice, cpuChoice);
  };

  const handleStartSecondInnings = () => {
    soundSynthesizer.playClick();
    setRoom((prev) => {
      const next: GameRoom = { ...prev, players: prev.players.map((p) => ({ ...p })) };
      LocalCricketEngine.startSecondInnings(next);
      return next;
    });
    setPhase('innings');
  };

  const playAgain = () => {
    startMatch();
  };

  const resultText = useMemo(() => {
    if (room.draw) return { title: "It's a Tie!", detail: 'Scores level — no winner this time.' };
    if (room.winnerId === HUMAN_ID) return { title: 'You Won! 🏆', detail: `You beat the CPU (${DIFFICULTY_INFO[difficulty].label}).` };
    return { title: 'CPU Wins', detail: 'Better luck next time — try a lower difficulty or a rematch.' };
  }, [room.draw, room.winnerId, difficulty]);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 p-4 select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-300">
          <Bot className="w-5 h-5 text-neonCyan" />
          <span className="font-bold uppercase tracking-widest text-xs">Vs Computer • Hand Cricket</span>
        </div>
        <button
          onClick={onExit}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {phase === 'setup' && (
        <div className="glass-panel p-8 rounded-3xl border border-slate-700/20 space-y-6">
          <h2 className="text-lg font-bold text-white">Choose CPU Difficulty</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(Object.keys(DIFFICULTY_INFO) as CpuDifficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                  difficulty === d
                    ? 'bg-neonCyan/10 border-neonCyan/50 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-sm uppercase tracking-wide mb-1">{DIFFICULTY_INFO[d].label}</div>
                <div className="text-2xs text-slate-500">{DIFFICULTY_INFO[d].desc}</div>
              </button>
            ))}
          </div>
          <button
            onClick={startMatch}
            className="w-full py-3 px-4 bg-gradient-to-r from-neonCyan to-neonBlue text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
          >
            Start Match
          </button>
        </div>
      )}

      {phase === 'toss-guess' && (
        <div className="glass-panel p-8 rounded-3xl border border-slate-700/20 text-center space-y-6">
          <h2 className="text-xl font-bold text-slate-300 uppercase tracking-wider">The Coin Toss</h2>
          <p className="text-slate-400 text-sm">Call it in the air:</p>
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <button onClick={() => handleGuess('heads')} className="py-4 bg-neonCyan/10 hover:bg-neonCyan/20 text-neonCyan font-black rounded-2xl border border-neonCyan/30 text-sm uppercase tracking-widest cursor-pointer">
              Heads
            </button>
            <button onClick={() => handleGuess('tails')} className="py-4 bg-neonPink/10 hover:bg-neonPink/20 text-neonPink font-black rounded-2xl border border-neonPink/30 text-sm uppercase tracking-widest cursor-pointer">
              Tails
            </button>
          </div>
        </div>
      )}

      {phase === 'toss-flip' && (
        <div className="glass-panel p-8 rounded-3xl border border-slate-700/20 text-center space-y-6">
          <h2 className="text-xl font-bold text-slate-300 uppercase tracking-wider animate-pulse">Flipping Coin...</h2>
          <div className="flex justify-center my-4">
            <div className="w-24 h-24 rounded-full border-4 border-slate-700 bg-slate-900 flex items-center justify-center text-lg animate-coin-flip">
              🪙
            </div>
          </div>
        </div>
      )}

      {phase === 'toss-decision' && (
        <div className="glass-panel p-8 rounded-3xl border border-slate-700/20 text-center space-y-6">
          <h2 className="text-2xl font-black text-white">
            Coin showed <span className="text-neonCyan uppercase">{room.coinFlipResult}</span>!
          </h2>
          <p className="text-sm text-slate-300">
            {room.tossWinnerId === HUMAN_ID ? 'You won the toss! Choose your role:' : `${cpu.nickname} won the toss and chose to bat first.`}
          </p>
          {room.tossWinnerId === HUMAN_ID ? (
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <button onClick={() => handleDecision('bat')} className="py-4 bg-gradient-to-r from-neonCyan to-neonBlue text-slate-950 font-black rounded-2xl text-xs uppercase tracking-widest cursor-pointer">
                🏏 Bat
              </button>
              <button onClick={() => handleDecision('bowl')} className="py-4 bg-gradient-to-r from-neonPink to-neonPurple text-white font-black rounded-2xl text-xs uppercase tracking-widest cursor-pointer">
                🥎 Bowl
              </button>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-neonCyan animate-spin mx-auto" />
          )}
        </div>
      )}

      {(phase === 'innings' || phase === 'change-innings') && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center glass-panel p-4 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neonPink/15 border border-neonPink/30 flex items-center justify-center text-neonPink font-extrabold uppercase">
                CPU
              </div>
              <div>
                <span className="font-bold text-white text-sm">{cpu.nickname}</span>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  {room.batterId === CPU_ID ? '🏏 Batting' : '🥎 Bowling'}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Score</div>
              <div className="text-base font-extrabold text-white">{cpu.score}</div>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 items-center my-2 relative">
            {countdownText && (
              <div className="absolute inset-0 bg-darkBg/60 backdrop-blur-2xs z-30 flex items-center justify-center">
                <div className="text-7xl md:text-8xl font-black text-white tracking-wider">{countdownText}</div>
              </div>
            )}
            {outcomeBanner && (
              <div className="absolute inset-0 bg-darkBg/75 backdrop-blur-3xs z-35 flex items-center justify-center">
                <div className={`glass-panel p-8 rounded-3xl text-center max-w-sm w-full border ${outcomeBanner.isOut ? 'border-red-500/35' : 'border-emerald-500/35'}`}>
                  <h2 className={`text-4xl font-black uppercase tracking-wider ${outcomeBanner.isOut ? 'text-red-500' : 'text-emerald-400'}`}>
                    {outcomeBanner.text}
                  </h2>
                  <p className="text-slate-300 text-xs mt-2 font-medium">{outcomeBanner.subText}</p>
                </div>
              </div>
            )}

            <div className="flex flex-col items-center justify-center p-4 border border-slate-900 rounded-2xl md:h-full bg-slate-950/20">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-4">CPU Hand</span>
              <RiggedHand pose={cpuHandPose} state={cpuHandState} facing="down" colorTheme="pink" />
            </div>

            <div className="space-y-6 flex flex-col justify-center">
              <Scoreboard room={room} currentPlayerId={HUMAN_ID} />
              <MatchTimeline room={room} currentPlayerId={HUMAN_ID} />
            </div>

            <div className="flex flex-col items-center justify-center p-4 border border-slate-900 rounded-2xl md:h-full bg-slate-950/20">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-4">Your Hand</span>
              <RiggedHand pose={playerHandPose} state={playerHandState} facing="up" colorTheme="cyan" />
            </div>
          </div>

          {phase === 'change-innings' && (
            <div className="glass-panel p-8 rounded-3xl text-center space-y-6 border border-neonCyan/25">
              <h2 className="text-2xl font-extrabold text-white">Innings Completed!</h2>
              <div className="py-4 px-6 bg-slate-950 rounded-2xl space-y-2 max-w-xs mx-auto text-sm border border-slate-900">
                <div className="flex justify-between text-slate-400">
                  <span>Innings 1 Score:</span>
                  <span className="font-bold text-white">{room.targetRuns! - 1} runs</span>
                </div>
                <div className="flex justify-between text-slate-400 border-t border-slate-900 pt-2 mt-2">
                  <span className="text-neonCyan">Target to Win:</span>
                  <span className="font-bold text-neonCyan">{room.targetRuns} runs</span>
                </div>
              </div>
              <button
                onClick={handleStartSecondInnings}
                className="w-full py-3 px-6 bg-gradient-to-r from-neonCyan to-neonBlue text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 cursor-pointer max-w-xs mx-auto"
              >
                Start 2nd Innings <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {phase === 'innings' && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800/80">
              <h3 className="text-center text-[10px] text-slate-400 uppercase tracking-widest font-extrabold mb-4">
                Select Your Number
              </h3>
              <div className="grid grid-cols-6 gap-2 sm:gap-4 max-w-lg mx-auto">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    disabled={hasSubmitted || busy}
                    onClick={() => handleMoveSelection(num)}
                    className={`aspect-square rounded-xl border font-black text-lg transition-all flex items-center justify-center cursor-pointer ${
                      hasSubmitted
                        ? 'bg-slate-900 border-slate-800 text-slate-600 disabled:cursor-not-allowed'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-750'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {phase === 'result' && (
        <div className="glass-panel p-8 rounded-3xl border border-slate-700/20 text-center space-y-6">
          <Trophy className="w-12 h-12 text-neonCyan mx-auto" />
          <h2 className="text-2xl font-black text-white">{resultText.title}</h2>
          <p className="text-sm text-slate-400">{resultText.detail}</p>
          <div className="flex justify-center gap-6 text-sm">
            <div>
              <div className="text-slate-500 text-2xs uppercase">You</div>
              <div className="font-bold text-white text-lg">{me.score}</div>
            </div>
            <div>
              <div className="text-slate-500 text-2xs uppercase">CPU</div>
              <div className="font-bold text-white text-lg">{cpu.score}</div>
            </div>
          </div>
          <div className="flex gap-3 justify-center pt-2">
            <button onClick={playAgain} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-neonCyan to-neonBlue text-slate-950 font-bold text-xs uppercase cursor-pointer flex items-center gap-2">
              <RotateCcw className="w-4 h-4" /> Rematch
            </button>
            <button onClick={onExit} className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase cursor-pointer">
              Back to Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
