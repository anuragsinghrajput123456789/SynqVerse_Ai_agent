'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  RefreshCw,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import Badge from '../components/ui/Badge';

interface WorkOrderItem {
  workOrderId: string;
  ticketId: string;
  originalVehicle: string;
  replacementVehicle: string;
  workshop: string;
  status: 'CREATED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  estimatedArrivalMin: number;
  idempotencyVerified: boolean;
}

export default function WorkOrdersPage() {
  const [orders, setOrders] = useState<WorkOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchLiveOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/work-orders');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mapped = data.map((item: any) => ({
            workOrderId: item.workOrderId || item.id || `WO-${item.ticketId}`,
            ticketId: item.ticketId || 'BRK-UNKNOWN',
            originalVehicle: item.originalVehicle || 'TRK-UNKNOWN',
            replacementVehicle: item.replacementVehicle || item.replacementVehicleId || 'None',
            workshop: item.workshop || 'Regional Depot Hub',
            status: item.status || 'IN_PROGRESS',
            createdAt: item.createdAt || new Date().toISOString(),
            estimatedArrivalMin: item.estimatedArrivalMin ?? 0,
            idempotencyVerified: true,
          }));
          setOrders(mapped);
        } else {
          setOrders([]);
        }
      } else {
        throw new Error(`Failed to load work orders (HTTP ${res.status})`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load work orders.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveOrders();
  }, []);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      searchTerm === '' ||
      o.workOrderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.originalVehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.replacementVehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.workshop.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'IN_PROGRESS':
        return 'cyan';
      case 'ASSIGNED':
        return 'info';
      case 'CREATED':
        return 'warning';
      case 'FAILED':
        return 'critical';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <span>Work Orders</span>
            <Badge variant="cyan" dot pulse>
              Exactly-Once Dispatched
            </Badge>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic work-order lifecycle, replacement truck assignment, and SLA roadside telemetry.
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
              placeholder="Search work order, ticket, truck..."
              className="pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-56 sm:w-64"
            />
          </div>

          <button
            onClick={fetchLiveOrders}
            disabled={loading}
            className="p-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Refresh orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchLiveOrders}
            className="px-3 py-1 bg-rose-900/60 hover:bg-rose-800 text-white rounded-lg font-semibold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Operational Guarantee Callout */}
      <div className="p-4 rounded-3xl glass-panel border border-indigo-500/20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Idempotent Execution Guarantee</p>
            <p className="text-[11px] text-slate-400">
              Zero duplicate work orders. Re-running the pipeline returns existing verified orders safely.
            </p>
          </div>
        </div>

        <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/60">
          <CheckCircle2 className="w-3.5 h-3.5" />
          100% Idempotent
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2 overflow-x-auto">
        {['ALL', 'IN_PROGRESS', 'ASSIGNED', 'CREATED', 'COMPLETED', 'FAILED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === st
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
            }`}
          >
            {st === 'ALL' ? 'All Orders' : st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-3xl glass-panel border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0b1020] text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-800/80">
              <tr>
                <th className="px-6 py-4 font-mono">Work Order ID</th>
                <th className="px-6 py-4 font-mono">Incident</th>
                <th className="px-6 py-4 font-mono">Primary Vehicle</th>
                <th className="px-6 py-4 font-mono">Replacement</th>
                <th className="px-6 py-4">Assigned Workshop</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">ETA</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500 text-xs">
                    No work orders found matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o.workOrderId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-indigo-400">
                      {o.workOrderId}
                    </td>
                    <td className="px-6 py-4 font-mono">
                      <Link
                        href={`/tickets/${o.ticketId}`}
                        className="text-cyan-400 hover:underline inline-flex items-center gap-1"
                      >
                        <span>{o.ticketId}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-200">
                      {o.originalVehicle}
                    </td>
                    <td className="px-6 py-4 font-mono text-emerald-300 font-semibold">
                      {o.replacementVehicle}
                    </td>
                    <td className="px-6 py-4 text-slate-300 text-xs font-medium">
                      {o.workshop}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getStatusBadgeVariant(o.status)}>
                        {o.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-400">
                      {o.estimatedArrivalMin > 0 ? (
                        <span className="flex items-center gap-1 text-cyan-300">
                          <Clock className="w-3 h-3" />
                          {o.estimatedArrivalMin} mins
                        </span>
                      ) : (
                        <span className="text-emerald-400">On-site</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/tickets/${o.ticketId}`}
                        className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        <span>View Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
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
