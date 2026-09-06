'use client';

import React from 'react';
import { Mic, MessageSquare } from 'lucide-react';
import { VoiceInteractionMode } from './useVoiceAgent';

export interface VoiceModeToggleProps {
  mode: VoiceInteractionMode;
  onChange: (mode: VoiceInteractionMode) => void;
  className?: string;
}

export default function VoiceModeToggle({
  mode,
  onChange,
  className = '',
}: VoiceModeToggleProps) {
  return (
    <div
      role="group"
      aria-label="Select conversation mode"
      className={`inline-flex items-center p-1 rounded-full bg-slate-900/90 border border-slate-800 shadow-inner ${className}`}
    >
      <button
        type="button"
        onClick={() => onChange('VOICE')}
        aria-pressed={mode === 'VOICE'}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
          mode === 'VOICE'
            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm shadow-indigo-600/40'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <Mic className="w-3 h-3" />
        <span>Voice</span>
      </button>

      <button
        type="button"
        onClick={() => onChange('CHAT')}
        aria-pressed={mode === 'CHAT'}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
          mode === 'CHAT'
            ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-sm shadow-cyan-600/40'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <MessageSquare className="w-3 h-3" />
        <span>Chat</span>
      </button>
    </div>
  );
}
