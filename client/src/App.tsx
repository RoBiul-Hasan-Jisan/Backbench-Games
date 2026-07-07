import React, { useState, useEffect } from 'react';
import { useSocket } from './hooks/useSocket';
import { useTimeSync } from './hooks/useTimeSync';
import { Landing } from './views/Landing';
import { Dashboard } from './views/Dashboard';
import { LobbyView } from './views/LobbyView';
import { Toss } from './views/Toss';
import { GameScreen } from './views/GameScreen';
import { Results } from './views/Results';
import { VsComputerGame } from './views/VsComputerGame';
import { TicTacToeGame } from './views/TicTacToeGame';
import { TicTacToeOnline } from './views/TicTacToeOnline';
import { ConnectionAlert } from './components/ConnectionAlert';
import { soundSynthesizer } from './utils/soundSynthesizer';
import { AlertCircle } from 'lucide-react';

type AppMode = 'menu' | 'online' | 'vsComputer' | 'ticTacToe' | 'ticTacToeOnline';

export const App: React.FC = () => {
  // Load persistent nickname & playerId from localStorage
  const [nickname, setNickname] = useState<string | null>(localStorage.getItem('hc_nickname'));
  const [playerId, setPlayerId] = useState<string | null>(localStorage.getItem('hc_player_id'));

  // Which top-level experience is active: the multiplayer dashboard/lobby flow,
  // the offline vs-computer hand cricket match, or the Tic Tac Toe arcade.
  const [appMode, setAppMode] = useState<AppMode>('menu');
  const [tttOnlineAction, setTttOnlineAction] = useState<'create' | 'join'>('create');

  const {
    socket,
    connectionState,
    room,
    error,
    setError,
    createRoom,
    joinRoom,
    setReady,
    startGame,
    submitTossGuess,
    submitTossDecision,
    submitMove,
    submitRematch,
    startSecondInnings,
    leaveRoom,
    resetRoomState,
  } = useSocket();

  // Synchronize client/server clocks
  const { getServerTime } = useTimeSync(socket);

  // Resume Web Audio Context on first user click/touch
  const handleInteraction = () => {
    soundSynthesizer.init();
  };

  useEffect(() => {
    // Add global listener to capture first interaction
    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  const handleSetupComplete = (newNickname: string, newPlayerId: string) => {
    setNickname(newNickname);
    setPlayerId(newPlayerId);
  };

  const handleNicknameChange = (newNickname: string) => {
    setNickname(newNickname);
  };

  const handleExit = () => {
    if (room && playerId) {
      leaveRoom(room.code, playerId).catch(() => {});
    }
    resetRoomState();
    setAppMode('menu');
  };

  // 1. Landing Screen (First Visit Setup)
  if (!nickname || !playerId) {
    return (
      <main className="min-h-screen bg-darkBg text-slate-100 flex flex-col justify-between py-6">
        <Landing onSetupComplete={handleSetupComplete} />
      </main>
    );
  }

  // 2. Render view based on Server-Authoritative State Machine
  const renderView = () => {
    if (appMode === 'vsComputer') {
      return <VsComputerGame nickname={nickname} onExit={() => setAppMode('menu')} />;
    }

    if (appMode === 'ticTacToe') {
      return <TicTacToeGame onExit={() => setAppMode('menu')} />;
    }

    if (appMode === 'ticTacToeOnline') {
      return (
        <TicTacToeOnline
          nickname={nickname}
          playerId={playerId}
          initialAction={tttOnlineAction}
          onExit={() => setAppMode('menu')}
        />
      );
    }

    if (!room) {
      return (
        <Dashboard
          nickname={nickname}
          playerId={playerId}
          onNicknameChange={handleNicknameChange}
          onCreateRoom={() => {
            setAppMode('online');
            createRoom(playerId, nickname);
          }}
          onJoinRoom={(code) => {
            setAppMode('online');
            joinRoom(code, playerId, nickname);
          }}
          onPlayVsComputer={() => setAppMode('vsComputer')}
          onPlayTicTacToe={() => setAppMode('ticTacToe')}
          onCreateTicTacToeRoom={() => {
            setTttOnlineAction('create');
            setAppMode('ticTacToeOnline');
          }}
          onJoinTicTacToeRoom={() => {
            setTttOnlineAction('join');
            setAppMode('ticTacToeOnline');
          }}
        />
      );
    }

    switch (room.status) {
      case 'WAITING':
      case 'LOBBY':
      case 'READY':
        return (
          <LobbyView
            room={room}
            currentPlayerId={playerId}
            onSetReady={(ready) => setReady(room.code, playerId, ready)}
            onStartGame={() => startGame(room.code, playerId)}
            onLeaveRoom={handleExit}
          />
        );
      case 'TOSS':
      case 'BAT_OR_BOWL':
        return (
          <Toss
            room={room}
            currentPlayerId={playerId}
            onSubmitTossGuess={(prediction) => submitTossGuess(room.code, playerId, prediction)}
            onSubmitTossDecision={(choice) => submitTossDecision(room.code, playerId, choice)}
          />
        );
      case 'FIRST_INNINGS':
      case 'SECOND_INNINGS':
      case 'CHANGE_INNINGS':
        return (
          <GameScreen
            room={room}
            currentPlayerId={playerId}
            socket={socket}
            getServerTime={getServerTime}
            onSubmitMove={(choice) => submitMove(room.code, playerId, choice)}
            onStartSecondInnings={() => startSecondInnings(room.code, playerId)}
          />
        );
      case 'RESULT':
      case 'REMATCH':
        return (
          <Results
            room={room}
            currentPlayerId={playerId}
            onPlayAgain={(accept) => submitRematch(room.code, playerId, accept)}
            onLeaveRoom={handleExit}
          />
        );
      default:
        return (
          <div className="text-center py-20 text-slate-400">
            Invalid State. Leaving room...
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-darkBg text-slate-100 flex flex-col justify-between py-4">
      {/* Global Navigation Header */}
      <header className="w-full max-w-5xl mx-auto px-4 flex justify-between items-center border-b border-slate-900 pb-3 mb-4">
        <div className="flex items-center gap-2 cursor-pointer select-none" onClick={handleExit}>
          <span className="text-lg font-black tracking-tighter bg-gradient-to-r from-neonCyan to-neonBlue bg-clip-text text-transparent">
            Backbench Games
          </span>
          <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 text-3xs font-extrabold text-slate-500 rounded">
            v1.0.0
          </span>
        </div>

        {/* Global Connection Badge */}
        <ConnectionAlert
          connectionState={connectionState}
          room={room}
          currentPlayerId={playerId}
          onExit={handleExit}
        />
      </header>

      {/* Main View Router */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4">
        {/* Active Error Alerts Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-between text-sm text-red-400 animate-shake">
            <span className="flex items-center gap-2 font-medium">
              <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
            </span>
            <button
              onClick={() => setError(null)}
              className="text-xs font-bold uppercase hover:text-white px-2 py-1 rounded cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {renderView()}
      </main>

      {/* Footer copyright */}
      <footer className="w-full text-center py-4 text-3xs text-slate-700 uppercase tracking-widest font-mono">
        © 2026 Backbench Games • All Rights Reserved.
      </footer>
    </div>
  );
};

export default App;
