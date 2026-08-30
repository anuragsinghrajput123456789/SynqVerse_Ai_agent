'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckSquare,
  Clock,
  RefreshCw,
  Send,
  CheckCircle2,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { ApprovalRecord } from '@/lib/approvals';

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'HISTORY'>('PENDING');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Per-card input state
  const [notesState, setNotesState] = useState<Record<string, string>>({});
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/approvals');
      if (res.ok) {
        const data = await res.json();
        setApprovals(data);
      }
    } catch (err) {
      console.error('Failed to load approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleApprove = async (approvalId: string) => {
    try {
      setActionLoadingId(approvalId);
      setActionMessage(null);
      const res = await fetch(`/api/approvals/${approvalId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actor: 'dispatcher_control',
          notes: notesState[approvalId] || 'Approved by dispatcher via approvals queue',
        }),
      });
      const result = await res.json();
      if (result.success) {
        setActionMessage(`Approval ${approvalId} successfully APPROVED and dispatched.`);
        await fetchApprovals();
      } else {
        setActionMessage(`Failed to approve: ${result.error}`);
      }
    } catch (err) {
      setActionMessage(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (approvalId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please specify a rejection reason.');
      return;
    }
    try {
      setActionLoadingId(approvalId);
      setActionMessage(null);
      const res = await fetch(`/api/approvals/${approvalId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actor: 'dispatcher_control',
          reason: rejectionReason,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setActionMessage(`Approval ${approvalId} REJECTED.`);
        setRejectingId(null);
        setRejectionReason('');
        await fetchApprovals();
      } else {
        setActionMessage(`Failed to reject: ${result.error}`);
      }
    } catch (err) {
      setActionMessage(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const pendingApprovals = approvals.filter((a) => a.status === 'PENDING');
  const historyApprovals = approvals.filter((a) => a.status !== 'PENDING');
  const displayList = activeTab === 'PENDING' ? pendingApprovals : historyApprovals;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <span>Dispatcher Human Approvals</span>
            <span className="text-xs font-mono font-normal bg-amber-950 text-amber-300 border border-amber-800 px-2.5 py-0.5 rounded">
              {pendingApprovals.length} Pending Action
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Review and authorize automated AI client updates and work order dispatch communications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchApprovals}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Queue
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div className="p-4 rounded-xl bg-indigo-950/60 border border-indigo-700 text-indigo-200 text-sm flex items-start gap-3">
          <Shield className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="flex-1">{actionMessage}</div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'PENDING'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:bg-slate-900 hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Approvals ({pendingApprovals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'HISTORY'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:bg-slate-900 hover:text-white'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Action History ({historyApprovals.length})</span>
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-2 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
          <span className="text-xs font-mono">Loading dispatcher approval queue...</span>
        </div>
      ) : displayList.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-base font-bold text-white">
            {activeTab === 'PENDING' ? 'No Pending Approvals in Queue' : 'No Approval History'}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {activeTab === 'PENDING'
              ? 'All drafted client notifications and work orders have been authorized and dispatched.'
              : 'Approvals or rejections recorded by dispatchers will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {displayList.map((app) => (
            <div
              key={app.approvalId}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4"
            >
              {/* Top info bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-sm font-bold text-indigo-400">{app.approvalId}</span>
                  <Link
                    href={`/tickets/${app.ticketId}`}
                    className="inline-flex items-center gap-1 text-xs font-mono text-slate-300 hover:text-indigo-300 bg-slate-950 px-2.5 py-1 rounded border border-slate-800 transition-colors"
                  >
                    <span>Ticket: {app.ticketId}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                  <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                    WO: {app.workOrderId}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                      app.status === 'APPROVED'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : app.status === 'REJECTED'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {app.status}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {app.createdAt ? app.createdAt.replace('T', ' ').slice(0, 16) : '—'}
                  </span>
                </div>
              </div>

              {/* Message Details */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Message Subject & Body */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[11px] block">Drafted Email Subject:</span>
                    <span className="text-slate-100 font-mono font-semibold text-xs">{app.message?.subject}</span>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[11px] block mb-2">Drafted Message Content:</span>
                    <pre className="text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                      {app.message?.message}
                    </pre>
                  </div>
                </div>

                {/* Right: Facts Used & Citations & Controls */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Facts Used */}
                  <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Facts Grounding Checklist:
                    </span>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {app.message?.factsUsed?.map((f, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Citations */}
                  {app.message?.citations && app.message.citations.length > 0 && (
                    <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                        Source Citations:
                      </span>
                      <div className="space-y-1 text-[11px]">
                        {app.message.citations.map((c, i) => (
                          <div key={i} className="font-mono text-indigo-400">
                            • {c.sourceFile} ({c.field})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Approval / Rejection Controls or History Log */}
                  {app.status === 'PENDING' ? (
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                        Authorize Dispatch:
                      </span>

                      {rejectingId !== app.approvalId ? (
                        <div className="space-y-2.5">
                          <input
                            type="text"
                            placeholder="Optional authorization notes..."
                            value={notesState[app.approvalId] || ''}
                            onChange={(e) =>
                              setNotesState({ ...notesState, [app.approvalId]: e.target.value })
                            }
                            className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded p-2 focus:outline-none focus:border-indigo-500"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(app.approvalId)}
                              disabled={actionLoadingId === app.approvalId}
                              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition-colors disabled:opacity-50"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Authorize & Send</span>
                            </button>
                            <button
                              onClick={() => setRejectingId(app.approvalId)}
                              disabled={actionLoadingId === app.approvalId}
                              className="px-3 py-2 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 font-semibold rounded-lg text-xs transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 p-2.5 bg-slate-900 rounded border border-rose-800">
                          <span className="text-rose-300 font-medium text-[11px] block">
                            State Rejection Reason:
                          </span>
                          <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Why is this notification rejected?"
                            className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-xs rounded p-2 focus:outline-none focus:border-rose-500"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReject(app.approvalId)}
                              disabled={actionLoadingId === app.approvalId}
                              className="flex-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded text-xs"
                            >
                              Confirm Rejection
                            </button>
                            <button
                              onClick={() => {
                                setRejectingId(null);
                                setRejectionReason('');
                              }}
                              className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Processed By:</span>
                        <span className="font-mono text-slate-300">{app.actor || 'dispatcher_control'}</span>
                      </div>
                      {app.approvedAt && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Approved At:</span>
                          <span className="font-mono text-slate-300">{app.approvedAt.replace('T', ' ').slice(0, 19)}</span>
                        </div>
                      )}
                      {app.rejectedAt && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Rejected At:</span>
                          <span className="font-mono text-rose-400">{app.rejectedAt.replace('T', ' ').slice(0, 19)}</span>
                        </div>
                      )}
                      {app.approvalNotes && (
                        <div className="text-slate-300 pt-1 border-t border-slate-800">
                          <span className="text-slate-500">Notes:</span> {app.approvalNotes}
                        </div>
                      )}
                      {app.rejectionReason && (
                        <div className="text-rose-300 pt-1 border-t border-slate-800">
                          <span className="text-rose-500">Rejection Reason:</span> {app.rejectionReason}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
