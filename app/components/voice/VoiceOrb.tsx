'use client';

import React from 'react';
import { Mic, AlertTriangle, Sparkles, Volume2 } from 'lucide-react';
import { VoiceState } from '@/lib/voice';

export interface VoiceOrbProps {
  state: VoiceState;
  audioLevel?: number; // 0.0 - 1.0
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
}

export default function VoiceOrb({
  state = 'IDLE',
  audioLevel = 0.2,
  onClick,
  size = 'hero',
  className = '',
}: VoiceOrbProps) {
  const sizeMap = {
    sm: {
      container: 'w-24 h-24',
      ambientGlow: 'w-32 h-32',
      outerRing: 'w-24 h-24',
      reactiveRing: 'w-20 h-20',
      core: 'w-16 h-16',
      icon: 'w-6 h-6',
      particles: 'w-24 h-24',
    },
    md: {
      container: 'w-44 h-44',
      ambientGlow: 'w-56 h-56',
      outerRing: 'w-44 h-44',
      reactiveRing: 'w-36 h-36',
      core: 'w-28 h-28',
      icon: 'w-8 h-8',
      particles: 'w-40 h-40',
    },
    lg: {
      container: 'w-56 h-56 sm:w-64 sm:h-64',
      ambientGlow: 'w-72 h-72 sm:w-80 sm:h-80',
      outerRing: 'w-56 h-56 sm:w-64 sm:h-64',
      reactiveRing: 'w-48 h-48 sm:w-56 sm:h-56',
      core: 'w-36 h-36 sm:w-44 sm:h-44',
      icon: 'w-10 h-10 sm:w-12 sm:h-12',
      particles: 'w-56 h-56 sm:w-64 sm:h-64',
    },
    hero: {
      container: 'w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80',
      ambientGlow: 'w-80 h-80 sm:w-96 sm:h-96 md:w-[420px] md:h-[420px]',
      outerRing: 'w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80',
      reactiveRing: 'w-52 h-52 sm:w-60 sm:h-60 md:w-68 md:h-68',
      core: 'w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56',
      icon: 'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16',
      particles: 'w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80',
    },
  };

  const currentSize = sizeMap[size];

  // Dynamic state attributes
  const isListening = state === 'LISTENING';
  const isThinking = state === 'PROCESSING' || state === 'GENERATING';
  const isSpeaking = state === 'SPEAKING';
  const isError = state === 'ERROR';

  // State visual configurations
  const stateTheme = {
    IDLE: {
      halo: 'bg-indigo-600/20 blur-3xl',
      outerRing: 'border-slate-800/80 border-dashed opacity-60',
      reactiveRing: 'border-indigo-900/40 opacity-40',
      coreGradient:
        'from-[#0c1229] via-[#1e1b4b] to-[#0f172a] border border-indigo-500/30 hover:border-cyan-400/80 hover:shadow-indigo-500/30',
      coreAnimation: 'animate-orb-breathe',
      iconClass: 'text-cyan-400/90 drop-shadow-[0_0_10px_rgba(6,182,212,0.4)]',
    },
    LISTENING: {
      halo: 'bg-gradient-to-tr from-cyan-500/35 via-indigo-600/35 to-violet-500/35 blur-3xl animate-pulse',
      outerRing: 'border-cyan-400/70 border-dashed animate-ring-slow',
      reactiveRing: 'border-violet-400/80 animate-ring-reverse',
      coreGradient:
        'from-violet-600 via-indigo-600 to-cyan-500 shadow-2xl shadow-cyan-500/40 border border-cyan-300/60 scale-105',
      coreAnimation: 'animate-orb',
      iconClass: 'text-white drop-shadow-[0_0_16px_rgba(255,255,255,0.95)]',
    },
    TRANSCRIBING: {
      halo: 'bg-cyan-500/30 blur-2xl',
      outerRing: 'border-cyan-400/80 border-dashed animate-spin',
      reactiveRing: 'border-indigo-400/60 animate-ring-reverse',
      coreGradient:
        'from-indigo-700 via-cyan-600 to-slate-900 border border-cyan-400/50',
      coreAnimation: 'animate-pulse',
      iconClass: 'text-cyan-200',
    },
    PROCESSING: {
      halo: 'bg-gradient-to-tr from-violet-600/35 via-fuchsia-600/25 to-cyan-500/30 blur-3xl animate-pulse',
      outerRing: 'border-violet-400/70 animate-ring-slow border-dashed',
      reactiveRing: 'border-cyan-400/70 animate-ring-reverse',
      coreGradient:
        'from-violet-900 via-indigo-950 to-slate-950 border border-violet-500/60 shadow-xl shadow-violet-600/20',
      coreAnimation: 'animate-orb-breathe',
      iconClass: 'text-violet-300',
    },
    GENERATING: {
      halo: 'bg-gradient-to-tr from-indigo-600/35 via-violet-600/30 to-blue-500/30 blur-3xl animate-pulse',
      outerRing: 'border-indigo-400/70 animate-ring-slow border-dashed',
      reactiveRing: 'border-cyan-400/70 animate-ring-reverse',
      coreGradient:
        'from-indigo-900 via-violet-950 to-slate-950 border border-indigo-500/60',
      coreAnimation: 'animate-orb-breathe',
      iconClass: 'text-indigo-300',
    },
    SPEAKING: {
      halo: 'bg-gradient-to-tr from-cyan-400/40 via-blue-600/40 to-indigo-600/40 blur-3xl animate-pulse',
      outerRing: 'border-cyan-400/90 animate-ring-slow',
      reactiveRing: 'border-blue-400/80 animate-ring-reverse',
      coreGradient:
        'from-blue-600 via-indigo-600 to-cyan-400 shadow-2xl shadow-indigo-500/50 border border-cyan-300/80',
      coreAnimation: 'animate-orb',
      iconClass: 'text-white drop-shadow-[0_0_16px_rgba(255,255,255,0.95)]',
    },
    ERROR: {
      halo: 'bg-rose-600/25 blur-2xl',
      outerRing: 'border-rose-500/40',
      reactiveRing: 'border-rose-600/60',
      coreGradient:
        'from-rose-950 via-slate-900 to-rose-900 border border-rose-500/50 shadow-lg shadow-rose-900/30',
      coreAnimation: '',
      iconClass: 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]',
    },
  };

  const current = stateTheme[state] || stateTheme.IDLE;

  // Compute audio reactive scale factor (1.0 to 1.25)
  const reactiveScale =
    isListening || isSpeaking
      ? 1 + Math.min(0.25, Math.max(0.04, audioLevel * 0.25))
      : 1;

  return (
    <div
      className={`relative flex items-center justify-center select-none ${currentSize.container} ${className}`}
      role="region"
      aria-label={`Voice Orb, state: ${state}`}
    >
      {/* 1. Outer Ambient Glow */}
      <div
        className={`absolute rounded-full pointer-events-none transition-all duration-700 ease-out ${currentSize.ambientGlow} ${current.halo}`}
      />

      {/* 2. Soft Rotating Outer Ring */}
      <div
        className={`absolute rounded-full border pointer-events-none transition-all duration-500 ${currentSize.outerRing} ${current.outerRing}`}
      />

      {/* 3. Audio-Reactive Ring */}
      <div
        className={`absolute rounded-full border pointer-events-none transition-transform duration-100 ease-out ${currentSize.reactiveRing} ${current.reactiveRing}`}
        style={{ transform: `scale(${reactiveScale})` }}
      />

      {/* 4. Orbiting Intelligence Particles during Thinking/Processing */}
      {isThinking && (
        <div
          className={`absolute rounded-full pointer-events-none animate-orbit ${currentSize.particles}`}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#06b6d4]" />
          <div className="absolute bottom-2 left-1/4 w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_#8b5cf6]" />
          <div className="absolute top-1/3 right-1 w-2 h-2 rounded-full bg-indigo-300 shadow-[0_0_8px_#a5b4fc]" />
        </div>
      )}

      {/* 5. Core Clickable Gradient Energy Sphere */}
      <button
        type="button"
        onClick={onClick}
        aria-label={
          isListening
            ? 'Stop listening'
            : isSpeaking
            ? 'Speaking... click to pause'
            : 'Start talking to Grafity'
        }
        className={`relative z-20 flex items-center justify-center rounded-full bg-gradient-to-tr transition-all duration-500 cursor-pointer ${currentSize.core} ${current.coreGradient} ${current.coreAnimation} focus:outline-none focus:ring-2 focus:ring-cyan-400/50`}
      >
        {/* Specular light highlight on the upper hemisphere */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-b from-white/20 via-transparent to-transparent pointer-events-none opacity-80" />

        {/* Center icon according to current state */}
        <div className="relative z-10 transition-transform duration-300 transform group-hover:scale-110">
          {isThinking ? (
            <Sparkles className={`${currentSize.icon} ${current.iconClass} animate-pulse`} />
          ) : isSpeaking ? (
            <Volume2 className={`${currentSize.icon} ${current.iconClass} animate-pulse`} />
          ) : isError ? (
            <AlertTriangle className={`${currentSize.icon} ${current.iconClass}`} />
          ) : (
            <Mic className={`${currentSize.icon} ${current.iconClass}`} />
          )}
        </div>
      </button>
    </div>
  );
}
