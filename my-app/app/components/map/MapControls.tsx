'use client';

import React from 'react';

interface MapControlsProps {
  onCenterFleet: () => void;
  onFocusEmergency?: () => void;
  hasEmergencies: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  className?: string;
}

export default function MapControls({
  onCenterFleet,
  onFocusEmergency,
  hasEmergencies,
  theme,
  onToggleTheme,
  className = '',
}: MapControlsProps) {
  return (
    <div className={`flex items-center gap-2 bg-slate-900/90 backdrop-blur-xl border border-white/15 p-1.5 rounded-2xl shadow-xl ${className}`}>
      {/* Center Fleet */}
      <button
        onClick={onCenterFleet}
        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition"
        title="Reset map view to whole fleet"
      >
        <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
        <span>Reset Fleet</span>
      </button>

      {/* Focus Emergency */}
      {hasEmergencies && onFocusEmergency && (
        <button
          onClick={onFocusEmergency}
          className="px-3 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-rose-600/30 animate-pulse transition"
          title="Jump directly to active emergency"
        >
          <span className="w-2 h-2 rounded-full bg-white"></span>
          <span>Focus SOS</span>
        </button>
      )}

      {/* Theme Toggle (Dark / Voyager) */}
      <button
        onClick={onToggleTheme}
        className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
        title={theme === 'dark' ? 'Switch to Light Map Tiles' : 'Switch to Dark Map Tiles'}
      >
        {theme === 'dark' ? (
          <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>
    </div>
  );
}
