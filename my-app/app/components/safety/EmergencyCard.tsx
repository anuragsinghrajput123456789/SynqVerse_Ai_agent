'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  MapPin,
  Clock,
  Truck,
  User,
  ExternalLink,
  Navigation,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { EmergencyEvent } from '@/lib/emergency/types';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

interface EmergencyCardProps {
  emergency: EmergencyEvent;
  onAcknowledge?: (id: string) => void;
  onResolve?: (id: string) => void;
  isLoading?: boolean;
}

function formatTimeAgo(dateStr: string): string {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  } catch {
    return 'Recently';
  }
}

export default function EmergencyCard({
  emergency,
  onAcknowledge,
  onResolve,
}: EmergencyCardProps) {
  // formatTimeAgo is defined at module scope above

  const isResolved = emergency.status === 'RESOLVED';
  const isAcknowledged = emergency.status === 'ACKNOWLEDGED' || emergency.status === 'RESPONDING';

  return (
    <div
      className={`rounded-2xl p-5 border transition-all duration-200 backdrop-blur-xl ${
        isResolved
          ? 'bg-[#0d1428]/60 border-slate-800'
          : 'bg-[#160d1d]/85 border-rose-500/40 shadow-xl shadow-rose-950/20 hover:border-rose-400'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isResolved
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/20 text-rose-400 animate-pulse'
            }`}
          >
            {isResolved ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-white text-sm">{emergency.id}</span>
              <Badge variant={isResolved ? 'success' : 'critical'} size="sm">
                {emergency.status}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">{emergency.emergencyType}</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            {formatTimeAgo(emergency.triggeredAt)}
          </span>
          <span className="text-[10px] font-bold font-mono text-rose-400 block mt-0.5">
            P-0 CRITICAL
          </span>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3 my-4 text-xs">
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Driver</span>
          <div className="flex items-center gap-1.5 mt-0.5 font-semibold text-slate-200">
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <span className="truncate">{emergency.driverName}</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">{emergency.driverId}</span>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Vehicle</span>
          <div className="flex items-center gap-1.5 mt-0.5 font-semibold text-slate-200 font-mono">
            <Truck className="w-3.5 h-3.5 text-cyan-400" />
            <span>{emergency.vehicleRegistration}</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">{emergency.vehicleId}</span>
        </div>

        <div className="col-span-2 pt-2 border-t border-white/[0.05]">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">GPS Location</span>
          <div className="flex items-center gap-1.5 mt-0.5 text-cyan-300 font-mono">
            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="truncate">
              {emergency.locationName || `${emergency.latitude.toFixed(4)}, ${emergency.longitude.toFixed(4)}`}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/[0.08]">
        <div className="flex items-center gap-2">
          <Link href={`/emergency/${emergency.id}`}>
            <Button variant="secondary" size="xs" icon={<ExternalLink className="w-3 h-3" />}>
              View Detail
            </Button>
          </Link>

          <Link href={`/map?driverId=${emergency.driverId}`}>
            <Button variant="outline" size="xs" icon={<Navigation className="w-3 h-3 text-cyan-400" />}>
              Track on Map
            </Button>
          </Link>
        </div>

        {!isResolved && (
          <div className="flex items-center gap-1.5">
            {!isAcknowledged && onAcknowledge && (
              <Button
                variant="secondary"
                size="xs"
                onClick={() => onAcknowledge(emergency.id)}
                className="bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border-indigo-500/40"
              >
                Acknowledge
              </Button>
            )}

            {onResolve && (
              <Button
                variant="success"
                size="xs"
                onClick={() => onResolve(emergency.id)}
                icon={<ShieldCheck className="w-3 h-3" />}
              >
                Resolve
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
