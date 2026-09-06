'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  CheckCircle2,
  Shield,
} from 'lucide-react';
import { ApprovalRecord } from '@/lib/approvals';

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'HISTORY'>('PENDING');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const [notesState] = useState<Record<string, string>>({});
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchApprovals = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

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

  const displayed = activeTab === 'PENDING' ? pendingApprovals : historyApprovals;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <span>Dispatcher Approvals</span>
            <span className="text-xs font-mono font-normal bg-amber-950 text-amber-300 border border-amber-700/60 px-2.5 py-0.5 rounded-full">
              {pendingApprovals.length} Pending
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Human-in-the-loop governance desk for AI-drafted client communications and emergency work orders.
          </p>
        </div>

        <button
          onClick={fetchApprovals}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'PENDING'
              ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          Pending Review ({pendingApprovals.length})
        </button>
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'HISTORY'
              ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          Decision History ({historyApprovals.length})
        </button>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-700/60 text-indigo-200 text-xs flex items-center gap-3 animate-in fade-in">
          <Shield className="w-4 h-4 text-indigo-400 shrink-0" />
          <div className="flex-1">{actionMessage}</div>
        </div>
      )}

      {/* Cards List */}
      {displayed.length === 0 ? (
        <div className="rounded-3xl glass-panel border border-slate-800 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center mx-auto text-slate-500">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-base font-bold text-white">All Clear</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {activeTab === 'PENDING'
              ? 'No pending client drafts require dispatcher approval at this moment.'
              : 'No historical approvals recorded yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayed.map((item) => (
            <div
              key={item.approvalId}
              className="rounded-3xl glass-panel border border-slate-800 p-6 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-sm text-indigo-400">
                    {item.approvalId}
                  </span>
                  <span className="text-xs text-slate-500">·</span>
                  <Link
                    href={`/tickets/${item.ticketId}`}
                    className="text-xs font-mono text-cyan-400 hover:underline"
                  >
                    {item.ticketId}
                  </Link>
                </div>

                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    item.status === 'APPROVED'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : item.status === 'REJECTED'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {item.status}
                </span>
              </div>

              {/* Message Draft */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  AI-Drafted Client Message
                </span>
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 text-xs text-slate-200 leading-relaxed font-mono">
                  {item.message?.message || item.message?.subject || 'Approval required for emergency roadside dispatch.'}
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 py-1">
                <div>
                  <span className="text-[10px] text-slate-500 block">Recipient</span>
                  <span className="text-slate-200 font-semibold">Client Dispatch Desk</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Work Order</span>
                  <span className="text-cyan-300 font-mono">{item.workOrderId}</span>
                </div>
              </div>

              {/* Actions */}
              {item.status === 'PENDING' && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleApprove(item.approvalId)}
                      disabled={actionLoadingId === item.approvalId}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
                    >
                      {actionLoadingId === item.approvalId ? 'Approving...' : 'Approve & Send'}
                    </button>
                    <button
                      onClick={() => setRejectingId(rejectingId === item.approvalId ? null : item.approvalId)}
                      className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-rose-300 font-semibold text-xs transition-all cursor-pointer"
                    >
                      Reject / Edit
                    </button>
                  </div>

                  {rejectingId === item.approvalId && (
                    <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-700 space-y-2 animate-in fade-in">
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="State reason for rejecting draft..."
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-rose-500"
                        rows={2}
                      />
                      <button
                        onClick={() => handleReject(item.approvalId)}
                        disabled={actionLoadingId === item.approvalId}
                        className="py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
                      >
                        Confirm Rejection
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
