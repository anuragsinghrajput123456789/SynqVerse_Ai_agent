'use client';

import React from 'react';
import { Mic, AlertCircle, X, MessageSquare } from 'lucide-react';

export interface VoicePermissionProps {
  permissionState: 'prompt' | 'denied' | 'unsupported';
  onRequestPermission: () => void;
  onUseTextFallback: () => void;
  onDismiss: () => void;
}

export default function VoicePermission({
  permissionState,
  onRequestPermission,
  onUseTextFallback,
  onDismiss,
}: VoicePermissionProps) {
  const isDenied = permissionState === 'denied';
  const isUnsupported = permissionState === 'unsupported';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0c1224] border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-200">
        {/* Close trigger */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-850 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-600/20">
          {isDenied ? (
            <AlertCircle className="w-8 h-8 text-rose-400" />
          ) : (
            <Mic className="w-8 h-8 text-cyan-400 animate-pulse" />
          )}
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white tracking-tight">
            {isDenied
              ? 'Microphone access is unavailable'
              : isUnsupported
              ? 'Voice input unsupported in this browser'
              : 'Microphone access is required'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
            {isDenied
              ? 'Please grant microphone access in your browser site settings to speak with Grafity.'
              : isUnsupported
              ? 'Your current browser does not expose Web Speech API. You can still use keyboard text input.'
              : 'Allow microphone access to talk directly to Grafity Voice and control fleet operations.'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {!isUnsupported && (
            <button
              onClick={onRequestPermission}
              className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              {isDenied ? 'Try again' : 'Enable microphone'}
            </button>
          )}

          <button
            onClick={onUseTextFallback}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs sm:text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Use text instead</span>
          </button>
        </div>
      </div>
    </div>
  );
}
