'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  RefreshCw,
  Truck,
  ChevronRight,
} from 'lucide-react';

interface TicketItem {
  ticketId: string;
  canonicalTicketId: string;
  createdAt: string;
  vehicle: string;
  driverId: string;
  client: string;
  issue: string;
  originHub: string;
  destination: string;
  severity: string;
  status: string;
  isQuarantined: boolean;
  isDuplicate: boolean;
  action: string | null;
  replacementVehicle: string | null;
  workOrderId: string | null;
  approvalStatus: string | null;
}

function createDefaultTickets(): TicketItem[] {
  const now = Date.now();
  return [
    {
      ticketId: 'BRK-1042',
      canonicalTicketId: 'BRK-1042',
      createdAt: new Date(now - 2 * 3600 * 1000).toISOString(),
      vehicle: 'TRK-104',
      driverId: 'DRV-8821',
      client: 'Shakti Cement',
      issue: 'Brake Disc Overheating & Caliper Lock',
      originHub: 'Mumbai Central',
      destination: 'Delhi Industrial Corridor',
      severity: 'CRITICAL',
      status: 'IN_PROGRESS',
      isQuarantined: false,
      isDuplicate: false,
      action: 'REPLACEMENT_DISPATCHED',
      replacementVehicle: 'TRK-121',
      workOrderId: 'WO-1042',
      approvalStatus: 'PENDING',
    },
    {
      ticketId: 'BRK-1041',
      canonicalTicketId: 'BRK-1041',
      createdAt: new Date(now - 3 * 3600 * 1000).toISOString(),
      vehicle: 'TRK-221',
      driverId: 'DRV-4412',
      client: 'Reliance',
      issue: 'Engine Coolant Leakage',
      originHub: 'Jamnagar Hub',
      destination: 'Dahej Petrochemical',
      severity: 'HIGH',
      status: 'RESOLVED',
      isQuarantined: false,
      isDuplicate: false,
      action: 'ROADSIDE_REPAIRED',
      replacementVehicle: null,
      workOrderId: 'WO-1041',
      approvalStatus: 'APPROVED',
    },
    {
      ticketId: 'BRK-1040',
      canonicalTicketId: 'BRK-1040',
      createdAt: new Date(now - 5 * 3600 * 1000).toISOString(),
      vehicle: 'TRK-308',
      driverId: 'DRV-1930',
      client: 'Adani',
      issue: 'Transmission Sensor Error',
      originHub: 'Mundra Port',
      destination: 'Ahmedabad Logistics Park',
      severity: 'LOW',
      status: 'PENDING',
      isQuarantined: false,
      isDuplicate: false,
      action: 'QUEUED',
      replacementVehicle: null,
      workOrderId: null,
      approvalStatus: null,
    },
    {
      ticketId: 'BRK-1039',
      canonicalTicketId: 'BRK-1039',
      createdAt: new Date(now - 6 * 3600 * 1000).toISOString(),
      vehicle: 'TRK-118',
      driverId: 'DRV-5529',
      client: 'Tata Steel',
      issue: 'Suspension Leaf Spring Fracture',
      originHub: 'Jamshedpur Works',
      destination: 'Kolkata Dockyard',
      severity: 'MEDIUM',
      status: 'IN_PROGRESS',
      isQuarantined: false,
      isDuplicate: false,
      action: 'REPLACEMENT_DISPATCHED',
      replacementVehicle: 'TRK-412',
      workOrderId: 'WO-1039',
      approvalStatus: 'APPROVED',
    },
    {
      ticketId: 'BRK-1038',
      canonicalTicketId: 'BRK-1038',
      createdAt: new Date(now - 8 * 3600 * 1000).toISOString(),
      vehicle: 'TRK-290',
      driverId: 'DRV-7811',
      client: 'Ultratech',
      issue: 'Alternator Belt Slippage',
      originHub: 'Nagpur Depot',
      destination: 'Pune Distribution Hub',
      severity: 'RESOLVED',
      status: 'RESOLVED',
      isQuarantined: false,
      isDuplicate: false,
      action: 'RESOLVED',
      replacementVehicle: null,
      workOrderId: 'WO-1038',
      approvalStatus: 'APPROVED',
    },
    {
      ticketId: 'BRK-1037',
      canonicalTicketId: 'BRK-1037',
      createdAt: new Date(now - 10 * 3600 * 1000).toISOString(),
      vehicle: 'TRK-330',
      driverId: 'DRV-9014',
      client: 'JSW',
      issue: 'Air Brake Pressure Drop',
      originHub: 'Vijayanagar Steel Plant',
      destination: 'Chennai Port',
      severity: 'HIGH',
      status: 'IN_PROGRESS',
      isQuarantined: false,
      isDuplicate: false,
      action: 'REPLACEMENT_DISPATCHED',
      replacementVehicle: 'TRK-145',
      workOrderId: 'WO-1037',
      approvalStatus: 'PENDING',
    },
  ];
}

function getRelativeTime(isoString: string): string {
  const diffHours = Math.round((Date.now() - new Date(isoString).getTime()) / (3600 * 1000));
  if (isNaN(diffHours) || diffHours <= 0) return 'Just now';
  return `${diffHours}h ago`;
}

export default function TicketsPage() {
  const router = useRouter();
  const [defaultMockTickets] = useState<TicketItem[]>(() => createDefaultTickets());
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tickets');
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setTickets(data);
          return;
        }
      }
      setTickets(defaultMockTickets);
    } catch {
      setTickets(defaultMockTickets);
    } finally {
      setLoading(false);
    }
  }, [defaultMockTickets]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      searchTerm === '' ||
      t.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.issue.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity =
      severityFilter === 'ALL' ||
      t.severity?.toUpperCase() === severityFilter.toUpperCase();

    return matchesSearch && matchesSeverity;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'LOW':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'RESOLVED':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30';
      case 'IN_PROGRESS':
        return 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30';
      case 'PENDING':
        return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border border-slate-700';
    }
  };

  // getRelativeTime is defined outside the component to avoid Date.now() render purity issues

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header with Title & Filter Controls matching screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <span>Incidents</span>
            <span className="text-xs font-mono font-normal bg-indigo-950 text-indigo-300 border border-indigo-700/60 px-2.5 py-0.5 rounded-full">
              {filteredTickets.length} Active
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            View, filter and investigate all breakdowns across your freight network.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search ticket, truck, client..."
              className="pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-56 sm:w-64"
            />
          </div>

          <button
            onClick={fetchTickets}
            disabled={loading}
            className="p-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Refresh feed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Chips matching screenshot */}
      <div className="flex flex-wrap items-center gap-2">
        {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((pill) => {
          const isActive = severityFilter === pill;
          return (
            <button
              key={pill}
              onClick={() => setSeverityFilter(pill)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
              }`}
            >
              {pill === 'ALL' ? 'All' : pill.charAt(0) + pill.slice(1).toLowerCase()}
            </button>
          );
        })}
      </div>

      {/* Incidents Table matching screenshot layout */}
      <div className="rounded-3xl glass-panel border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0b1020] text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-800/80">
              <tr>
                <th className="px-6 py-4 font-mono">Ticket</th>
                <th className="px-6 py-4 font-mono">Vehicle</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Severity</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 font-mono">Time</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 text-xs">
                    No breakdown incidents match &quot;{searchTerm}&quot; or selected filter.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => (
                  <tr
                    key={t.ticketId}
                    onClick={() => router.push(`/tickets/${t.ticketId}`)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    {/* Ticket */}
                    <td className="px-6 py-4 font-mono font-bold text-indigo-400 group-hover:text-indigo-300">
                      {t.ticketId}
                    </td>

                    {/* Vehicle */}
                    <td className="px-6 py-4 font-mono text-slate-200">
                      <div className="flex items-center gap-2">
                        <Truck className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                        <span>{t.vehicle}</span>
                      </div>
                    </td>

                    {/* Client */}
                    <td className="px-6 py-4 text-slate-300 font-medium">
                      {t.client}
                    </td>

                    {/* Severity */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getSeverityBadge(
                          t.severity
                        )}`}
                      >
                        {t.severity}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${getStatusBadge(
                          t.status
                        )}`}
                      >
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Time */}
                    <td className="px-6 py-4 text-slate-400 text-xs font-mono">
                      {getRelativeTime(t.createdAt)}
                    </td>

                    {/* Action */}
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/tickets/${t.ticketId}`}
                        className="inline-flex items-center gap-1 text-xs text-indigo-400 group-hover:text-indigo-300 font-medium"
                      >
                        <span>Investigate</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
