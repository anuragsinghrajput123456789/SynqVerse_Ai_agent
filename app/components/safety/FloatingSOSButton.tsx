'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useEmergency } from '@/app/hooks/useEmergency';
import SOSHoldCircle from './SOSHoldCircle';
import SOSConfirmationModal from './SOSConfirmationModal';

function getNow(): number {
  return Date.now();
}

export default function FloatingSOSButton() {
  const { emergencies, triggerSOS } = useEmergency({ pollingIntervalMs: 6000 });

  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [isTriggered, setIsTriggered] = useState(false);
  const [triggeredEmergencyId, setTriggeredEmergencyId] = useState<string | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const HOLD_DURATION_MS = 3000; // 3 seconds

  // Check if any active emergency exists in system
  const activeEmergencies = emergencies.filter((e) => e.status === 'ACTIVE');
  const hasActiveSOS = activeEmergencies.length > 0;

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  const startHold = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (isSending || isTriggered) return;

    setIsHolding(true);
    setProgress(0);
    startTimeRef.current = getNow();

    // Smooth progress animation tick
    progressIntervalRef.current = setInterval(() => {
      const elapsed = getNow() - startTimeRef.current;
      const pct = Math.min(100, (elapsed / HOLD_DURATION_MS) * 100);
      setProgress(pct);

      if (elapsed >= HOLD_DURATION_MS) {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      }
    }, 40);

    // Trigger activation after exactly 3000ms
    holdTimerRef.current = setTimeout(() => {
      executeSOS();
    }, HOLD_DURATION_MS);
  };

  const cancelHold = () => {
    if (isTriggered) return;
    setIsHolding(false);
    setProgress(0);
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const executeSOS = async () => {
    setIsHolding(false);
    setIsSending(true);
    setProgress(100);

    // Haptic feedback if available
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200, 100, 400]);
      } catch {}
    }

    // Capture GPS or fallback
    let lat = 28.2045;
    let lng = 76.8320;
    let accuracy = 10;

    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 3000,
          });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
        accuracy = pos.coords.accuracy;
      } catch (err) {
        console.warn('GPS timed out or unavailable, using corridor telemetry fix', err);
      }
    }

    try {
      const res = await triggerSOS({
        driverId: 'DRV-014',
        vehicleRegistration: 'UP17GN7381',
        latitude: lat,
        longitude: lng,
        accuracyMeters: accuracy,
        emergencyType: 'CRITICAL_SOS',
        description: 'Instant 3-Second Pink Floating SOS Distress Triggered.',
      });

      if (res.success && res.emergency) {
        setIsTriggered(true);
        setTriggeredEmergencyId(res.emergency.id);
        setShowInfoModal(true);
      } else {
        setErrorMessage(res.error || 'Failed to dispatch SOS signal.');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* Floating Widget: Stacked right above the bottom-6 chat icon */}
      <div className="fixed bottom-24 right-6 z-40 flex items-center gap-3">
        {/* Hover Tooltip / Status Instruction */}
        <div className="hidden sm:block opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-slate-900/95 border border-pink-500/30 text-xs text-white px-3 py-1.5 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></span>
            <span>{isHolding ? 'Keep holding...' : 'Hold 3s for SOS'}</span>
          </div>
        </div>

        {/* The Pink Floating SOS Button */}
        <div className="relative select-none">
          {/* Progress Ring SVG Component */}
          <SOSHoldCircle isHolding={isHolding} progress={progress} />

          {/* Ambient Glow Aura */}
          <span
            className={`absolute -inset-2 rounded-full blur-lg transition-all pointer-events-none ${
              isHolding
                ? 'bg-pink-500 opacity-90 scale-125'
                : hasActiveSOS || isTriggered
                ? 'bg-rose-500 opacity-80 animate-pulse'
                : 'bg-gradient-to-tr from-pink-600 via-rose-500 to-fuchsia-600 opacity-40 hover:opacity-75'
            }`}
          />

          <button
            type="button"
            onMouseDown={startHold}
            onMouseUp={cancelHold}
            onMouseLeave={cancelHold}
            onTouchStart={startHold}
            onTouchEnd={cancelHold}
            onTouchCancel={cancelHold}
            onClick={() => {
              // If not holding for 3s, click opens info dialog
              if (!isHolding && !isTriggered) {
                setShowInfoModal(true);
              }
            }}
            aria-label="Driver SOS Distress Signal - Hold for 3 seconds"
            className={`group relative w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-150 cursor-pointer shadow-2xl ${
              isHolding
                ? 'scale-110 bg-pink-600 border-2 border-white'
                : isTriggered || hasActiveSOS
                ? 'bg-gradient-to-tr from-rose-600 to-pink-600 border border-white/40 animate-pulse shadow-pink-600/50'
                : 'bg-gradient-to-tr from-pink-500 via-rose-500 to-fuchsia-600 hover:scale-105 active:scale-95 border border-pink-300/40 shadow-pink-500/40'
            }`}
          >
            <div className="relative z-10 flex flex-col items-center justify-center text-white">
              {isSending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isTriggered || hasActiveSOS ? (
                <ShieldAlert className="w-6 h-6 text-white animate-bounce" />
              ) : (
                <div className="flex flex-col items-center leading-none">
                  <span className="text-[11px] font-black tracking-widest uppercase">SOS</span>
                  <span className="text-[8px] font-bold text-pink-100 opacity-90">
                    {isHolding ? `${Math.ceil((HOLD_DURATION_MS - (progress / 100) * HOLD_DURATION_MS) / 1000)}s` : '3s'}
                  </span>
                </div>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* SOS Info & Quick Trigger Modal Component */}
      <SOSConfirmationModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        isTriggered={isTriggered}
        triggeredEmergencyId={triggeredEmergencyId}
        errorMessage={errorMessage}
        isSending={isSending}
        onExecute={executeSOS}
      />
    </>
  );
}
