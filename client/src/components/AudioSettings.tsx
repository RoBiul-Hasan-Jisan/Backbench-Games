import React, { useState } from 'react';
import { Volume2, VolumeX, Music, MessageCircle, Play } from 'lucide-react';
import { soundSynthesizer } from '../utils/soundSynthesizer';

export const AudioSettings: React.FC = () => {
  const [muted, setMuted] = useState<boolean>(soundSynthesizer.getMuted());
  const [uiVol, setUiVol] = useState<number>(soundSynthesizer.getVolume('ui'));
  const [gameVol, setGameVol] = useState<number>(soundSynthesizer.getVolume('game'));
  const [ambientVol, setAmbientVol] = useState<number>(soundSynthesizer.getVolume('ambient'));

  const handleMuteToggle = () => {
    const nextMute = !muted;
    soundSynthesizer.setMuted(nextMute);
    setMuted(nextMute);
    soundSynthesizer.playClick();
  };

  const handleVolumeChange = (category: 'ui' | 'game' | 'ambient', val: number) => {
    soundSynthesizer.setVolume(category, val);
    if (category === 'ui') setUiVol(val);
    if (category === 'game') setGameVol(val);
    if (category === 'ambient') {
      setAmbientVol(val);
      // Play/stop crowd based on volume
      if (val > 0) {
        soundSynthesizer.startAmbientCrowd();
      } else {
        soundSynthesizer.stopAmbientCrowd();
      }
    }
  };

  // Play test sound for feedback
  const triggerTestSound = (category: 'ui' | 'game') => {
    soundSynthesizer.init(); // Autoplay context resume
    if (category === 'ui') {
      soundSynthesizer.playClick();
    } else {
      soundSynthesizer.playTick();
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 shadow-glass space-y-5 border border-slate-700/20 max-w-sm w-full mx-auto">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
          Audio Settings
        </h3>
        <button
          onClick={handleMuteToggle}
          className={`p-2 rounded-xl border transition-all duration-300 cursor-pointer ${
            muted
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : 'bg-neonCyan/10 border-neonCyan/30 text-neonCyan shadow-neonCyan/5'
          }`}
          title={muted ? 'Unmute all' : 'Mute all'}
        >
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      <div className="space-y-4">
        {/* UI Volume Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 text-neonCyan" /> UI Interactions
            </span>
            <span className="text-slate-500 font-mono">{Math.round(uiVol * 100)}%</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={uiVol}
              onChange={(e) => handleVolumeChange('ui', parseFloat(e.target.value))}
              disabled={muted}
              className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-neonCyan disabled:opacity-30 disabled:cursor-not-allowed"
            />
            <button
              onClick={() => triggerTestSound('ui')}
              disabled={muted}
              className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700/40 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              Test
            </button>
          </div>
        </div>

        {/* Game Volume Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-neonPurple" /> Game Sound Effects
            </span>
            <span className="text-slate-500 font-mono">{Math.round(gameVol * 100)}%</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={gameVol}
              onChange={(e) => handleVolumeChange('game', parseFloat(e.target.value))}
              disabled={muted}
              className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-neonPurple disabled:opacity-30 disabled:cursor-not-allowed"
            />
            <button
              onClick={() => triggerTestSound('game')}
              disabled={muted}
              className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700/40 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              Test
            </button>
          </div>
        </div>

        {/* Ambient Volume Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-neonPink" /> Crowd Ambience
            </span>
            <span className="text-slate-500 font-mono">{Math.round(ambientVol * 100)}%</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={ambientVol}
              onChange={(e) => handleVolumeChange('ambient', parseFloat(e.target.value))}
              disabled={muted}
              className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-neonPink disabled:opacity-30 disabled:cursor-not-allowed"
            />
            {/* Start crowd murmur if playing */}
            <button
              onClick={() => {
                soundSynthesizer.init();
                soundSynthesizer.playCheer();
              }}
              disabled={muted || ambientVol === 0}
              className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700/40 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              Cheer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
