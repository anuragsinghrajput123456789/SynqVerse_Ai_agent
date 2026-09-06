'use client';

import React from 'react';
import { AlertTriangle, MapPin, X } from 'lucide-react';
import Button from '../ui/Button';

interface SOSConfirmationProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

export default function SOSConfirmation({
  isOpen,
  onConfirm,
  onCancel,
  loading = false,
  latitude,
  longitude,
}: SOSConfirmationProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sos-confirm-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md bg-[#0d1428] border border-rose-500/40 rounded-3xl p-6 shadow-2xl shadow-rose-950/50 animate-in zoom-in-95 duration-150 relative">
        {/* Close */}
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          title="Cancel"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Warning Icon */}
        <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto shadow-inner">
          <AlertTriangle className="w-7 h-7 animate-pulse" />
        </div>

        <div className="text-center mt-4 space-y-2">
          <h2 id="sos-confirm-title" className="text-xl font-bold text-white tracking-tight">
            Trigger Emergency Assistance?
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed px-2">
            Are you sure you need emergency assistance? Your exact GPS location and vehicle status will be immediately broadcast to the Grafity operations dispatch console.
          </p>
        </div>

        {/* Location Preview Chip */}
        {latitude !== undefined && longitude !== undefined && latitude !== null && longitude !== null && (
          <div className="my-4 p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-center gap-2 text-xs font-mono text-cyan-300">
            <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              GPS: {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <Button
            variant="secondary"
            size="lg"
            onClick={onCancel}
            disabled={loading}
          >
            CANCEL
          </Button>

          <Button
            variant="danger"
            size="lg"
            onClick={onConfirm}
            loading={loading}
            className="bg-rose-600 hover:bg-rose-500 text-white font-bold tracking-wide shadow-lg shadow-rose-600/40"
          >
            SEND SOS
          </Button>
        </div>

        <p className="text-[10px] text-slate-500 text-center mt-4">
          For non-critical maintenance, please contact your dispatcher via regular chat.
        </p>
      </div>
    </div>
  );
}
