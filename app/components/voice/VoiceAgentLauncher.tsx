'use client';

import React, { useState, useEffect } from 'react';
import { Mic, X } from 'lucide-react';
import VoiceAgent from './VoiceAgent';

export default function VoiceAgentLauncher() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Keyboard shortcut: Press 'v' or 'Ctrl+Space' to trigger voice
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid triggering when user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === 'v' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Toggle voice modal
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isMounted) return null;

  return (
    <>
      {/* Global Floating Voice Launcher Button */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
        {/* Sleek Tooltip on hover */}
        <div className="hidden sm:block opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity bg-slate-900/90 border border-slate-700/80 text-xs text-white px-3 py-1.5 rounded-xl shadow-xl font-medium pointer-events-none backdrop-blur-md">
          Talk to Grafity <span className="text-[10px] text-indigo-400 font-mono ml-1">(V)</span>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Talk to Grafity Voice Agent"
          className="group relative p-4 rounded-full bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-xl shadow-indigo-600/40 hover:shadow-cyan-400/40 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer border border-white/20"
        >
          {/* Subtle ambient breathing glow ring */}
          <span className="absolute -inset-1 rounded-full bg-gradient-to-tr from-violet-600 to-cyan-400 opacity-40 blur-md group-hover:opacity-75 transition-opacity pointer-events-none" />

          <span className="relative z-10 flex items-center justify-center">
            {isOpen ? <X className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </span>
        </button>
      </div>

      {/* Full conversational modal / drawer */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Grafity Voice Assistant"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
        >
          {/* Modal Container: Fullscreen on mobile, elegant floating console on desktop */}
          <div className="w-full sm:max-w-3xl h-full sm:h-auto max-h-[92vh] bg-[#070a13] border sm:border border-slate-800 sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 relative flex flex-col">
            <VoiceAgent isFullScreen={false} onClose={() => setIsOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
