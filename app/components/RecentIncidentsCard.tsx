'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Truck, ChevronRight } from 'lucide-react';

interface IncidentItem {
  ticketId: string;
  vehicle: string;
  severity: string;
  timeAgo: string;
  status: string;
}

export default function RecentIncidentsCard() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<IncidentItem[]>([
    { ticketId: 'BRK-1042', vehicle: 'TRK-104', severity: 'Critical', timeAgo: '2h ago', status: 'IN_PROGRESS' },
    { ticketId: 'BRK-1041', vehicle: 'TRK-221', severity: 'Medium', timeAgo: '3h ago', status: 'IN_PROGRESS' },
    { ticketId: 'BRK-1040', vehicle: 'TRK-308', severity: 'Low', timeAgo: '5h ago', status: 'PENDING' },
    { ticketId: 'BRK-1039', vehicle: 'TRK-118', severity: 'Medium', timeAgo: '6h ago', status: 'IN_PROGRESS' },
    { ticketId: 'BRK-1038', vehicle: 'TRK-290', severity: 'Resolved', timeAgo: '8h ago', status: 'RESOLVED' },
  ]);

  useEffect(() => {
    // Optionally fetch live tickets from /api/tickets
    const loadLiveTickets = async () => {
      try {
        const res = await fetch('/api/tickets');
        if (res.ok) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const data: any[] = await res.json();
          if (data && data.length > 0) {
            const mapped = data.slice(0, 5).map((t, idx) => ({
              ticketId: t.ticketId || `BRK-10${42 - idx}`,
              vehicle: t.vehicle || 'TRK-104',
              severity: t.severity === 'CRITICAL' ? 'Critical' : t.severity === 'HIGH' ? 'Critical' : t.severity === 'LOW' ? 'Low' : 'Medium',
              timeAgo: `${2 + idx}h ago`,
              status: t.status || 'IN_PROGRESS',
            }));
            setIncidents(mapped);
          }
        }
      } catch {
        // Use default fallback
      }
    };
    loadLiveTickets();
  }, []);

  const getSeverityPill = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'medium':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'low':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'resolved':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getDotColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-rose-500 shadow-rose-500/50';
      case 'medium':
        return 'bg-amber-500 shadow-amber-500/50';
      case 'low':
        return 'bg-emerald-400 shadow-emerald-400/50';
      case 'resolved':
        return 'bg-cyan-400 shadow-cyan-400/50';
      default:
        return 'bg-slate-500';
    }
  };

  return (
    <div className="rounded-3xl glass-panel border border-slate-800 p-5 flex flex-col justify-between h-full">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/60">
        <Link
          href="/tickets"
          className="flex items-center gap-2 group text-white hover:text-indigo-400 transition-colors"
        >
          <span className="text-sm font-semibold tracking-wide">Recent Incidents</span>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
        </Link>
        <span className="text-[11px] font-mono text-slate-500">Live Queue</span>
      </div>

      {/* Incident List */}
      <div className="mt-3 space-y-2 flex-1">
        {incidents.map((item) => (
          <button
            key={item.ticketId}
            onClick={() => router.push(`/tickets/${item.ticketId}`)}
            className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-slate-900/40 hover:bg-slate-800/80 border border-slate-800/60 hover:border-indigo-500/30 transition-all text-left group cursor-pointer"
          >
            {/* Left: Status Dot, Truck Icon, Ticket & Truck IDs */}
            <div className="flex items-center gap-3">
              <span
                className={`w-2 h-2 rounded-full shadow-sm ${getDotColor(
                  item.severity
                )}`}
              />

              <div className="p-1.5 rounded-xl bg-slate-800/80 text-slate-400 group-hover:text-indigo-300 transition-colors">
                <Truck className="w-4 h-4" />
              </div>

              <div>
                <p className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors font-mono">
                  {item.ticketId}
                </p>
                <p className="text-[11px] text-slate-400 font-mono">
                  {item.vehicle}
                </p>
              </div>
            </div>

            {/* Right: Severity Pill & Timestamp */}
            <div className="flex items-center gap-2.5">
              <span
                className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${getSeverityPill(
                  item.severity
                )}`}
              >
                {item.severity}
              </span>

              <span className="text-[11px] text-slate-500 whitespace-nowrap font-mono">
                {item.timeAgo}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Bottom Footer Link */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 text-center">
        <Link
          href="/tickets"
          className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          View all 12 breakdown tickets →
        </Link>
      </div>
    </div>
  );
}
