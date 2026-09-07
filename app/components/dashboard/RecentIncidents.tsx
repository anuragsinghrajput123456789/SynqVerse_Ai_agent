'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, AlertOctagon } from 'lucide-react';
import Badge, { BadgeVariant } from '../ui/Badge';
import Skeleton from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';

export interface TicketSummary {
  ticketId: string;
  vehicle: string;
  client: string;
  issue: string;
  severity: string;
  status: string;
  action: string | null;
  replacementVehicle: string | null;
  createdAt: string;
}

interface RecentIncidentsProps {
  tickets?: TicketSummary[];
  loading?: boolean;
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'Recently';
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
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

export default function RecentIncidents({ tickets = [], loading = false }: RecentIncidentsProps) {
  const getSeverityBadgeVariant = (severity: string): BadgeVariant => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
        return 'critical';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
        return 'cyan';
      default:
        return 'neutral';
    }
  };

  const getStatusBadgeVariant = (status: string): BadgeVariant => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
      case 'RESOLVED':
        return 'success';
      case 'QUARANTINED':
        return 'critical';
      case 'DUPLICATE':
        return 'warning';
      case 'PROCESSING':
      case 'IN_PROGRESS':
        return 'purple';
      default:
        return 'neutral';
    }
  };

  // formatRelativeTime is defined at module scope above

  return (
    <div className="cyber-card rounded-2xl overflow-hidden flex flex-col justify-between">
      {/* Table Header */}
      <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>Recent Incident Triage</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Live Queue
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Automated breakdown triage &amp; deterministic dispatch decisions
          </p>
        </div>

        <Link
          href="/tickets"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <EmptyState
            icon={AlertOctagon}
            title="No active incidents"
            description="All breakdown tickets have been processed or resolved. Run the pipeline to ingest new test batches."
          />
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b1020]/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800/80 text-[11px]">
              <tr>
                <th className="px-5 py-3 font-mono">Ticket</th>
                <th className="px-5 py-3 font-mono">Vehicle</th>
                <th className="px-5 py-3">Severity</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Time</th>
                <th className="px-5 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tickets.slice(0, 6).map((t) => (
                <tr key={t.ticketId} className="hover:bg-white/[0.04] transition-colors">
                  <td className="px-5 py-3 font-mono font-bold text-indigo-400">
                    {t.ticketId}
                  </td>
                  <td className="px-5 py-3 font-mono font-semibold text-slate-200">
                    {t.vehicle}
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={getSeverityBadgeVariant(t.severity)} size="sm">
                      {t.severity}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={getStatusBadgeVariant(t.status)} size="sm">
                      {t.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-300 font-medium truncate max-w-[140px]">
                    {t.action ? t.action.replace(/_/g, ' ') : '—'}
                  </td>
                  <td className="px-5 py-3 text-slate-400 font-mono text-[11px]">
                    {formatRelativeTime(t.createdAt)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/tickets/${t.ticketId}`}
                      className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      <span>Inspect</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Table Footer Summary */}
      <div className="px-5 py-3 bg-slate-900/60 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span>Showing up to 6 recent operational events</span>
        <span className="font-mono text-cyan-400">P-01 Rule Engine Active</span>
      </div>
    </div>
  );
}
