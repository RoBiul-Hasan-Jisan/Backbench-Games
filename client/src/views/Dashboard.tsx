import React, { useState, useEffect } from 'react';
import { Play, Plus, Settings, User, Trophy, History, Edit3, X, Save, AlertTriangle, Bot, Grid3x3 } from 'lucide-react';
import { StatsManager } from '../utils/statsManager';
import type { PlayerStats, MatchHistoryItem } from '../utils/statsManager';
import { AudioSettings } from '../components/AudioSettings';
import { soundSynthesizer } from '../utils/soundSynthesizer';

const formatDate = (timestamp: number | string) => {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const getTargetFromMoves = (moves: any[]) => {
  if (!moves || moves.length === 0) return null;
  
  // The first move always contains the batter of the first innings
  const firstBatterId = moves[0].batterId;
  let firstInningsRuns = 0;
  for (const m of moves) {
    if (m.batterId === firstBatterId) {
      firstInningsRuns += m.runsAdded;
    }
    if (m.isOut && m.batterId === firstBatterId) {
      break;
    }
  }
  return firstInningsRuns + 1;
};

interface DashboardProps {
  nickname: string;
  playerId: string;
  onNicknameChange: (newNickname: string) => void;
  onCreateRoom: () => void;
  onJoinRoom: (roomCode: string) => void;
  onPlayVsComputer: () => void;
  onPlayTicTacToe: () => void;
  onCreateTicTacToeRoom: () => void;
  onJoinTicTacToeRoom: () => void;
}

// Allowed room code characters
const ALLOWED_CHARS = /^[A-Z2-9]*$/;

export const Dashboard: React.FC<DashboardProps> = ({
  nickname,
  playerId,
  onNicknameChange,
  onCreateRoom,
  onJoinRoom,
  onPlayVsComputer,
  onPlayTicTacToe,
  onCreateTicTacToeRoom,
  onJoinTicTacToeRoom,
}) => {
  const [stats, setStats] = useState<PlayerStats>(StatsManager.getStats());
  const [history, setHistory] = useState<MatchHistoryItem[]>(StatsManager.getMatchHistory());
  const [roomCodeInput, setRoomCodeInput] = useState<string>('');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [editNickname, setEditNickname] = useState<string>(nickname);
  const [isEditingNick, setIsEditingNick] = useState<boolean>(false);
  const [nickError, setNickError] = useState<string | null>(null);
  const [selectedHistoryMatch, setSelectedHistoryMatch] = useState<MatchHistoryItem | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [selectedGame, setSelectedGame] = useState<'cricket' | 'tictactoe'>('cricket');

  // Sync state on load
  useEffect(() => {
    setStats(StatsManager.getStats());
    setHistory(StatsManager.getMatchHistory());
    soundSynthesizer.init();
    // Start ambient crowd hum at current setting
    soundSynthesizer.startAmbientCrowd();
    return () => {
      soundSynthesizer.stopAmbientCrowd();
    };
  }, []);

  // Room input UX filtering
  const handleRoomCodeChange = (val: string) => {
    const uppercase = val.toUpperCase().replace(/\s/g, '');
    if (uppercase.length <= 6 && ALLOWED_CHARS.test(uppercase)) {
      setRoomCodeInput(uppercase);
      soundSynthesizer.playClick();
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCodeInput.length === 6) {
      soundSynthesizer.playClick();
      onJoinRoom(roomCodeInput);
    }
  };

  const handleSaveNickname = () => {
    const trimmed = editNickname.trim();
    if (!trimmed) {
      setNickError('Nickname cannot be empty!');
      return;
    }
    if (trimmed.length > 15) {
      setNickError('Max 15 characters allowed');
      return;
    }
    soundSynthesizer.playClick();
    localStorage.setItem('hc_nickname', trimmed);
    onNicknameChange(trimmed);
    setIsEditingNick(false);
    setNickError(null);
  };

  const handleResetStats = () => {
    soundSynthesizer.playClick();
    setShowResetConfirm(true);
  };

  const confirmResetStats = () => {
    soundSynthesizer.playClick();
    StatsManager.resetAll();
    setStats(StatsManager.getStats());
    setHistory(StatsManager.getMatchHistory());
    setShowResetConfirm(false);
    setShowSettings(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 p-4 relative">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-6 rounded-2xl relative overflow-hidden">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-neonCyan to-neonBlue flex items-center justify-center text-slate-950 shadow-neonCyan/20 shadow-md">
            <User className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            {isEditingNick ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editNickname}
                    onChange={(e) => setEditNickname(e.target.value)}
                    maxLength={15}
                    className="bg-slate-900 border border-slate-700 focus:border-neonCyan rounded px-2.5 py-1 text-sm outline-none text-white font-semibold"
                  />
                  <button
                    onClick={handleSaveNickname}
                    className="p-1.5 bg-neonCyan text-slate-950 rounded hover:opacity-90 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditNickname(nickname);
                      setIsEditingNick(false);
                      setNickError(null);
                    }}
                    className="p-1.5 bg-slate-800 text-slate-400 rounded hover:bg-slate-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {nickError && <span className="text-red-400 text-2xs">{nickError}</span>}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-wide">
                  Welcome, {nickname}!
                </h2>
                <button
                  onClick={() => {
                    setIsEditingNick(true);
                    soundSynthesizer.playClick();
                  }}
                  className="text-slate-400 hover:text-neonCyan p-1 rounded transition-colors cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            )}
            <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {playerId.slice(0, 8)}...</p>
          </div>
        </div>

        <button
          onClick={() => {
            setShowSettings(!showSettings);
            soundSynthesizer.playClick();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border cursor-pointer ${
            showSettings
              ? 'bg-neonCyan/10 border-neonCyan/40 text-neonCyan'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
          }`}
        >
          <Settings className="w-4 h-4" /> Settings
        </button>
      </div>

      {/* Settings Panel slideout */}
      {showSettings && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 animate-slide-down">
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Settings Panel</h3>
            <div className="space-y-3 glass-panel p-5 rounded-xl text-sm">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Edit Avatar Nickname</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editNickname}
                    onChange={(e) => setEditNickname(e.target.value)}
                    maxLength={15}
                    className="flex-1 bg-slate-950 border border-slate-800 focus:border-neonCyan rounded-lg px-3 py-2 text-sm text-white outline-none"
                  />
                  <button
                    onClick={handleSaveNickname}
                    className="px-4 py-2 bg-gradient-to-r from-neonCyan to-neonBlue text-slate-950 rounded-lg font-bold text-xs uppercase cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-850/80">
                <label className="text-xs text-red-550 font-bold uppercase tracking-wider block mb-2">Danger Zone</label>
                <button
                  onClick={handleResetStats}
                  className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 hover:border-red-500/50 rounded-xl font-bold text-xs uppercase cursor-pointer transition-colors shadow-[0_0_15px_rgba(239,68,68,0.05)]"
                >
                  Reset All Stats & History
                </button>
              </div>
            </div>
          </div>
          <AudioSettings />
        </div>
      )}

      {/* Ready to Play: Game Picker + Mode Actions */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-700/20 shadow-glass space-y-6 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-neonBlue/5 rounded-full blur-3xl"></div>

        <div>
          <h3 className="text-lg font-bold text-white tracking-wide mb-1">Ready to play?</h3>
          <p className="text-slate-400 text-xs">Pick your desk, then pick a way to play.</p>
        </div>

        {/* Game Picker */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => {
              soundSynthesizer.playClick();
              setSelectedGame('cricket');
            }}
            className={`p-4 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
              selectedGame === 'cricket'
                ? 'bg-neonCyan/10 border-neonCyan/50 text-white'
                : 'bg-slate-900/40 border-slate-800/60 text-slate-400 hover:border-slate-700'
            }`}
          >
            <span className="text-2xl">🏏</span>
            <div className="text-left">
              <div className="font-bold text-sm">Hand Cricket</div>
              <div className="text-3xs text-slate-500">The classic desk-side game</div>
            </div>
          </button>
          <button
            onClick={() => {
              soundSynthesizer.playClick();
              setSelectedGame('tictactoe');
            }}
            className={`p-4 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
              selectedGame === 'tictactoe'
                ? 'bg-neonPink/10 border-neonPink/50 text-white'
                : 'bg-slate-900/40 border-slate-800/60 text-slate-400 hover:border-slate-700'
            }`}
          >
            <Grid3x3 className="w-6 h-6" />
            <div className="text-left">
              <div className="font-bold text-sm">Tic Tac Toe</div>
              <div className="text-3xs text-slate-500">3×3, 5×5 or 8×8 desks</div>
            </div>
          </button>
        </div>

        {/* Mode Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Practice vs Computer */}
          <button
            onClick={() => {
              soundSynthesizer.playClick();
              if (selectedGame === 'cricket') onPlayVsComputer();
              else onPlayTicTacToe();
            }}
            className="p-5 rounded-2xl border border-slate-800/60 bg-slate-900/40 hover:border-neonCyan/40 transition-all text-left flex flex-col gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-neonCyan/10 border border-neonCyan/30 flex items-center justify-center text-neonCyan group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Practice vs Computer</h4>
              <p className="text-slate-500 text-2xs mt-0.5">No account, no waiting.</p>
            </div>
          </button>

          {/* Create Room */}
          <button
            onClick={() => {
              soundSynthesizer.playClick();
              if (selectedGame === 'cricket') onCreateRoom();
              else onCreateTicTacToeRoom();
            }}
            className="p-5 rounded-2xl border border-slate-800/60 bg-slate-900/40 hover:border-neonBlue/40 transition-all text-left flex flex-col gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-neonBlue/10 border border-neonBlue/30 flex items-center justify-center text-neonBlue group-hover:scale-105 transition-transform">
              <Plus className="w-5 h-5 stroke-[3]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Create Room</h4>
              <p className="text-slate-500 text-2xs mt-0.5">Get a code, invite a friend.</p>
            </div>
          </button>

          {/* Join Room */}
          {selectedGame === 'cricket' ? (
            <form
              onSubmit={handleJoin}
              className="p-5 rounded-2xl border border-slate-800/60 bg-slate-900/40 flex flex-col gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neonPink/10 border border-neonPink/30 flex items-center justify-center text-neonPink flex-shrink-0">
                  <Play className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Join Room</h4>
                  <p className="text-slate-500 text-2xs mt-0.5">Have a code already?</p>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={roomCodeInput}
                  onChange={(e) => handleRoomCodeChange(e.target.value)}
                  placeholder="CODE"
                  maxLength={6}
                  className="flex-1 min-w-0 text-center bg-slate-950 border border-slate-800 focus:border-neonPink focus:ring-1 focus:ring-neonPink/30 rounded-lg px-2 py-2 text-white placeholder-slate-800 uppercase tracking-widest text-xs font-black outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={roomCodeInput.length !== 6}
                  className="px-3 py-2 bg-gradient-to-r from-neonPink to-neonPurple text-white disabled:opacity-30 disabled:cursor-not-allowed font-bold text-2xs uppercase tracking-wider rounded-lg transition-all cursor-pointer flex-shrink-0"
                >
                  Go
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => {
                soundSynthesizer.playClick();
                onJoinTicTacToeRoom();
              }}
              className="p-5 rounded-2xl border border-slate-800/60 bg-slate-900/40 hover:border-neonPink/40 transition-all text-left flex flex-col gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-neonPink/10 border border-neonPink/30 flex items-center justify-center text-neonPink group-hover:scale-105 transition-transform">
                <Play className="w-4 h-4 fill-current" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Join Room</h4>
                <p className="text-slate-500 text-2xs mt-0.5">Have a code already?</p>
              </div>
            </button>
          )}
        </div>

        <div className="text-3xs text-slate-500 uppercase tracking-widest font-mono text-center sm:text-left border-t border-slate-800/40 pt-4">
          ⚠️ Matchmaking is restricted to private invite codes only.
        </div>
      </div>

      {/* Career Stats (Hand Cricket) */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-700/20 shadow-glass flex flex-col gap-4 relative overflow-hidden group">
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-neonPink/5 rounded-full blur-3xl"></div>

        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <Trophy className="w-5 h-5 text-neonCyan" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Career Stats &bull; Hand Cricket</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-850 flex flex-col justify-center">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">Matches</span>
            <span className="text-xl font-extrabold text-white mt-0.5">{stats.gamesPlayed}</span>
          </div>
          <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-850 flex flex-col justify-center">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">Win Rate</span>
            <span className="text-xl font-extrabold text-neonCyan mt-0.5">{stats.winRate}%</span>
          </div>
          <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-850 flex flex-col justify-center">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">Wins / Losses</span>
            <span className="text-sm font-bold text-white mt-0.5">
              {stats.wins}W / {stats.losses}L {stats.draws > 0 && `/ ${stats.draws}D`}
            </span>
          </div>
          <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-850 flex flex-col justify-center">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">Avg Runs</span>
            <span className="text-xl font-extrabold text-neonPurple mt-0.5">{stats.averageRuns}</span>
          </div>
          <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-850 flex flex-col justify-center">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">Scored / Conceded</span>
            <span className="text-xs font-bold text-slate-400 mt-0.5">
              🏏 {stats.runsScored} / 🥎 {stats.runsConceded}
            </span>
          </div>
          <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-850 flex flex-col justify-center">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">Highest (Chase)</span>
            <span className="text-xs font-bold text-white mt-0.5">
              {stats.highestScore} ({stats.highestChase || '--'})
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-850 flex items-center justify-between text-2xs text-slate-500 font-mono">
          <span>Streak: {stats.currentWinStreak}W (Best: {stats.bestWinStreak}W)</span>
          <span>
            {stats.lastPlayed ? `Last: ${formatDate(stats.lastPlayed)}` : 'No games played'}
          </span>
        </div>
      </div>

      {/* Match History Board */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-700/20 shadow-glass">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-800 mb-4">
          <History className="w-4.5 h-4.5 text-slate-400" />
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Match History</h3>
        </div>

        {history.length === 0 ? (
          <div className="text-center p-8 text-slate-600 text-sm">
            No matches recorded yet. Invite a friend and start playing!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-850 text-slate-500 text-2xs uppercase tracking-widest font-bold">
                  <th className="py-3 px-4">Result</th>
                  <th className="py-3 px-4">Opponent</th>
                  <th className="py-3 px-4 text-center">Score</th>
                  <th className="py-3 px-4 text-center">Target</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/50">
                {history.map((item, idx) => {
                  const m = item.metadata;
                  const isHost = m.hostName === nickname;
                  const myScore = isHost ? m.hostScore : m.guestScore;
                  const oppScore = isHost ? m.guestScore : m.hostScore;
                  const oppName = isHost ? m.guestName : m.hostName;

                  const isWin = m.winnerId === playerId;
                  const isLoss = m.winnerId !== null && m.winnerId !== playerId;

                  let resultBadge = (
                    <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded font-bold text-3xs uppercase">
                      Draw
                    </span>
                  );
                  if (isWin) {
                    resultBadge = (
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold text-3xs uppercase shadow-[0_0_10px_rgba(16,185,129,0.05)]">
                        Win
                      </span>
                    );
                  } else if (isLoss) {
                    resultBadge = (
                      <span className="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded font-bold text-3xs uppercase">
                        Loss
                      </span>
                    );
                  }

                  return (
                    <tr key={m.matchId || idx} className="hover:bg-slate-900/20 transition-colors">
                      <td className="py-3.5 px-4 font-semibold">{resultBadge}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-200">{oppName}</td>
                      <td className="py-3.5 px-4 text-center font-mono font-semibold">
                        {myScore} - {oppScore}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                        {getTargetFromMoves(item.moves) ?? '--'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs">
                        {formatDate(m.endTime)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedHistoryMatch(item);
                            soundSynthesizer.playClick();
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-2xs font-bold transition-colors cursor-pointer border border-slate-700/30"
                        >
                          View Logs
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* History Log Detail Modal */}
      {selectedHistoryMatch && (
        <div className="fixed inset-0 bg-darkBg/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full p-6 rounded-3xl border border-slate-700/20 flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-white text-base">Match Turn Logs</h3>
              <button
                onClick={() => {
                  setSelectedHistoryMatch(null);
                  soundSynthesizer.playClick();
                }}
                className="p-1 rounded bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {selectedHistoryMatch.moves.map((move) => {
                return (
                  <div
                    key={move.turnNumber}
                    className={`flex items-center justify-between p-3 rounded-xl text-xs border ${
                      move.isOut
                        ? 'bg-red-500/10 border-red-500/30 text-red-400'
                        : 'bg-slate-800/30 border-slate-850 text-slate-300'
                    }`}
                  >
                    <div className="font-medium">
                      <span className="font-mono text-2xs text-slate-500 bg-slate-950/60 px-1.5 py-0.5 rounded mr-2">
                        Ball {move.turnNumber}
                      </span>
                      {move.batterId === playerId ? 'You' : 'Opponent'} batted, {move.batterId !== playerId ? 'You' : 'Opponent'} bowled
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono bg-slate-950/40 px-2 py-0.5 rounded text-2xs">
                        {move.batterChoice} v {move.bowlerChoice}
                      </span>
                      <span className={`font-bold px-2 py-0.5 rounded-md ${move.isOut ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-300'}`}>
                        {move.isOut ? 'OUT' : `+${move.runsAdded}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Custom Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-red-500/20 rounded-3xl p-6 shadow-glass relative animate-scale-up">
            {/* Header */}
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">Reset Profile?</h3>
                <p className="text-3xs text-red-400/80 font-mono">DANGER ZONE</p>
              </div>
            </div>

            {/* Content */}
            <div className="text-xs text-slate-400 space-y-3 leading-relaxed mb-6">
              <p>
                Are you absolutely sure you want to reset all your stats and wipe your match history?
              </p>
              <p className="bg-red-500/5 border border-red-500/10 p-3 rounded-xl font-mono text-2xs text-red-300">
                This action is permanent and cannot be undone. All wins, losses, streak stats, and turn logs will be lost forever.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  soundSynthesizer.playClick();
                  setShowResetConfirm(false);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-bold text-xs uppercase cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmResetStats}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-550 text-white font-bold text-xs uppercase cursor-pointer transition-colors shadow-[0_0_15px_rgba(239,68,68,0.15)]"
              >
                Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
