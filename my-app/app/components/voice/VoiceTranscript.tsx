'use client';

import React, { useState } from 'react';
import {
  Copy,
  Trash2,
  Check,
  FileText,
  ChevronDown,
  ChevronUp,
  User,
  Bot,
  ShieldCheck,
} from 'lucide-react';
import { TranscriptItem } from './useVoiceAgent';

export interface VoiceTranscriptProps {
  transcripts: TranscriptItem[];
  currentInterim?: string;
  onClear?: () => void;
  onCopy?: () => void;
  isOpen?: boolean;
  onToggleOpen?: () => void;
  className?: string;
}

export default function VoiceTranscript({
  transcripts,
  currentInterim,
  onClear,
  onCopy,
  isOpen = true,
  onToggleOpen,
  className = '',
}: VoiceTranscriptProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy?.();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const latestItem = transcripts[transcripts.length - 1];

  return (
    <div
      className={`rounded-2xl glass-panel border border-slate-800/80 transition-all duration-300 ${className}`}
    >
      {/* Transcript Header & Collapse Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/60">
        <button
          type="button"
          onClick={onToggleOpen}
          className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5 text-indigo-400" />
          <span>Transcript & Grounded Citations</span>
          {transcripts.length > 0 && (
            <span className="px-2 py-0.2 text-[10px] rounded-full bg-slate-800 text-slate-400 font-mono">
              {transcripts.length}
            </span>
          )}
          {onToggleOpen && (
            isOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          )}
        </button>

        <div className="flex items-center gap-2">
          {transcripts.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
                title="Copy conversation"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={onClear}
                className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                title="Clear transcript"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Expanded Conversation Stream */}
      {isOpen && (
        <div className="p-4 max-h-64 sm:max-h-72 overflow-y-auto space-y-3.5">
          {transcripts.length === 0 && !currentInterim ? (
            <div className="py-6 text-center text-xs text-slate-500">
              No conversation history yet. Speak or type to begin.
            </div>
          ) : (
            transcripts.map((t) => {
              const isUser = t.speaker === 'user';
              return (
                <div
                  key={t.id}
                  className={`p-3.5 rounded-2xl text-xs space-y-2 transition-all ${
                    isUser
                      ? 'bg-indigo-950/40 border border-indigo-800/40 text-indigo-100 ml-6'
                      : 'bg-slate-900/90 border border-slate-800/90 text-slate-200 mr-6 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
                    <div className="flex items-center gap-1.5">
                      {isUser ? (
                        <div className="w-4 h-4 rounded-full bg-indigo-600/30 flex items-center justify-center">
                          <User className="w-2.5 h-2.5 text-indigo-300" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-cyan-500/20 flex items-center justify-center">
                          <Bot className="w-2.5 h-2.5 text-cyan-400" />
                        </div>
                      )}
                      <span className="font-semibold text-slate-200">
                        {isUser ? 'YOU' : 'GRAFITY'}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-500">{t.timestamp}</span>
                  </div>

                  <p className="leading-relaxed font-sans text-slate-100 text-xs sm:text-[13px]">
                    {t.text}
                  </p>

                  {/* Grounded Source Citations */}
                  {!isUser && t.citations && t.citations.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-800/60">
                      <span className="text-[10px] text-slate-500 font-mono uppercase flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-cyan-400" />
                        <span>Sources:</span>
                      </span>
                      {t.citations.map((c, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 font-mono tracking-tight"
                        >
                          [{c}]
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Interim speech recognition preview */}
          {currentInterim && (
            <div className="p-3 rounded-2xl bg-indigo-950/30 border border-cyan-500/40 text-xs text-cyan-300 font-mono italic animate-pulse">
              &ldquo;{currentInterim}&rdquo;
            </div>
          )}
        </div>
      )}

      {/* Collapsed Preview when closed */}
      {!isOpen && latestItem && (
        <div className="px-4 py-2 text-xs text-slate-400 truncate flex items-center gap-2">
          <span className="font-semibold text-slate-300">
            {latestItem.speaker === 'user' ? 'You:' : 'Grafity:'}
          </span>
          <span className="truncate">{latestItem.text}</span>
        </div>
      )}
    </div>
  );
}
