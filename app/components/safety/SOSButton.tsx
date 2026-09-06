'use client';

import React from 'react';
import { AlertOctagon, ShieldAlert } from 'lucide-react';

interface SOSButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  isActive?: boolean;
}

export default function SOSButton({
  onClick,
  disabled = false,
  loading = false,
  isActive = false,
}: SOSButtonProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 select-none">
      <div className="relative flex items-center justify-center">
        {/* Pulsing Emergency Ambient Rings */}
        <span
          className={`absolute -inset-4 rounded-full bg-rose-600/30 ${
            isActive ? 'animate-ping duration-1000' : 'animate-pulse'
          } pointer-events-none`}
        />
        <span className="absolute -inset-8 rounded-full bg-rose-600/15 animate-pulse duration-1500 pointer-events-none" />

        <button
          type="button"
          onClick={onClick}
          disabled={disabled || loading}
          aria-label="Emergency SOS"
          className={`relative z-10 w-44 h-44 sm:w-52 sm:h-52 rounded-full flex flex-col items-center justify-center transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-500/50 shadow-2xl active:scale-95 border-4 ${
            isActive
              ? 'bg-gradient-to-tr from-rose-700 via-rose-600 to-amber-600 border-white/40 shadow-[0_0_50px_rgba(244,63,94,0.6)] animate-pulse'
              : 'bg-gradient-to-tr from-rose-600 via-rose-500 to-rose-700 hover:from-rose-500 hover:to-rose-600 border-white/30 shadow-[0_0_40px_rgba(244,63,94,0.4)]'
          }`}
        >
          {/* Inner bezel */}
          <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full border border-white/20 flex flex-col items-center justify-center bg-black/10 backdrop-blur-xs">
            {isActive ? (
              <ShieldAlert className="w-10 h-10 text-white animate-bounce" />
            ) : (
              <AlertOctagon className="w-10 h-10 text-white" />
            )}
            <span className="text-3xl sm:text-4xl font-black text-white tracking-wider mt-1 font-mono">
              {loading ? 'SENDING' : isActive ? 'ACTIVE' : 'SOS'}
            </span>
            <span className="text-[10px] text-white/90 uppercase tracking-widest font-semibold mt-0.5">
              {isActive ? 'Help Dispatched' : 'Emergency Assist'}
            </span>
          </div>
        </button>
      </div>

      <p className="text-xs text-slate-400 mt-6 text-center max-w-xs leading-relaxed">
        {isActive
          ? 'Emergency request active. Operations team is currently coordinating response.'
          : 'Tap SOS in case of severe breakdown, collision, or medical emergency. Location is automatically shared.'}
      </p>
    </div>
  );
}
