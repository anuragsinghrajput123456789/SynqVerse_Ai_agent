'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  AlertCircle,
  Truck,
  User,
  Building2,
  MapPin,
  Wrench,
  Scale,
  FileCheck2,
  Mail,
  CheckSquare,
  Shield,
  FileText,
  Activity,
  Compass,
  Sparkles,
  RefreshCw,
  Send,
  X,
  AlertTriangle,
} from 'lucide-react';
import {
  QueueTicket,
  Vehicle,
  Driver,
  Client,
  DecisionRecord,
  CandidateEvaluation,
  DispatcherRule,
  SourceCitation,
} from '@/lib/types';
import { WorkOrder } from '@/lib/work-orders';
import { ApprovalRecord } from '@/lib/approvals';
import { AuditEvent } from '@/lib/audit';

interface TicketDetailResponse {
  ticket: QueueTicket;
  vehicle: Vehicle | null;
  driver: Driver | null;
  client: Client | null;
  relevantTrip: {
    tripId: string;
    vehicle: string;
    driverId: string;
    originHub: string;
    destination: string;
    kmFromOriginHub: number;
    client: string;
    status: string;
  } | null;
  maintenanceHistory: Array<{
    sourceId: string;
    sourceFile: string;
    sourceType: string;
    recordId: string;
    field: string;
    resolvedValue: {
      id?: string;
      date?: string;
      odometerKm?: number;
      mechanic?: string;
      notes?: string;
    };
    resolutionReason?: string;
  }>;
  decision: DecisionRecord | null;
  workOrder: WorkOrder | null;
  approval: ApprovalRecord | null;
  auditTimeline: AuditEvent[];
}

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const ticketId = resolvedParams.id;

  const [data, setData] = useState<TicketDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Dispatcher Approval state
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const fetchTicketDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tickets/${ticketId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load ticket detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketDetail();
  }, [ticketId]);

  const handleApprove = async () => {
    if (!data?.approval) return;
    try {
      setActionLoading(true);
      setActionMessage(null);
      const res = await fetch(`/api/approvals/${data.approval.approvalId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actor: 'dispatcher_control',
          notes: approvalNotes || 'Approved by dispatcher via ticket console',
        }),
      });
      const result = await res.json();
      if (result.success) {
        setActionMessage('Message successfully APPROVED and dispatched to client.');
        await fetchTicketDetail();
      } else {
        setActionMessage(`Approval failed: ${result.error}`);
      }
    } catch (err) {
      setActionMessage(`Approval error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!data?.approval) return;
    if (!rejectionReason.trim()) {
      alert('Please specify a rejection reason.');
      return;
    }
    try {
      setActionLoading(true);
      setActionMessage(null);
      const res = await fetch(`/api/approvals/${data.approval.approvalId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actor: 'dispatcher_control',
          reason: rejectionReason,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setActionMessage('Message REJECTED. Human revision required.');
        setShowRejectInput(false);
        await fetchTicketDetail();
      } else {
        setActionMessage(`Rejection failed: ${result.error}`);
      }
    } catch (err) {
      setActionMessage(`Rejection error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
        <span className="text-sm font-mono">Loading ticket details for {ticketId}...</span>
      </div>
    );
  }

  if (!data || !data.ticket) {
    return (
      <div className="space-y-4 text-center py-12">
        <AlertOctagon className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Ticket Not Found</h2>
        <p className="text-slate-400 text-sm">Ticket ID &quot;{ticketId}&quot; could not be located in database.</p>
        <Link
          href="/tickets"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tickets
        </Link>
      </div>
    );
  }

  const {
    ticket,
    vehicle,
    driver,
    client,
    relevantTrip,
    maintenanceHistory,
    decision,
    workOrder,
    approval,
    auditTimeline,
  } = data;

  const getSeverityBadge = (sev: string) => {
    switch (sev?.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-red-950/90 text-red-300 border-red-800';
      case 'HIGH':
        return 'bg-rose-950/90 text-rose-300 border-rose-800';
      case 'MEDIUM':
        return 'bg-amber-950/90 text-amber-300 border-amber-800';
      default:
        return 'bg-blue-950/90 text-blue-300 border-blue-800';
    }
  };

  const getStatusBadge = (st: string, isDup: boolean, isQuar: boolean) => {
    if (isQuar) return 'bg-rose-950 text-rose-300 border-rose-800';
    if (isDup) return 'bg-yellow-950 text-yellow-300 border-yellow-800';
    if (st === 'COMPLETED') return 'bg-emerald-950 text-emerald-300 border-emerald-800';
    if (st === 'PROCESSING') return 'bg-indigo-950 text-indigo-300 border-indigo-800';
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/tickets"
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-mono font-extrabold text-white tracking-tight">{ticket.ticketId}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getSeverityBadge(ticket.severity)}`}>
                {ticket.severity} SEVERITY
              </span>
              <span className={`px-2.5 py-0.5 rounded text-xs font-semibold border ${getStatusBadge(ticket.status, ticket.isDuplicate, ticket.isQuarantined)}`}>
                {ticket.isQuarantined ? 'QUARANTINED' : ticket.isDuplicate ? 'DUPLICATE' : ticket.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Reported: {ticket.createdAt ? ticket.createdAt.replace('T', ' ').slice(0, 19) : '—'} • Canonical ID: {ticket.canonicalTicketId || ticket.ticketId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTicketDetail}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Details
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div className="p-4 rounded-xl bg-indigo-950/60 border border-indigo-700 text-indigo-200 text-sm flex items-start gap-3">
          <Shield className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="flex-1">{actionMessage}</div>
          <button onClick={() => setActionMessage(null)} className="text-indigo-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quarantine / Duplicate Warning Banner (if applicable) */}
      {ticket.isQuarantined && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-200 text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-sm text-rose-300">
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            Ticket Quarantined — Automated Dispatch Isolated
          </div>
          <p className="text-slate-300">Reason: {ticket.quarantineReason || 'Validation failures detected in ticket payload.'}</p>
          {ticket.validationErrors && (
            <ul className="list-disc list-inside text-rose-400 pt-1">
              {ticket.validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {ticket.isDuplicate && (
        <div className="p-4 rounded-xl bg-yellow-950/40 border border-yellow-800 text-yellow-200 text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-sm text-yellow-300">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            Duplicate Breakdown Report Detected
          </div>
          <p className="text-slate-300">
            This ticket is an exact duplicate of canonical breakdown record <span className="font-mono font-bold text-yellow-300">{ticket.duplicateOf || ticket.canonicalTicketId}</span>. Duplicate work orders and redundant dispatches were automatically suppressed.
          </p>
        </div>
      )}

      {/* GRID LAYOUT FOR SECTIONS 1 to 11 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: CONTEXT (Breakdown, Vehicle, Driver, Client, Route, Trip, Maintenance) (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. Breakdown Information */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
                <AlertCircle className="w-4 h-4" />
                <span>1. Breakdown Information</span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">{ticket.sourceFile || 'tickets.json'}</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 block mb-1 font-medium">Reported Failure Issue:</span>
                <p className="text-slate-100 font-semibold text-sm leading-snug">{ticket.issue || '—'}</p>
                {ticket.resolutionNote && (
                  <p className="text-slate-400 text-[11px] mt-1.5 pt-1.5 border-t border-slate-800">
                    Note: {ticket.resolutionNote}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/60">
                  <span className="text-slate-500 block">Severity</span>
                  <span className="font-bold text-slate-200">{ticket.severity}</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/60">
                  <span className="text-slate-500 block">Status</span>
                  <span className="font-bold text-slate-200">{ticket.status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Vehicle (Broken Vehicle) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
                <Truck className="w-4 h-4" />
                <span>2. Broken Vehicle Profile</span>
              </div>
              <span className="font-mono text-xs font-bold text-indigo-300">{ticket.vehicle}</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/60">
                <span className="text-slate-500 text-[11px] block">Model & Year</span>
                <span className="text-slate-200 font-medium">
                  {vehicle ? `${vehicle.model} (${vehicle.year})` : '—'}
                </span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/60">
                <span className="text-slate-500 text-[11px] block">Emission Stage</span>
                <span className="text-slate-200 font-mono font-medium">{vehicle?.bsStage || '—'}</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/60">
                <span className="text-slate-500 text-[11px] block">Home Hub</span>
                <span className="text-slate-200 font-medium">{vehicle?.homeHub || ticket.originHub || '—'}</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/60">
                <span className="text-slate-500 text-[11px] block">Payload Capacity</span>
                <span className="text-slate-200 font-medium">{vehicle?.capacityTonnes ? `${vehicle.capacityTonnes} Tonnes` : '—'}</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/60">
                <span className="text-slate-500 text-[11px] block">Engine Heater</span>
                <span className="text-slate-200 font-medium">{vehicle?.engineHeater ? 'Yes (Hills Capable)' : 'No'}</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/60">
                <span className="text-slate-500 text-[11px] block">Fleet Master Status</span>
                <span className="text-emerald-400 font-medium">{vehicle?.status || 'Active'}</span>
              </div>
            </div>
          </div>

          {/* 3. Driver Profile */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
                <User className="w-4 h-4" />
                <span>3. Assigned Driver (PII Redacted)</span>
              </div>
              <span className="font-mono text-xs text-slate-400">{ticket.driverId}</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/60">
                <span className="text-slate-500 text-[11px] block">Driver Name</span>
                <span className="text-slate-200 font-medium">{driver?.name || ticket.driverId}</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/60">
                <span className="text-slate-500 text-[11px] block">Contact Phone</span>
                <span className="text-emerald-400 font-mono flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  [REDACTED]
                </span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/60">
                <span className="text-slate-500 text-[11px] block">Driving License</span>
                <span className="text-slate-300 font-mono">{driver?.dlNumber || '[REDACTED]'}</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/60">
                <span className="text-slate-500 text-[11px] block">Base Hub</span>
                <span className="text-slate-200 font-medium">{driver?.homeHub || '—'}</span>
              </div>
            </div>
          </div>

          {/* 4. Client & SLA Constraints */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
                <Building2 className="w-4 h-4" />
                <span>4. Client & SLA Rules</span>
              </div>
              <span className="font-semibold text-xs text-white">{ticket.client}</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/60">
                  <span className="text-slate-500 text-[11px] block">Operational SLA</span>
                  <span className="text-indigo-300 font-bold text-sm">
                    {client?.operationalSlaHours || decision?.slaDeadlineHours || 48} Hours
                  </span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/60">
                  <span className="text-slate-500 text-[11px] block">Contract SLA</span>
                  <span className="text-slate-300 font-medium text-sm">
                    {client?.contractSlaHours || 48} Hours
                  </span>
                </div>
              </div>

              {client?.specialRules && client.specialRules.length > 0 && (
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 space-y-1.5">
                  <span className="text-slate-400 font-semibold block text-[11px]">Special Handling Rules:</span>
                  <ul className="space-y-1 text-[11px] text-slate-300">
                    {client.specialRules.map((rule, rIdx) => (
                      <li key={rIdx} className="flex items-start gap-1.5">
                        <span className="text-indigo-400">•</span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* 5. Route & 6. Relevant Trip */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
                <MapPin className="w-4 h-4" />
                <span>5. Route & 6. Relevant Trip</span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-mono block">Origin Hub</span>
                  <span className="text-slate-200 font-bold text-sm">{ticket.originHub || '—'}</span>
                </div>
                <div className="text-center px-3">
                  <span className="text-[10px] text-indigo-400 font-mono">{ticket.kmFromOriginHub} km out</span>
                  <div className="w-16 h-0.5 bg-indigo-500/50 mx-auto my-1"></div>
                  <span className="text-[10px] text-slate-500">Transit Corridor</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 text-[10px] uppercase font-mono block">Destination</span>
                  <span className="text-slate-200 font-bold text-sm">{ticket.destination || '—'}</span>
                </div>
              </div>

              {relevantTrip && (
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/60 text-[11px] grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500 block">Trip Reference:</span>
                    <span className="font-mono text-slate-300">{relevantTrip.tripId}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Transit Status:</span>
                    <span className="text-amber-400 font-medium">{relevantTrip.status}</span>
                  </div>
                </div>
              )}

              {decision?.transitBufferPercentage ? (
                <div className="p-2.5 bg-amber-950/30 border border-amber-800/50 rounded-lg text-[11px] text-amber-300">
                  ⚠️ Monsoon Eastern Buffer: +{decision.transitBufferPercentage}% transit margin added for weather diversions.
                </div>
              ) : null}
            </div>
          </div>

          {/* 7. Maintenance History */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
                <Wrench className="w-4 h-4" />
                <span>7. Maintenance History</span>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {maintenanceHistory.length} record(s)
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {maintenanceHistory.length === 0 ? (
                <div className="p-3 bg-slate-950 rounded-lg text-slate-500 text-center">
                  No previous workshop overhaul or open maintenance restrictions recorded for this vehicle.
                </div>
              ) : (
                maintenanceHistory.map((m, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-semibold text-slate-300">{m.resolvedValue?.notes || m.field}</span>
                      <span className="text-slate-500 font-mono">{m.resolvedValue?.date || 'Historical'}</span>
                    </div>
                    {m.resolvedValue?.odometerKm && (
                      <div className="text-[11px] text-slate-400">
                        Odometer: {m.resolvedValue.odometerKm} km • Mechanic: {m.resolvedValue.mechanic || 'Workshop'}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DECISION ENGINE & VEHICLE REPLACEMENTS (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 8. Operational Decision Card with Source Citations */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-emerald-400">
                <Compass className="w-4 h-4" />
                <span>8. Operational Decision</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded font-mono">
                  {decision?.decisionStatus || 'EVALUATED'}
                </span>
              </div>
            </div>

            {decision ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Action Prescribed:</span>
                    <span className="px-3.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-700 rounded-lg font-mono font-bold text-sm">
                      {decision.action}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed pt-2 border-t border-slate-800">
                    {decision.actionReason}
                  </p>
                </div>

                {/* Explanation */}
                <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Deterministic Reasoning Justification</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{decision.explanation}</p>
                </div>

                {/* Source citations displayed directly beside decision */}
                {decision.sources && decision.sources.length > 0 && (
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3 h-3 text-indigo-400" />
                      Cited Decision Grounding Sources ({decision.sources.length})
                    </span>
                    <div className="space-y-1.5">
                      {decision.sources.map((src, sIdx) => (
                        <div key={sIdx} className="p-2 bg-slate-900 rounded border border-slate-800 text-[11px] flex justify-between items-center">
                          <div>
                            <span className="font-mono text-indigo-300 font-semibold">{src.sourceFile}</span>
                            <span className="text-slate-400 ml-2">({src.field})</span>
                          </div>
                          <span className="text-slate-500 text-[10px]">{src.resolutionReason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 bg-slate-950 rounded-xl text-center text-slate-500 text-xs">
                No automated decision recorded for this ticket.
              </div>
            )}
          </div>

          {/* 11. Selected Replacement & 10. Rejected Vehicles Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 11. Selected Replacement Vehicle Card */}
            <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-xl p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  REPLACEMENT SELECTED
                </span>
                <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 text-[10px] font-bold rounded border border-emerald-800">
                  RANK #1
                </span>
              </div>

              {decision?.selectedVehicle ? (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="text-lg font-mono font-extrabold text-white">
                      {decision.selectedVehicle.registrationNumber}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {decision.selectedVehicle.model} ({decision.selectedVehicle.year}) • {decision.selectedVehicle.bsStage}
                    </div>
                    <div className="text-xs text-indigo-400 font-semibold mt-1">
                      Hub: {decision.selectedVehicle.homeHub} • {decision.selectedVehicle.distanceKm} km from origin
                    </div>
                  </div>

                  {/* Operational Criteria Verification Checklist */}
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2 text-xs font-medium">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Available in active inventory</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Route permitted & distance valid</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Maintenance valid & inspected</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Correct payload capacity ({decision.selectedVehicle.capacityTonnes}T)</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Not assigned to ongoing dispatches</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-slate-950 rounded-lg text-center text-slate-500 text-xs">
                  No replacement vehicle assigned (Roadside repair or no eligible candidate).
                </div>
              )}
            </div>

            {/* 10. Rejected Vehicles Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-400" />
                  REJECTED CANDIDATES
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {decision?.rejectedCandidates?.length || 0} excluded
                </span>
              </div>

              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {!decision?.rejectedCandidates || decision.rejectedCandidates.length === 0 ? (
                  <div className="p-6 bg-slate-950 rounded-lg text-center text-slate-500 text-xs">
                    No candidate alternatives were evaluated or rejected.
                  </div>
                ) : (
                  decision.rejectedCandidates.map((cand: CandidateEvaluation, cIdx: number) => (
                    <div key={cIdx} className="p-3 bg-slate-950 rounded-lg border border-slate-800/90 text-xs space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-slate-200">{cand.registrationNumber}</span>
                        <span className="text-[10px] text-slate-500">{cand.distanceKm} km</span>
                      </div>

                      <div className="space-y-1">
                        {cand.reasons.map((r, rId) => (
                          <div key={rId} className="flex items-start gap-1.5 text-[11px] text-rose-300 font-medium">
                            <span className="text-rose-500 font-bold">✕</span>
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 12. Work Order & 14. Approval Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 12. Work Order */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
                  <FileCheck2 className="w-4 h-4" />
                  <span>12. Work Order</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-300">{workOrder?.workOrderId || '—'}</span>
              </div>

              {workOrder ? (
                <div className="space-y-2.5 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-slate-950 rounded border border-slate-800/60">
                      <span className="text-slate-500 text-[10px] block">Status</span>
                      <span className="text-indigo-400 font-bold">{workOrder.status}</span>
                    </div>
                    <div className="p-2 bg-slate-950 rounded border border-slate-800/60">
                      <span className="text-slate-500 text-[10px] block">SLA Target</span>
                      <span className="text-slate-200 font-bold">{workOrder.slaDeadlineHours}h</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded border border-slate-800/80 space-y-1">
                    <span className="text-slate-500 text-[10px] block font-mono">Idempotency Key</span>
                    <span className="text-slate-300 font-mono text-[11px] break-all">{workOrder.idempotencyKey}</span>
                  </div>

                  {workOrder.instructions && workOrder.instructions.length > 0 && (
                    <div className="p-2.5 bg-slate-950 rounded border border-slate-800/80 space-y-1">
                      <span className="text-slate-400 font-semibold text-[11px] block">Dispatch Instructions:</span>
                      <ul className="text-[11px] text-slate-300 space-y-0.5">
                        {workOrder.instructions.map((ins, iIdx) => (
                          <li key={iIdx}>• {ins}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 bg-slate-950 rounded-lg text-center text-slate-500 text-xs">
                  No work order generated for this ticket.
                </div>
              )}
            </div>

            {/* 14. Approval Status & Actions */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
                  <CheckSquare className="w-4 h-4" />
                  <span>14. Approval Status</span>
                </div>
                {approval && (
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      approval.status === 'APPROVED'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : approval.status === 'REJECTED'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}
                  >
                    {approval.status}
                  </span>
                )}
              </div>

              {approval ? (
                <div className="space-y-3 text-xs">
                  <div className="p-2.5 bg-slate-950 rounded border border-slate-800/80 text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Approval ID:</span>
                      <span className="font-mono text-slate-300">{approval.approvalId}</span>
                    </div>
                    {approval.actor && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Actor:</span>
                        <span className="font-mono text-slate-300">{approval.actor}</span>
                      </div>
                    )}
                    {approval.approvalNotes && (
                      <div className="pt-1 text-slate-300">
                        <span className="text-slate-500">Notes:</span> {approval.approvalNotes}
                      </div>
                    )}
                    {approval.rejectionReason && (
                      <div className="pt-1 text-rose-300">
                        <span className="text-rose-500">Rejection Reason:</span> {approval.rejectionReason}
                      </div>
                    )}
                  </div>

                  {/* Dispatcher Approve / Reject Controls */}
                  {approval.status === 'PENDING' && (
                    <div className="space-y-2 pt-1 border-t border-slate-800">
                      {!showRejectInput ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Optional dispatcher notes..."
                            value={approvalNotes}
                            onChange={(e) => setApprovalNotes(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded p-2 focus:outline-none focus:border-indigo-500"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleApprove}
                              disabled={actionLoading}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition-colors disabled:opacity-50"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Approve & Dispatch</span>
                            </button>
                            <button
                              onClick={() => setShowRejectInput(true)}
                              disabled={actionLoading}
                              className="px-3 py-2 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 font-semibold rounded-lg text-xs transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 p-2.5 bg-slate-950 rounded border border-rose-800/80">
                          <span className="text-rose-300 font-medium text-[11px] block">Specify Rejection Reason:</span>
                          <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="State reason for rejecting this drafted update..."
                            className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded p-2 focus:outline-none focus:border-rose-500"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleReject}
                              disabled={actionLoading}
                              className="flex-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded text-xs"
                            >
                              Confirm Rejection
                            </button>
                            <button
                              onClick={() => setShowRejectInput(false)}
                              className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 bg-slate-950 rounded-lg text-center text-slate-500 text-xs">
                  No approval workflow required for this incident.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 13. AI Client Notification Message Draft (Full Width) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-indigo-400">
            <Mail className="w-4 h-4" />
            <span>13. AI Client Notification Message Draft</span>
          </div>
          <span className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-800 px-2.5 py-0.5 rounded font-mono">
            Zero Hallucination · PII Masked
          </span>
        </div>

        {approval?.message ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Drafted Email Message */}
            <div className="md:col-span-7 space-y-3">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[11px] block">Subject:</span>
                <span className="text-slate-200 font-semibold text-xs font-mono">{approval.message.subject}</span>
              </div>

              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[11px] block mb-2 font-medium">Body:</span>
                <pre className="text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                  {approval.message.message}
                </pre>
              </div>
            </div>

            {/* Facts Used & Citations */}
            <div className="md:col-span-5 space-y-4">
              {/* Facts Used */}
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Grounding Facts Checklist:
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {approval.message.factsUsed?.map((fact, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Message Grounding Citations */}
              {approval.message.citations && approval.message.citations.length > 0 && (
                <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Message Provenance Citations ({approval.message.citations.length}):
                  </span>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {approval.message.citations.map((c, cIdx) => (
                      <div key={cIdx} className="p-2 bg-slate-900 rounded border border-slate-800/80 text-[11px] space-y-0.5">
                        <div className="font-mono text-indigo-400 font-semibold">{c.sourceFile}</div>
                        <div className="text-slate-400">Field: <span className="text-slate-200">{c.field}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 bg-slate-950 rounded-xl text-center text-slate-500 text-xs">
            No client notification message drafted for this incident.
          </div>
        )}
      </div>

      {/* 9. Rules Evaluated & 15. Source Citations (Full Width Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 9. Rules Evaluated */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-indigo-400">
              <Scale className="w-4 h-4" />
              <span>9. Dispatcher Rules Evaluated ({decision?.rulesApplied?.length || 0})</span>
            </div>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {!decision?.rulesApplied || decision.rulesApplied.length === 0 ? (
              <div className="p-6 bg-slate-950 rounded-lg text-center text-slate-500 text-xs">
                No specific rules applied.
              </div>
            ) : (
              decision.rulesApplied.map((rule: DispatcherRule, idx: number) => (
                <div key={idx} className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-indigo-400">{rule.ruleId}: {rule.name}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-mono">
                      Priority {rule.priority}
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">{rule.description || rule.condition}</p>
                  <div className="pt-1.5 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono break-all">
                    Source: {rule.sourceReference || rule.source}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 15. Source Citations Provenance */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-indigo-400">
              <FileText className="w-4 h-4" />
              <span>15. Source Citations & Provenance ({decision?.sources?.length || 0})</span>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {!decision?.sources || decision.sources.length === 0 ? (
              <div className="p-6 bg-slate-950 rounded-lg text-center text-slate-500 text-xs">
                No citations recorded for this decision.
              </div>
            ) : (
              decision.sources.map((src: SourceCitation, sIdx: number) => (
                <div key={sIdx} className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-indigo-300">{src.sourceId}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-400 rounded">
                      Precedence {src.precedence}
                    </span>
                  </div>
                  <div className="text-slate-300">
                    File: <span className="font-mono text-slate-200">{src.sourceFile}</span> ({src.sourceType})
                  </div>
                  <div className="text-slate-500 text-[11px] pt-1 border-t border-slate-800/60">
                    {src.resolutionReason}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 16. Full Audit Timeline (Full Width) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-indigo-400">
            <Activity className="w-4 h-4" />
            <span>16. Audit Timeline Lifecycle Trail ({auditTimeline.length} Events)</span>
          </div>
          <span className="text-xs text-slate-500 font-mono">Immutable Append-Only Audit Stream</span>
        </div>

        {auditTimeline.length === 0 ? (
          <div className="p-6 bg-slate-950 rounded-lg text-center text-slate-500 text-xs">
            No audit trail records found for this ticket.
          </div>
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {auditTimeline.map((ev: AuditEvent, aIdx: number) => (
              <div key={aIdx} className="relative group">
                {/* Timeline Dot */}
                <div className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full bg-slate-950 border-2 border-indigo-500"></div>

                <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-indigo-400">{ev.eventType}</span>
                      <span className="text-[11px] text-slate-500 font-mono">by {ev.actor}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {ev.timestamp ? ev.timestamp.replace('T', ' ').slice(0, 19) : '—'}
                    </span>
                  </div>

                  <p className="text-slate-300 leading-relaxed">{ev.reason}</p>

                  {ev.ruleId && (
                    <div className="text-[11px] text-indigo-300 font-mono pt-1 border-t border-slate-800/80">
                      Enforced Rule: {ev.ruleId}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
