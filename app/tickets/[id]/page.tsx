'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, use, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Truck,
  Shield,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import {
  QueueTicket,
  Vehicle,
  Driver,
  Client,
  DecisionRecord,
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
  const approvalNotes = '';
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const fetchTicketDetail = useCallback(async () => {
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
  }, [ticketId]);

  useEffect(() => {
    fetchTicketDetail();
  }, [fetchTicketDetail]);

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
      alert('Please provide a reason for rejecting the notification.');
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
        setActionMessage('Notification draft successfully REJECTED and returned for re-evaluation.');
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

  const timelineSteps = [
    { name: 'Incident', completed: true },
    { name: 'Context', completed: true },
    { name: 'Decision', completed: !!data?.decision || true },
    { name: 'Replacement', completed: !!data?.decision?.selectedVehicle || !!data?.workOrder },
    { name: 'Work Order', completed: !!data?.workOrder },
    { name: 'AI Draft', completed: !!data?.approval },
    { name: 'Approval', completed: data?.approval?.status === 'APPROVED' },
    { name: 'Resolution', completed: data?.ticket?.status === 'COMPLETED' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header matching screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/tickets"
            className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Incidents</span>
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
              {ticketId}
            </h1>
            <span className="text-xs text-slate-400">Breakdown · 2h ago</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Critical
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              In Progress
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTicketDetail}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* 8-Stage Timeline Stepper matching screenshot */}
      <div className="rounded-3xl glass-panel border border-slate-800 p-6 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[700px] relative">
          {timelineSteps.map((step, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === timelineSteps.length - 1;

            return (
              <div key={step.name} className="flex-1 flex items-center relative">
                {/* Connecting Line Left */}
                {!isFirst && (
                  <div
                    className={`flex-1 h-0.5 transition-colors ${
                      step.completed ? 'bg-indigo-500' : 'bg-slate-800'
                    }`}
                  />
                )}

                {/* Node */}
                <div className="flex flex-col items-center z-10 px-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all ${
                      step.completed
                        ? 'bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-md shadow-indigo-500/30 ring-2 ring-indigo-500/20'
                        : 'bg-slate-900 border border-slate-800 text-slate-500'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span
                    className={`text-[11px] font-medium mt-1.5 whitespace-nowrap ${
                      step.completed ? 'text-slate-200' : 'text-slate-500'
                    }`}
                  >
                    {step.name}
                  </span>
                </div>

                {/* Connecting Line Right */}
                {!isLast && (
                  <div
                    className={`flex-1 h-0.5 transition-colors ${
                      step.completed ? 'bg-indigo-500' : 'bg-slate-800'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Side-by-Side Cards (Incident Summary & Decision Checklist) matching screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card: Incident Summary */}
        <div className="rounded-3xl glass-panel border border-slate-800 p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-400" />
              <span>Incident Summary</span>
            </h2>
            <span className="text-[11px] font-mono text-slate-400">
              Corridor Telemetry
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-400 font-medium">Vehicle</span>
              <span className="font-bold text-white font-mono">
                {data?.vehicle?.vehicleId || data?.ticket?.vehicle || 'TRK-104'}
                <span className="text-slate-400 font-normal ml-2">
                  ({data?.vehicle?.registrationNumber || 'UP-60-BK-0144'})
                </span>
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-400 font-medium">Driver</span>
              <span className="text-white font-medium">
                {data?.driver?.name || 'Ramesh Kumar'}
                <span className="text-[10px] text-slate-500 font-mono ml-2">
                  (DL: MASKED-***)
                </span>
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-400 font-medium">Client</span>
              <span className="text-cyan-300 font-semibold">
                {data?.client?.name || data?.ticket?.client || 'Shakti Cement'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-400 font-medium">Route</span>
              <span className="text-slate-200 font-mono">
                {data?.ticket?.originHub || 'Mumbai Central'} → {data?.ticket?.destination || 'Delhi (NH-48)'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-400 font-medium">Reported Date</span>
              <span className="text-slate-300 font-mono">
                08 Sep 2025, 08:21 AM
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <p className="text-slate-400 font-medium text-[11px]">Reported Problem:</p>
              <p className="text-slate-200 mt-1 font-mono">
                {data?.ticket?.issue || 'Brake Disc Overheating & Caliper Lock on NH-48'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Card: Decision Evaluation Checklist */}
        <div className="rounded-3xl glass-panel border border-slate-800 p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>Decision</span>
            </h2>

            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Rejected
            </span>
          </div>

          {/* Checklist Items matching screenshot */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <p className="text-slate-200 font-medium">Route checked</p>
                <p className="text-[11px] text-slate-400">NH-48 Golden Quadrilateral corridor verified</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <p className="text-slate-200 font-medium">Availability checked</p>
                <p className="text-[11px] text-slate-400">Depot candidate pool queried within 150 km</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-rose-950/30 border border-rose-800/50">
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <div className="text-xs">
                <p className="text-rose-300 font-medium">Maintenance restriction</p>
                <p className="text-[11px] text-rose-400">
                  Vehicle failed applicable maintenance eligibility rule
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <p className="text-slate-200 font-medium">Client requirement checked</p>
                <p className="text-[11px] text-slate-400">Shakti Cement BS6 compliance requirement met</p>
              </div>
            </div>
          </div>

          {/* Reason Box */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-700/80 text-xs">
            <span className="text-slate-400 font-semibold block text-[11px]">Reason:</span>
            <p className="text-slate-200 mt-1 font-mono leading-relaxed">
              Vehicle failed applicable maintenance eligibility rule. Required brake disc replacement overdue by 420 km.
            </p>
          </div>
        </div>
      </div>

      {/* Replacement Vehicle & Dispatcher Approval Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Selected Replacement Truck */}
        <div className="rounded-3xl glass-panel border border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-400" />
              <span>Assigned Replacement Truck</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              TRK-121
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-400">Plate Number</span>
              <span className="text-white font-mono">MH-04-AX-9912</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-400">Current Depot</span>
              <span className="text-slate-200">Mumbai Central Hub (18 km away)</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-400">Model &amp; Engine</span>
              <span className="text-slate-200">BharatBenz 2823C (BS6 Compliant)</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-400">Work Order</span>
              <span className="text-cyan-300 font-mono">WO-1042-DISPATCH</span>
            </div>
          </div>
        </div>

        {/* Dispatcher Notification Approval Desk */}
        <div className="rounded-3xl glass-panel border border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>AI-Drafted Client Notification</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Review Required
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 font-mono leading-relaxed">
            &ldquo;Dear Shakti Cement Dispatch Team, breakdown ticket BRK-1042 for primary truck TRK-104 has been triaged. In accordance with Fleet Safety Policy §4.2, eligible replacement truck TRK-121 has been deployed to ensure SLA compliance.&rdquo;
          </div>

          {actionMessage && (
            <div className="p-2.5 rounded-xl bg-indigo-950 border border-indigo-700 text-indigo-200 text-xs">
              {actionMessage}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="flex-1 py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/30 cursor-pointer"
            >
              Approve &amp; Dispatch
            </button>
            <button
              onClick={() => setShowRejectInput(!showRejectInput)}
              className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-rose-300 font-semibold text-xs transition-all cursor-pointer"
            >
              Reject / Edit
            </button>
          </div>

          {showRejectInput && (
            <div className="pt-3 space-y-2">
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Reason for rejecting client draft..."
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-rose-500"
                rows={2}
              />
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
              >
                Confirm Rejection
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
