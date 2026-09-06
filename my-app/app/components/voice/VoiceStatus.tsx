'use client';

import React from 'react';
import { VoiceState } from '@/lib/voice';

export interface VoiceStatusProps {
  state: VoiceState;
  errorMessage?: string | null;
  formattedTimer?: string;
  thinkingStep?: string;
}

export default function VoiceStatus({
  state,
  errorMessage,
  formattedTimer = '00:00',
  thinkingStep = 'Analyzing operations context...',
}: VoiceStatusProps) {
  const isListening = state === 'LISTENING';

  const statusConfig: Record<VoiceState, { title: string; subtitle: string }> = {
    IDLE: {
      title: 'How can I help?',
      subtitle: 'Talk to Grafity about your operations.',
    },
    LISTENING: {
      title: 'Listening...',
      subtitle: 'Speak naturally.',
    },
    TRANSCRIBING: {
      title: 'Understanding you...',
      subtitle: 'Scrubbing boundary PII & analyzing speech stream...',
    },
    PROCESSING: {
      title: 'Analyzing operations context...',
      subtitle: thinkingStep,
    },
    GENERATING: {
      title: 'Formulating answer...',
      subtitle: 'Verifying citations against operational records...',
    },
    SPEAKING: {
      title: 'Grafity is speaking...',
      subtitle: 'Synthesizing verified answer with source grounding.',
    },
    ERROR: {
      title: 'Something went wrong.',
      subtitle: errorMessage || 'Microphone access is unavailable. Please try again or use text.',
    },
  };

  const current = statusConfig[state] || statusConfig.IDLE;

  return (
    <div className="text-center space-y-2 select-none">
      {/* Title with listening badge or timer */}
      <div className="flex items-center justify-center gap-3">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          {current.title}
        </h2>

        {isListening && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-xs shadow-[0_0_12px_rgba(6,182,212,0.3)]">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>{formattedTimer}</span>
          </div>
        )}
      </div>

      {/* Subtext */}
      <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
        {current.subtitle}
      </p>
    </div>
  );
}
