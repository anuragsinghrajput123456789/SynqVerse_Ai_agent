'use client';

import React, { useState } from 'react';
import { Maximize2, Minimize2, X, Volume2, VolumeX, ShieldCheck, Zap } from 'lucide-react';
import VoiceOrb from './VoiceOrb';
import VoiceWaveform from './VoiceWaveform';
import VoiceLanguageSelector from './VoiceLanguageSelector';
import VoiceStatus from './VoiceStatus';
import VoiceControls from './VoiceControls';
import VoiceTranscript from './VoiceTranscript';
import VoiceModeToggle from './VoiceModeToggle';
import VoicePermission from './VoicePermission';
import { useVoiceAgent } from './useVoiceAgent';

export interface VoiceAgentProps {
  isFullScreen?: boolean;
  onClose?: () => void;
  className?: string;
}

export default function VoiceAgent({
  isFullScreen = false,
  onClose,
  className = '',
}: VoiceAgentProps) {
  const {
    voiceState,
    mode,
    setMode,
    language,
    setLanguage,
    currentTranscript,
    transcripts,
    audioLevel,
    errorMessage,
    isMuted,
    permissionState,
    showPermissionPrompt,
    setShowPermissionPrompt,
    requestMicrophonePermission,
    formattedTimer,
    thinkingStep,
    startListening,
    stopListening,
    pause,
    toggleMute,
    sendTextMessage,
    clearTranscript,
    copyTranscript,
    replayLastResponse,
  } = useVoiceAgent();

  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [isBrowserFullScreen, setIsBrowserFullScreen] = useState(false);

  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsBrowserFullScreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsBrowserFullScreen(false);
    }
  };

  const handleOrbClick = () => {
    if (voiceState === 'LISTENING') {
      stopListening();
    } else if (voiceState === 'SPEAKING') {
      pause();
    } else {
      startListening();
    }
  };

  return (
    <div
      className={`relative w-full rounded-3xl bg-[#080d1e]/90 border border-indigo-500/20 shadow-2xl backdrop-blur-2xl flex flex-col justify-between overflow-hidden transition-all duration-300 ${
        isFullScreen ? 'min-h-[720px] p-6 sm:p-10' : 'min-h-[560px] p-5 sm:p-7'
      } ${className}`}
    >
      {/* Subtle background ambient radial light field */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-violet-600/10 via-indigo-600/10 to-cyan-500/10 blur-[100px] pointer-events-none" />

      {/* 1. Top Minimal Bar */}
      <div className="relative z-10 flex items-center justify-between gap-2 pb-4 border-b border-slate-800/80">
        {/* Left: Brand / Voice Identity */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 p-0.5 flex items-center justify-center shadow-md shadow-indigo-600/30">
            <div className="w-full h-full bg-[#070a13] rounded-[10px] flex items-center justify-center">
              <Zap className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-extrabold tracking-wider text-white">
                GRAFITY
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
                VOICE
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono tracking-tight hidden sm:block">
              INTELLIGENCE IN MOTION
            </p>
          </div>
        </div>

        {/* Center/Right: Language Selector & Mode Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          <VoiceLanguageSelector value={language} onChange={setLanguage} />

          <VoiceModeToggle mode={mode} onChange={setMode} />

          {/* Mute toggle button */}
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute voice output' : 'Mute voice output'}
            className={`p-2 rounded-full border transition-colors cursor-pointer ${
              isMuted
                ? 'bg-amber-950/80 text-amber-300 border-amber-800/80'
                : 'bg-slate-900/90 text-slate-400 hover:text-white border-slate-800'
            }`}
            title={isMuted ? 'Unmute audio' : 'Mute audio'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleBrowserFullscreen}
            className="p-2 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
            title={isBrowserFullScreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            aria-label="Toggle fullscreen"
          >
            {isBrowserFullScreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Close trigger if rendered inside a modal/drawer */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-slate-900/90 hover:bg-rose-950/80 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-800 transition-colors cursor-pointer"
              aria-label="Close voice console"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Content Area: Smooth switch between VOICE and CHAT mode */}
      <div className="relative z-10 flex-1 flex flex-col justify-center py-6 sm:py-8">
        {mode === 'VOICE' ? (
          /* ================= VOICE MODE (Orb-Centric Hero) ================= */
          <div className="flex flex-col items-center justify-center space-y-6 sm:space-y-8 animate-in fade-in zoom-in-95 duration-300">
            {/* Centerpiece Hero Voice Orb */}
            <div className="py-2">
              <VoiceOrb
                state={voiceState}
                audioLevel={audioLevel}
                size={isFullScreen ? 'hero' : 'lg'}
                onClick={handleOrbClick}
              />
            </div>

            {/* Subtle Thin Audio Waveform */}
            <VoiceWaveform state={voiceState} audioLevel={audioLevel} barCount={18} />

            {/* Contextual Status & Subtitle */}
            <VoiceStatus
              state={voiceState}
              errorMessage={errorMessage}
              formattedTimer={formattedTimer}
              thinkingStep={thinkingStep}
            />

            {/* Contextual State Controls & Suggested Prompts */}
            <VoiceControls
              state={voiceState}
              onStart={startListening}
              onStop={stopListening}
              onPause={pause}
              onReplay={replayLastResponse}
              onSendMessage={sendTextMessage}
              onSelectPrompt={(p) => sendTextMessage(p)}
              showSuggestions={voiceState === 'IDLE'}
            />

            {/* Collapsible Transcript Drawer Trigger */}
            <div className="w-full max-w-xl pt-2">
              <VoiceTranscript
                transcripts={transcripts}
                currentInterim={currentTranscript}
                onClear={clearTranscript}
                onCopy={copyTranscript}
                isOpen={transcriptOpen}
                onToggleOpen={() => setTranscriptOpen(!transcriptOpen)}
              />
            </div>
          </div>
        ) : (
          /* ================= CHAT MODE (Conversation-Centric Feed) ================= */
          <div className="flex-1 flex flex-col justify-between max-w-2xl mx-auto w-full space-y-4 animate-in fade-in duration-300">
            {/* Top Compact Orb Status Indicator */}
            <div className="flex items-center justify-between px-4 py-2 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center gap-3">
                <VoiceOrb state={voiceState} audioLevel={audioLevel} size="sm" onClick={handleOrbClick} />
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Grafity Operations Intelligence</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {voiceState === 'LISTENING' ? `Listening (${formattedTimer})...` : thinkingStep}
                  </p>
                </div>
              </div>
              <VoiceWaveform state={voiceState} audioLevel={audioLevel} barCount={10} />
            </div>

            {/* Full Conversation Feed */}
            <div className="flex-1 min-h-[360px] max-h-[440px] overflow-y-auto p-2 space-y-3.5">
              {transcripts.map((t) => {
                const isUser = t.speaker === 'user';
                return (
                  <div
                    key={t.id}
                    className={`p-4 rounded-2xl text-xs space-y-2 max-w-[85%] ${
                      isUser
                        ? 'ml-auto bg-gradient-to-r from-indigo-900/60 to-violet-900/60 border border-indigo-700/50 text-indigo-50 shadow-md'
                        : 'mr-auto bg-slate-900/90 border border-slate-800 text-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span className="font-semibold text-slate-300">
                        {isUser ? 'YOU' : 'GRAFITY'}
                      </span>
                      <span>{t.timestamp}</span>
                    </div>

                    <p className="text-sm leading-relaxed text-slate-100">{t.text}</p>

                    {/* Grounded Citation Chips */}
                    {!isUser && t.citations && t.citations.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80">
                        <span className="text-[10px] text-slate-500 font-mono uppercase flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-cyan-400" />
                          <span>Sources:</span>
                        </span>
                        {t.citations.map((c, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-mono"
                          >
                            [{c}]
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {currentTranscript && (
                <div className="ml-auto p-3.5 rounded-2xl bg-indigo-950/40 border border-cyan-500/40 text-xs text-cyan-300 font-mono italic animate-pulse">
                  &ldquo;{currentTranscript}&rdquo;
                </div>
              )}
            </div>

            {/* Bottom Input Area */}
            <VoiceControls
              state={voiceState}
              onStart={startListening}
              onStop={stopListening}
              onPause={pause}
              onReplay={replayLastResponse}
              onSendMessage={sendTextMessage}
              showSuggestions={false}
            />
          </div>
        )}
      </div>

      {/* 3. Bottom Security & Grounding Label */}
      <div className="relative z-10 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
        <span>Deterministic Rule Engine • Zero Hallucination Pipeline</span>
        <span className="text-slate-400">PII Masking Active</span>
      </div>

      {/* 4. Microphone Permission Request / Denied Modal */}
      {showPermissionPrompt && (
        <VoicePermission
          permissionState={permissionState === 'granted' ? 'prompt' : permissionState}
          onRequestPermission={requestMicrophonePermission}
          onUseTextFallback={() => {
            setShowPermissionPrompt(false);
            const el = document.getElementById('voice-text-fallback');
            el?.focus();
          }}
          onDismiss={() => setShowPermissionPrompt(false)}
        />
      )}
    </div>
  );
}
