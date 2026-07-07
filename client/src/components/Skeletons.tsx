import React from 'react';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-pulse p-4">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 glass-panel p-6 rounded-2xl">
        <div className="space-y-3 w-full md:w-1/3">
          <div className="h-7 w-48 bg-slate-700/50 rounded-lg"></div>
          <div className="h-4 w-32 bg-slate-800/50 rounded-md"></div>
        </div>
        <div className="h-10 w-24 bg-slate-700/50 rounded-lg"></div>
      </div>

      {/* Grid of Main Actions & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Actions panel */}
        <div className="md:col-span-2 glass-panel p-8 rounded-2xl space-y-6">
          <div className="h-6 w-36 bg-slate-700/50 rounded-md"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-28 bg-slate-800/40 rounded-xl border border-slate-700/30"></div>
            <div className="h-28 bg-slate-800/40 rounded-xl border border-slate-700/30"></div>
          </div>
        </div>

        {/* Quick Stats panel */}
        <div className="glass-panel p-8 rounded-2xl space-y-4">
          <div className="h-6 w-24 bg-slate-700/50 rounded-md"></div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <div className="h-4 w-16 bg-slate-800/50 rounded"></div>
              <div className="h-4 w-8 bg-slate-800/50 rounded"></div>
            </div>
            <div className="flex justify-between">
              <div className="h-4 w-20 bg-slate-800/50 rounded"></div>
              <div className="h-4 w-6 bg-slate-800/50 rounded"></div>
            </div>
            <div className="flex justify-between">
              <div className="h-4 w-24 bg-slate-800/50 rounded"></div>
              <div className="h-4 w-10 bg-slate-800/50 rounded"></div>
            </div>
            <div className="h-2 w-full bg-slate-800/40 rounded-full mt-4"></div>
          </div>
        </div>
      </div>

      {/* Match History list Skeleton */}
      <div className="glass-panel p-8 rounded-2xl space-y-4">
        <div className="h-6 w-32 bg-slate-700/50 rounded-md"></div>
        <div className="space-y-3">
          <div className="h-16 bg-slate-800/40 rounded-xl"></div>
          <div className="h-16 bg-slate-800/40 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
};

export const GameScreenSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto h-[90vh] flex flex-col justify-between p-4 animate-pulse">
      {/* Top area - opponent card */}
      <div className="flex justify-between items-center glass-panel p-4 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-700/50 rounded-full"></div>
          <div className="space-y-2">
            <div className="h-4 w-24 bg-slate-700/50 rounded"></div>
            <div className="h-3 w-16 bg-slate-800/50 rounded"></div>
          </div>
        </div>
        <div className="h-6 w-16 bg-slate-700/50 rounded"></div>
      </div>

      {/* Opponent hand skeleton */}
      <div className="flex justify-center my-4 opacity-30">
        <div className="w-24 h-36 bg-slate-800/40 rounded-xl border border-slate-700/30"></div>
      </div>

      {/* Center scoreboard */}
      <div className="glass-panel p-6 rounded-2xl text-center space-y-4 max-w-sm mx-auto w-full">
        <div className="h-4 w-24 bg-slate-800/50 rounded mx-auto"></div>
        <div className="h-12 w-32 bg-slate-700/50 rounded mx-auto"></div>
        <div className="h-3 w-40 bg-slate-800/50 rounded mx-auto"></div>
      </div>

      {/* Player hand skeleton */}
      <div className="flex justify-center my-4 opacity-30">
        <div className="w-24 h-36 bg-slate-800/40 rounded-xl border border-slate-700/30"></div>
      </div>

      {/* Bottom Area - Buttons */}
      <div className="glass-panel p-4 rounded-xl space-y-4">
        <div className="h-3 w-28 bg-slate-800/50 rounded mx-auto"></div>
        <div className="grid grid-cols-6 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square bg-slate-800/40 rounded-lg border border-slate-700/30 flex items-center justify-center"></div>
          ))}
        </div>
      </div>
    </div>
  );
};
