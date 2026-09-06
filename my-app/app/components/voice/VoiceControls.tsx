'use client';

import React, { useState } from 'react';
import {
  Mic,
  Square,
  Pause,
  RotateCcw,
  Send,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import { VoiceState } from '@/lib/voice';
import { SUGGESTED_PROMPTS, SuggestedPrompt } from './useVoiceAgent';

export interface VoiceControlsProps {
  state: VoiceState;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onReplay: () => void;
  onSendMessage: (msg: string) => void;
  onSelectPrompt?: (prompt: string) => void;
  showSuggestions?: boolean;
}

export default function VoiceControls({
  state,
  onStart,
  onStop,
  onPause,
  onReplay,
  onSendMessage,
  onSelectPrompt,
  showSuggestions = true,
}: VoiceControlsProps) {
  const [textInput, setTextInput] = useState('');

  const isListening = state === 'LISTENING';
  const isSpeaking = state === 'SPEAKING';
  const isError = state === 'ERROR';
  const isIdle = state === 'IDLE';

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    onSendMessage(textInput.trim());
    setTextInput('');
  };

  const handleChipClick = (promptText: string) => {
    if (onSelectPrompt) {
      onSelectPrompt(promptText);
    } else {
      onSendMessage(promptText);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-xl mx-auto">
      {/* 1. Contextual Action Buttons - strictly relevant to state */}
      <div className="flex items-center justify-center gap-3">
        {/* State: IDLE */}
        {isIdle && (
          <button
            onClick={onStart}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-600/30 hover:shadow-cyan-500/30 active:scale-95 transition-all cursor-pointer"
          >
            <Mic className="w-4 h-4" />
            <span>Start conversation</span>
          </button>
        )}

        {/* State: LISTENING -> [ Pause ] [ Stop ] */}
        {isListening && (
          <>
            <button
              onClick={onPause}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700/80 text-xs font-medium transition-colors cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
            <button
              onClick={onStop}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800 text-xs font-semibold transition-colors cursor-pointer shadow-sm shadow-rose-950"
            >
              <Square className="w-3.5 h-3.5 fill-rose-300" />
              <span>Stop</span>
            </button>
          </>
        )}

        {/* State: SPEAKING -> [ Pause ] [ Replay ] [ Stop ] */}
        {isSpeaking && (
          <>
            <button
              onClick={onPause}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700/80 text-xs font-medium transition-colors cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
            <button
              onClick={onReplay}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 border border-indigo-800 text-xs font-medium transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Replay</span>
            </button>
            <button
              onClick={onStop}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/80 text-xs font-medium transition-colors cursor-pointer"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Stop</span>
            </button>
          </>
        )}

        {/* State: ERROR -> [ Try again ] [ Use text instead ] */}
        {isError && (
          <>
            <button
              onClick={onStart}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Try again</span>
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('voice-text-fallback');
                el?.focus();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Use text instead</span>
            </button>
          </>
        )}
      </div>

      {/* 2. Suggested Prompt Chips (Displayed when IDLE) */}
      {isIdle && showSuggestions && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">
            Suggested Operational Queries
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {SUGGESTED_PROMPTS.slice(0, 5).map((p: SuggestedPrompt) => (
              <button
                key={p.id}
                onClick={() => handleChipClick(p.label)}
                className="text-xs px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-indigo-950/70 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-white transition-all cursor-pointer shadow-xs active:scale-95"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Bottom Interaction Area: Integrated conversational text fallback */}
      <form
        onSubmit={handleTextSubmit}
        className="relative flex items-center bg-slate-950/80 border border-slate-800/90 hover:border-slate-700 focus-within:border-indigo-500/80 rounded-2xl p-1.5 shadow-xl transition-all"
      >
        <button
          type="button"
          onClick={isListening ? onStop : onStart}
          aria-label={isListening ? 'Stop listening' : 'Start voice input'}
          className={`p-2.5 rounded-xl transition-colors cursor-pointer ${
            isListening
              ? 'text-cyan-400 bg-cyan-950/60 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Mic className="w-4 h-4" />
        </button>

        <input
          id="voice-text-fallback"
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Or type a message..."
          className="flex-1 px-3 py-2 bg-transparent text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
        />

        <button
          type="submit"
          disabled={!textInput.trim()}
          aria-label="Send message"
          className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-900 text-white disabled:text-slate-600 transition-all cursor-pointer disabled:cursor-not-allowed"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
