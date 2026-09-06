'use client';

import React from 'react';
import {
  FileCheck2,
  Truck,
  CheckSquare,
  Activity,
  AlertOctagon,
  Clock,
} from 'lucide-react';
import Skeleton from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';

export interface AuditLogItem {
  eventId: string;
  ticketId: string;
  eventType: string;
  timestamp: string;
  actor: string;
  reason: string;
}

interface RecentActivityProps {
  events?: AuditLogItem[];
  loading?: boolean;
}

function formatRelativeTime(timestamp?: string): string {
  if (!timestamp) return 'Recently';
  try {
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  } catch {
    return 'Recently';
  }
}

export default function RecentActivity({ events = [], loading = false }: RecentActivityProps) {
  const getEventMeta = (eventType: string) => {
    switch (eventType) {
      case 'WORK_ORDER_CREATED':
        return {
          icon: FileCheck2,
          dotColor: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]',
          textColor: 'text-emerald-300',
          title: 'Work Order Dispatched',
        };
      case 'VEHICLE_SELECTED':
        return {
          icon: Truck,
          dotColor: 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]',
          textColor: 'text-cyan-300',
          title: 'Replacement Assigned',
        };
      case 'APPROVAL_RESOLVED':
      case 'APPROVAL_REQUESTED':
        return {
          icon: CheckSquare,
          dotColor: 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]',
          textColor: 'text-indigo-300',
          title: 'Approval Evaluated',
        };
      case 'RULE_EVALUATED':
        return {
          icon: Activity,
          dotColor: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]',
          textColor: 'text-amber-300',
          title: 'Rule Engine Evaluation',
        };
      default:
        return {
          icon: AlertOctagon,
          dotColor: 'bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]',
          textColor: 'text-violet-300',
          title: 'Ticket Ingested',
        };
    }
  };

  // formatRelativeTime is defined outside the component — see module scope below

  return (
    <div className="bg-[#0d1428]/70 border border-white/[0.08] rounded-2xl p-5 shadow-lg backdrop-blur-xl flex flex-col justify-between h-full">
      {/* Header */}
      <div className="pb-3 border-b border-slate-800/80 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight">Recent Activity</h2>
          <p className="text-xs text-slate-400">Autonomous audit &amp; dispatch events</p>
        </div>
        <Clock className="w-4 h-4 text-slate-400" />
      </div>

      {/* Activity Timeline */}
      <div className="my-4 flex-1">
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-6 h-6 rounded-full shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-2.5 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No activity recorded yet"
            description="Operational audit events will display chronologically once tickets or pipelines run."
            className="p-6"
          />
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-750">
            {events.slice(0, 5).map((evt, idx) => {
              const meta = getEventMeta(evt.eventType);

              return (
                <div key={evt.eventId || idx} className="relative group">
                  {/* Timeline Dot with subtle ring */}
                  <span
                    className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full ${meta.dotColor} ring-4 ring-[#080c18] transition-transform group-hover:scale-125`}
                  />

                  <div className="flex flex-col">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-200 leading-snug">
                        {meta.title}
                        {evt.ticketId && (
                          <span className="font-mono text-indigo-400 font-normal ml-1">
                            ({evt.ticketId})
                          </span>
                        )}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {formatRelativeTime(evt.timestamp)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                      {evt.reason || `Event recorded by ${evt.actor || 'system'}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span>Immutable Audit Ledger</span>
        <span className="font-mono text-indigo-400">P-07 Forensic Log</span>
      </div>
    </div>
  );
}
