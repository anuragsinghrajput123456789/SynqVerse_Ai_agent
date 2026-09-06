'use client';

import React from 'react';
import { VoiceState } from '@/lib/voice';

export interface VoiceWaveformProps {
  state: VoiceState;
  audioLevel?: number; // 0.0 - 1.0
  barCount?: number;
  className?: string;
}

export default function VoiceWaveform({
  state,
  audioLevel = 0.2,
  barCount = 18,
  className = '',
}: VoiceWaveformProps) {
  const isListening = state === 'LISTENING';
  const isSpeaking = state === 'SPEAKING';
  const isTranscribing = state === 'TRANSCRIBING';
  const isActive = isListening || isSpeaking || isTranscribing;

  // Normalized symmetrical bell-curve height distribution for a sleek wave profile
  const baseMultipliers = [
    0.2, 0.35, 0.55, 0.75, 0.9, 1.0, 0.95, 0.8, 0.7, 0.8, 0.95, 1.0, 0.9, 0.75, 0.55, 0.35, 0.25, 0.2,
  ];

  return (
    <div
      className={`flex items-center justify-center gap-1 sm:gap-1.5 h-10 px-4 select-none ${className}`}
      aria-hidden="true"
    >
      {Array.from({ length: barCount }).map((_, i) => {
        const factor = baseMultipliers[i % baseMultipliers.length];
        // In active state, dynamic height between 8px and 38px
        const dynamicHeight = isActive
          ? Math.max(6, Math.min(38, Math.round(factor * (audioLevel * 36 + 8))))
          : 4;

        return (
          <span
            key={i}
            className={`w-1 sm:w-1.5 rounded-full transition-all duration-100 ease-out ${
              isActive
                ? 'bg-gradient-to-t from-indigo-500 via-cyan-400 to-violet-400 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                : 'bg-slate-800/80'
            }`}
            style={{
              height: `${dynamicHeight}px`,
              opacity: isActive ? 0.95 : 0.4,
            }}
          />
        );
      })}
    </div>
  );
}
