"use client";

import { useEffect, useState, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { RiggedHand } from "./RiggedHand";
import type { HandPose, HandState } from "./RiggedHand";
import { Scoreboard } from "./Scoreboard";
import { MatchTimeline } from "./MatchTimeline";
import { soundSynthesizer } from "./soundSynthesizer";
import type { GameRoom } from "./types";





interface GameScreenProps {
  room: GameRoom;
  currentPlayerId: string;
  socket: any;
  getServerTime: () => number;
  onSubmitMove: (choice: number) => void;
  onStartSecondInnings: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  room,
  currentPlayerId,
  socket,
  getServerTime,
  onSubmitMove,
  onStartSecondInnings,
}) => {
  // Local synchronized display room state
  const [displayRoom, setDisplayRoom] = useState<GameRoom>(room);
  
  // Gameplay button locking
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [opponentSubmitted, setOpponentSubmitted] = useState<boolean>(false);

  // Animations & hands states
  const [countdownText, setCountdownText] = useState<string | null>(null);
  const [playerHandPose, setPlayerHandPose] = useState<HandPose>(0);
  const [playerHandState, setPlayerHandState] = useState<HandState>('idle');
  const [opponentHandPose, setOpponentHandPose] = useState<HandPose>(0);
  const [opponentHandState, setOpponentHandState] = useState<HandState>('idle');

  // Turn outcome banner state
  const [outcomeBanner, setOutcomeBanner] = useState<{
    text: string;
    subText: string;
    isOut: boolean;
    runs: number;
  } | null>(null);

  // Innings transition overlay
  const [showInningsTransition, setShowInningsTransition] = useState<boolean>(false);

  // Keep references to prevent state closure issues
  const currentPlayerIdRef = useRef(currentPlayerId);
  useEffect(() => {
    currentPlayerIdRef.current = currentPlayerId;
  }, [currentPlayerId]);

  // Sync displayRoom with parent room state
  useEffect(() => {
    setDisplayRoom(room);
    
    // Sync guest ready state / connectivity updates
    if (room.status === 'CHANGE_INNINGS') {
      setShowInningsTransition(true);
    } else {
      setShowInningsTransition(false);
    }
  }, [room]);

  // Listen to Opponent Submitted event
  useEffect(() => {
    if (!socket) return;

    const handleOpponentMoved = () => {
      setOpponentSubmitted(true);
    };

    socket.on('opponent-moved', handleOpponentMoved);
    return () => {
      socket.off('opponent-moved', handleOpponentMoved);
    };
  }, [socket]);

  // Synchronized Reveal core logic
  useEffect(() => {
    if (!socket) return;

    const handleRevealMoves = (data: {
      revealTime: number;
      choices: { id: string; choice: number }[];
      turnResult: any;
      updatedRoom: GameRoom;
    }) => {
      // 1. Calculate trigger delays using server sync time
      const serverNow = getServerTime();
      const delayMs = data.revealTime - serverNow;

      const myChoice = data.choices.find((c) => c.id === currentPlayerIdRef.current)?.choice || 0;
      const oppChoice = data.choices.find((c) => c.id !== currentPlayerIdRef.current)?.choice || 0;

      // Ensure local state locks
      setHasSubmitted(true);
      setOpponentSubmitted(true);

      // Start the synchronized reveal sequence
      runRevealSequence(delayMs, myChoice as HandPose, oppChoice as HandPose, data.turnResult, data.updatedRoom);
    };

    socket.on('reveal-moves', handleRevealMoves);
    return () => {
      socket.off('reveal-moves', handleRevealMoves);
    };
  }, [socket, getServerTime]);

  const runRevealSequence = async (
    delayMs: number,
    myChoice: HandPose,
    oppChoice: HandPose,
    turnResult: any,
    nextRoomState: GameRoom
  ) => {
    // We have a delay cushion before countdown starts
    // Standard sequence pacing:
    // T-Minus 2.5 seconds: start countdown overlay 3 -> 2 -> 1 -> GO!
    const countdownStartDelay = Math.max(0, delayMs - 2200);
    await new Promise((r) => setTimeout(r, countdownStartDelay));

    // 1. Synchronized countdown pop ticks
    setCountdownText('3');
    soundSynthesizer.playTick();
    await new Promise((r) => setTimeout(r, 600));

    setCountdownText('2');
    soundSynthesizer.playTick();
    await new Promise((r) => setTimeout(r, 600));

    setCountdownText('1');
    soundSynthesizer.playTick();
    await new Promise((r) => setTimeout(r, 600));

    setCountdownText('GO!');
    soundSynthesizer.playTick();
    
    // Mobile haptic pulse for go
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }
    
    await new Promise((r) => setTimeout(r, 300));
    setCountdownText(null);

    // 2. Shake Hands (rapid rocking movement)
    setPlayerHandState('shaking');
    setOpponentHandState('shaking');
    await new Promise((r) => setTimeout(r, 600));

    // 3. Reveal Pose (fingers expand at revealTime)
    setPlayerHandPose(myChoice);
    setOpponentHandPose(oppChoice);
    setPlayerHandState('reveal');
    setOpponentHandState('reveal');
    
    // Play reveal sound
    soundSynthesizer.playReveal();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(40);
    }

    // 4. Impact Pause (200ms strict freeze hold before banners)
    await new Promise((r) => setTimeout(r, 200));

    // 5. Display turn result and play outcomes
    const isOut = turnResult.isOut;
    const runs = turnResult.runsAdded;
    const isMeBatter = displayRoom.batterId === currentPlayerIdRef.current;
    
    let text = '';
    let subText = '';

    if (isOut) {
      text = 'OUT!';
      subText = isMeBatter ? 'You gave your wicket away!' : 'You got the wicket!';
      soundSynthesizer.playOut();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    } else {
      text = `+${runs} Runs`;
      subText = isMeBatter ? 'Runs added to your score!' : 'Opponent scored runs!';
      
      // If boundary (4 or 6), play crowd cheering noise
      if (runs >= 4) {
        soundSynthesizer.playCheer();
      }
    }

    setOutcomeBanner({ text, subText, isOut, runs });

    // 6. Scoreboard updates (update local displayRoom to nextState)
    await new Promise((r) => setTimeout(r, 450));
    setDisplayRoom(nextRoomState);

    // 7. Wait for display reading before resetting turn
    await new Promise((r) => setTimeout(r, 1600));
    
    // Reset banner and unlock buttons
    setOutcomeBanner(null);
    setHasSubmitted(false);
    setOpponentSubmitted(false);
    setPlayerHandPose(0);
    setOpponentHandPose(0);
    setPlayerHandState('idle');
    setOpponentHandState('idle');
  };

  const handleMoveSelection = (choice: number) => {
    if (hasSubmitted) return;
    
    soundSynthesizer.playClick();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }

    setHasSubmitted(true);
    onSubmitMove(choice);
  };

  const handleNextInnings = () => {
    soundSynthesizer.playClick();
    onStartSecondInnings();
  };

  const mePlayer = displayRoom.players.find((p) => p.id === currentPlayerId)!;
  const oppPlayer = displayRoom.players.find((p) => p.id !== currentPlayerId)!;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col justify-between min-h-[85vh] p-4 gap-6 relative select-none">
      
      {/* 1. Opponent Info Header Card */}
      <div className="flex justify-between items-center glass-panel p-4 rounded-2xl border border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neonPink/15 border border-neonPink/30 flex items-center justify-center text-neonPink font-extrabold uppercase">
            {oppPlayer.nickname.slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">{oppPlayer.nickname}</span>
              <span className={`w-2 h-2 rounded-full ${oppPlayer.connected ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></span>
            </div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              {displayRoom.batterId === oppPlayer.id ? '🏏 Batting' : '🥎 Bowling'}
            </span>
          </div>
        </div>

        {/* Opponent score stats display */}
        <div className="text-right">
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Score</div>
          <div className="text-base font-extrabold text-white">{oppPlayer.score}</div>
        </div>
      </div>

      {/* 2. Arena Board containing hands and scoreboard */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 items-center my-2 relative">
        
        {/* Countdown Flash overlay */}
        {countdownText && (
          <div className="absolute inset-0 bg-darkBg/60 backdrop-blur-2xs z-30 flex items-center justify-center">
            <div className="text-7xl md:text-8xl font-black text-white tracking-wider scale-50 opacity-0 animate-[ping_0.5s_ease-in-out_infinite] drop-shadow-[0_0_30px_rgba(0,240,255,0.3)]">
              {countdownText}
            </div>
          </div>
        )}

        {/* Outcome result banner */}
        {outcomeBanner && (
          <div className="absolute inset-0 bg-darkBg/75 backdrop-blur-3xs z-35 flex items-center justify-center">
            <div className={`glass-panel p-8 rounded-3xl text-center max-w-sm w-full border animate-[bounce_0.5s_ease-out] ${
              outcomeBanner.isOut ? 'border-red-500/35 shadow-red-500/10 shadow-lg' : 'border-emerald-500/35 shadow-emerald-500/10 shadow-lg'
            }`}>
              <h2 className={`text-4xl font-black uppercase tracking-wider ${
                outcomeBanner.isOut ? 'text-red-500' : 'text-emerald-400'
              }`}>
                {outcomeBanner.text}
              </h2>
              <p className="text-slate-300 text-xs mt-2 font-medium">{outcomeBanner.subText}</p>
            </div>
          </div>
        )}

        {/* Opponent Hand Container */}
        <div className="flex flex-col items-center justify-center p-4 border border-slate-900 rounded-2xl md:h-full bg-slate-950/20">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-4">
            Opponent Hand
          </span>
          <RiggedHand
            pose={opponentHandPose}
            state={opponentHandState}
            facing="down"
            colorTheme="pink"
          />
          <span className="text-2xs text-slate-600 font-semibold mt-4">
            {opponentSubmitted && !outcomeBanner ? '✓ Choice Submitted' : 'Waiting...'}
          </span>
        </div>

        {/* Scoreboard and Timeline panel */}
        <div className="space-y-6 flex flex-col justify-center">
          <Scoreboard room={displayRoom} currentPlayerId={currentPlayerId} />
          <MatchTimeline room={displayRoom} currentPlayerId={currentPlayerId} />
        </div>

        {/* Player Hand Container */}
        <div className="flex flex-col items-center justify-center p-4 border border-slate-900 rounded-2xl md:h-full bg-slate-950/20">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-4">
            Your Hand
          </span>
          <RiggedHand
            pose={playerHandPose}
            state={playerHandState}
            facing="up"
            colorTheme="cyan"
          />
          <span className="text-2xs text-slate-600 font-semibold mt-4">
            {hasSubmitted && !outcomeBanner ? '✓ Choice Submitted' : 'Submit Move Below'}
          </span>
        </div>
      </div>

      {/* 3. Innings Transition Overlay Panel */}
      {showInningsTransition && (
        <div className="fixed inset-0 bg-darkBg/95 backdrop-blur-md z-40 flex flex-col items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full p-8 rounded-3xl text-center space-y-6 border border-neonCyan/25">
            <h2 className="text-3xl font-extrabold text-white">Innings Completed!</h2>
            <div className="py-4 px-6 bg-slate-950 rounded-2xl space-y-2 max-w-xs mx-auto text-sm border border-slate-900">
              <div className="flex justify-between text-slate-400">
                <span>Innings 1 Score:</span>
                <span className="font-bold text-white">{displayRoom.targetRuns! - 1} runs</span>
              </div>
              <div className="flex justify-between text-slate-400 border-t border-slate-900 pt-2 mt-2">
                <span className="text-neonCyan">Target to Win:</span>
                <span className="font-bold text-neonCyan">{displayRoom.targetRuns} runs</span>
              </div>
            </div>
            
            <p className="text-slate-400 text-xs">
              Roles are now swapped. The batter is now bowling, and the bowler is batting!
            </p>

            {mePlayer.isHost ? (
              <button
                onClick={handleNextInnings}
                className="w-full py-3 px-6 bg-gradient-to-r from-neonCyan to-neonBlue text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(0,240,255,0.2)] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Start 2nd Innings <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="py-3 px-4 bg-slate-900/50 rounded-xl border border-slate-800 text-slate-500 text-xs italic">
                Waiting for the host ({room.players.find((p) => p.isHost)?.nickname}) to start the 2nd innings...
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Choice Submission Buttons in footer */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 shadow-glass">
        <h3 className="text-center text-[10px] text-slate-400 uppercase tracking-widest font-extrabold mb-4">
          Select Your Number
        </h3>
        <div className="grid grid-cols-6 gap-2 sm:gap-4 max-w-lg mx-auto">
          {[1, 2, 3, 4, 5, 6].map((num) => {
            const isButtonSelected = mePlayer.currentChoice === num;
            return (
              <button
                key={num}
                disabled={hasSubmitted || outcomeBanner !== null || showInningsTransition}
                onClick={() => handleMoveSelection(num)}
                className={`aspect-square rounded-xl border font-black text-lg transition-all duration-300 flex items-center justify-center cursor-pointer ${
                  isButtonSelected
                    ? 'bg-neonCyan text-slate-950 border-neonCyan shadow-[0_0_15px_rgba(0,240,255,0.4)] scale-95'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-750 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                {num}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
