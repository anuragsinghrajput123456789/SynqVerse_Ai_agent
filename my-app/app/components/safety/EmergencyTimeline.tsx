'use client';

import React from 'react';
import { Clock, CheckCircle2, AlertOctagon, Radio, ShieldCheck, User } from 'lucide-react';
import { EmergencyTimelineEvent } from '@/lib/emergency/types';

interface EmergencyTimelineProps {
  timeline: EmergencyTimelineEvent[];
}

export default function EmergencyTimeline({ timeline }: EmergencyTimelineProps) {
  const getEventIcon = (status: string) => {
    switch (status) {
      case 'READY':
        return <Radio className="w-3.5 h-3.5 text-cyan-400" />;
      case 'ACTIVE':
        return <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />;
      case 'ACKNOWLEDGED':
        return <User className="w-3.5 h-3.5 text-indigo-400" />;
      case 'RESPONDING':
        return <Clock className="w-3.5 h-3.5 text-amber-400" />;
      case 'RESOLVED':
        return <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const formatTimestamp = (timeStr: string) => {
    try {
      return new Date(timeStr).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch {
      return timeStr;
    }
  };

  return (
    <div className="bg-[#0d1428]/70 border border-white/[0.08] rounded-2xl p-5 backdrop-blur-xl">
      <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white tracking-tight">
          Emergency Response Timeline
        </h3>
        <span className="text-[10px] font-mono text-slate-400">Forensic Chronology</span>
      </div>

      <div className="mt-4 relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-800">
        {timeline.map((item, idx) => (
          <div key={idx} className="relative group">
            {/* Timeline node */}
            <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
              {getEventIcon(item.status)}
            </div>

            <div className="flex flex-col">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  {item.status}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {formatTimestamp(item.timestamp)}
                </span>
              </div>

              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                {item.note || `Status updated to ${item.status}`}
              </p>

              <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                Actor: {item.actor}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
