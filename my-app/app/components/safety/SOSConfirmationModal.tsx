'use client';

import React from 'react';
import Link from 'next/link';
import { X, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';

interface SOSConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isTriggered: boolean;
  triggeredEmergencyId: string | null;
  errorMessage: string | null;
  isSending: boolean;
  onExecute: () => void;
}

export default function SOSConfirmationModal({
  isOpen,
  onClose,
  isTriggered,
  triggeredEmergencyId,
  errorMessage,
  isSending,
  onExecute,
}: SOSConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-[#0e1529] border border-pink-500/40 rounded-3xl p-6 shadow-2xl shadow-pink-950/60 space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        {isTriggered ? (
          /* Success State */
          <div className="text-center space-y-3 pt-2">
            <div className="w-14 h-14 rounded-full bg-pink-500/20 border border-pink-500/50 text-pink-400 flex items-center justify-center mx-auto shadow-lg shadow-pink-500/30">
              <CheckCircle className="w-8 h-8 text-pink-400" />
            </div>
            <h3 className="text-lg font-black text-white">SOS Signal Dispatched!</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Operations command desk and nearest highway rescue team have been alerted with your live GPS location.
            </p>
            {triggeredEmergencyId && (
              <p className="text-xs font-mono font-bold text-pink-300 bg-pink-950/60 border border-pink-500/30 py-1.5 px-3 rounded-xl">
                Alert ID: {triggeredEmergencyId}
              </p>
            )}
            <div className="flex gap-2 pt-2">
              <Link
                href="/safety"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-pink-600/40 flex items-center justify-center gap-1.5 transition"
              >
                <span>View in Safety Center</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          /* Informational / Trigger Confirmation */
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-pink-600/30 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Driver Emergency SOS</h3>
                <p className="text-xs text-pink-300">3-Second Press &amp; Hold Action</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2 text-xs text-slate-300">
              <p>
                <strong className="text-white">How it works:</strong> Press and hold the floating pink icon for <strong className="text-pink-300">3 continuous seconds</strong> to transmit an instant distress call with live GPS coordinates.
              </p>
              <p className="text-[11px] text-slate-400">
                Designed for fast one-handed activation during roadside breakdowns, accidents, or medical distress.
              </p>
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs">
                {errorMessage}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={onExecute}
                disabled={isSending}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-bold shadow-lg shadow-pink-600/30 transition disabled:opacity-50"
              >
                {isSending ? 'Sending...' : 'Trigger Now'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
