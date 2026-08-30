'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  AlertOctagon,
  XCircle,
  Truck,
  Wrench,
  Shield,
  FileText,
  Clock,
  Sparkles,
  RefreshCw,
  Scale,
  Compass,
} from 'lucide-react';
import { DecisionRecord, CandidateEvaluation, DispatcherRule, SourceCitation } from '@/lib/types';

export default function IncidentDecisionPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const resolvedParams = use(params);
  const ticketId = resolvedParams.ticketId;

  const [decision, setDecision] = useState<DecisionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [reEvaluating, setReEvaluating] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadDecision() {
      try {
        const res = await fetch(`/api/decisions/${ticketId}`);
        const json = await res.json();
        if (isMounted) {
          setDecision(json);
        }
      } catch (err) {
        console.error('Failed to load incident decision:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadDecision();
    return () => {
      isMounted = false;
    };
  }, [ticketId]);

  const handleReEvaluate = async () => {
    setReEvaluating(true);
    try {
      const res = await fetch('/api/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId }),
      });
      if (res.ok) {
        const json = await res.json();
        setDecision(json);
      }
    } catch (err) {
      console.error('Re-evaluation error:', err);
    } finally {
      setReEvaluating(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="px-3 py-1 bg-red-950/80 text-red-400 border border-red-800 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
            <AlertOctagon className="w-3.5 h-3.5" />
            CRITICAL SEVERITY
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-3 py-1 bg-rose-950/80 text-rose-300 border border-rose-800 rounded-full text-xs font-semibold flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5" />
            HIGH SEVERITY
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-3 py-1 bg-amber-950/80 text-amber-300 border border-amber-800 rounded-full text-xs font-semibold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            MEDIUM SEVERITY
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-full text-xs font-medium">
            {severity}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
          Evaluating operational decision for ticket {ticketId}...
        </div>
      </div>
    );
  }

  if (!decision || decision.decisionStatus === 'INSUFFICIENT_DATA') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex flex-col items-center justify-center space-y-4">
        <AlertOctagon className="w-12 h-12 text-amber-400" />
        <h2 className="text-xl font-bold">Decision Status: Insufficient Data</h2>
        <p className="text-slate-400 text-sm max-w-md text-center">
          {decision?.explanation || `No verified context or breakdown ticket available for '${ticketId}'. Automated decision aborted to prevent incorrect dispatch.`}
        </p>
        <Link
          href="/queue"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold text-white transition-all"
        >
          Back to Breakdown Queue
        </Link>
      </div>
    );
  }

  const {
    severity,
    action,
    actionReason,
    selectedVehicle,
    rejectedCandidates,
    rulesApplied,
    explanation,
    sources,
    evidence,
  } = decision;

  const ticketEvidence = (evidence?.ticket as Record<string, unknown>) || {};
  const vehicleEvidence = (evidence?.vehicleContext as Record<string, unknown>) || {};

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-10">
      {/* Header */}
      <header className="max-w-6xl mx-auto space-y-4 mb-8 pb-6 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <Link
            href="/queue"
            className="inline-flex items-center gap-2 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Breakdown Queue
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-xs font-semibold text-indigo-400">
            <Scale className="w-3.5 h-3.5" />
            Module 2: Decision Engine
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-mono font-extrabold text-slate-100">{ticketId}</h1>
              {getSeverityBadge(severity)}
              <span className="px-3 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-semibold">
                Action: {action}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Decision ID: <span className="text-slate-300">{decision.decisionId}</span> • Generated: {decision.createdAt?.replace('T', ' ').slice(0, 19)}
            </p>
          </div>

          <button
            onClick={handleReEvaluate}
            disabled={reEvaluating}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reEvaluating ? 'animate-spin' : ''}`} />
            Re-evaluate Decision
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-6">
        {/* SECTION 1: BREAKDOWN INCIDENT CONTEXT */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm uppercase tracking-wider">
              <Wrench className="w-4 h-4" />
              Breakdown Incident Context
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Reported: {String(ticketEvidence.createdAt || '').replace('T', ' ')}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
              <span className="text-slate-500 block mb-1">Broken Vehicle</span>
              <span className="font-mono font-bold text-slate-200 text-sm">{String(ticketEvidence.vehicle || '—')}</span>
              {vehicleEvidence.model ? (
                <div className="text-slate-400 text-[11px] mt-0.5">{String(vehicleEvidence.model)} ({String(vehicleEvidence.year || '')})</div>
              ) : null}
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
              <span className="text-slate-500 block mb-1">Driver (PII Protected)</span>
              <span className="font-semibold text-slate-200">{String(ticketEvidence.driverId || '—')}</span>
              <div className="text-emerald-400 text-[11px] mt-0.5 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Phone: [REDACTED]
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
              <span className="text-slate-500 block mb-1">Route & Location</span>
              <span className="font-semibold text-slate-200">{String(ticketEvidence.originHub || '—')} → {String(ticketEvidence.destination || '—')}</span>
              <div className="text-slate-400 text-[11px] mt-0.5">{String(ticketEvidence.kmFromOriginHub || 0)} km from origin hub</div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
              <span className="text-slate-500 block mb-1">Client & SLA</span>
              <span className="font-semibold text-slate-200">{String(ticketEvidence.client || '—')}</span>
              <div className="text-indigo-400 text-[11px] font-bold mt-0.5">
                {decision.slaDeadlineHours}h Operational SLA
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 text-xs">
            <span className="text-slate-500 font-semibold block mb-1">Reported Failure Issue:</span>
            <span className="text-slate-200 text-sm font-medium">{String(ticketEvidence.issue || '—')}</span>
          </div>
        </div>

        {/* SECTION 2 & 3: OPERATIONAL ACTION & SELECTED REPLACEMENT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Action Decision Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm uppercase tracking-wider">
              <Compass className="w-4 h-4" />
              Operational Action Decision
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-semibold">Recommended Action:</span>
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg font-mono font-bold text-xs">
                  {action}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-slate-800/80">
                {actionReason}
              </p>
            </div>

            {decision.transitBufferPercentage ? (
              <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-xl text-xs space-y-1">
                <span className="text-amber-300 font-semibold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Monsoon Eastern Buffer Applied (+{decision.transitBufferPercentage}%)
                </span>
                <p className="text-slate-400 text-[11px]">
                  Rule R-011: Transit ETA adjusted for rain waterlogging and approach road diversions.
                </p>
              </div>
            ) : null}
          </div>

          {/* Selected Replacement Vehicle Card */}
          <div className="bg-slate-900/80 border border-indigo-500/30 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm uppercase tracking-wider">
                <Truck className="w-4 h-4" />
                Selected Replacement Vehicle
              </div>
              {selectedVehicle && (
                <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-[11px] font-semibold">
                  Best Ranked Candidate
                </span>
              )}
            </div>

            {selectedVehicle ? (
              <div className="space-y-3 text-xs">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-base font-bold text-slate-100">{selectedVehicle.registrationNumber}</span>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[11px] font-semibold">
                      ELIGIBLE
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                    <div>Model: <span className="text-slate-200">{selectedVehicle.model}</span></div>
                    <div>Year: <span className="text-slate-200">{selectedVehicle.year}</span></div>
                    <div>BS Stage: <span className="text-slate-200 font-mono">{selectedVehicle.bsStage}</span></div>
                    <div>Home Hub: <span className="text-slate-200">{selectedVehicle.homeHub}</span></div>
                    <div>Capacity: <span className="text-slate-200">{selectedVehicle.capacityTonnes} Tonnes</span></div>
                    <div>Distance: <span className="text-indigo-400 font-bold">{selectedVehicle.distanceKm} km</span></div>
                  </div>
                </div>

                {/* Eligibility Checklist */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1.5 text-[11px]">
                  <span className="text-slate-400 font-semibold block mb-1">Verified Constraints:</span>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active fleet inventory & available payload capacity</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Complies with winter Delhi NCR BS6 and hill engine heater rules</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Client SLA and vehicle model year requirements satisfied</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 bg-slate-950 rounded-xl border border-rose-900/40 text-center space-y-2">
                <AlertOctagon className="w-8 h-8 text-rose-500 mx-auto" />
                <div className="text-sm font-semibold text-rose-400">No Eligible Replacement Found</div>
                <p className="text-xs text-slate-500">
                  All available candidate vehicles were rejected by active dispatcher constraints.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 4: WHY THIS DECISION? (RULES & EXPLANATION) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            Why This Decision? (Deterministic Rules & Reasoning)
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-sm text-slate-200 leading-relaxed">
            {explanation}
          </div>

          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Enforced Dispatcher Rules ({rulesApplied.length})
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {rulesApplied.map((rule: DispatcherRule, idx: number) => (
                <div key={idx} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-indigo-400">{rule.ruleId}: {rule.name}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-400 rounded">
                      Priority {rule.priority}
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{rule.description}</p>
                  <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono truncate">
                    Source: {rule.sourceReference}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 5: REJECTED ALTERNATIVES */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm uppercase tracking-wider">
              <XCircle className="w-4 h-4" />
              Rejected Candidate Alternatives ({rejectedCandidates.length})
            </div>
            <span className="text-xs text-slate-500">Filtered out by deterministic constraints</span>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {rejectedCandidates.length === 0 ? (
              <div className="p-4 bg-slate-950 rounded-xl text-center text-xs text-slate-500">
                No candidate alternatives were rejected.
              </div>
            ) : (
              rejectedCandidates.map((cand: CandidateEvaluation, idx: number) => (
                <div key={idx} className="p-4 bg-rose-950/10 border border-rose-900/30 rounded-xl text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-200">{cand.registrationNumber}</span>
                      <span className="text-slate-400">({cand.model}, {cand.year}, {cand.bsStage})</span>
                    </div>
                    <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 rounded text-[10px] font-bold">
                      REJECTED
                    </span>
                  </div>

                  <div className="text-rose-300 space-y-1">
                    {cand.reasons.map((reason, rIdx) => (
                      <div key={rIdx} className="flex items-start gap-1.5">
                        <span className="text-rose-500 font-bold">•</span>
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>

                  {cand.rejectedRules.length > 0 && (
                    <div className="pt-2 border-t border-rose-900/30 flex flex-wrap gap-2 text-[10px]">
                      {cand.rejectedRules.map((r, rId) => (
                        <span key={rId} className="px-2 py-0.5 bg-rose-950 text-rose-400 rounded border border-rose-800/40">
                          Violated: {r.ruleId} ({r.name})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* SECTION 6: SOURCE PROVENANCE */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 text-xs text-slate-400 space-y-2">
          <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            Decision Provenance & Cited Sources ({sources.length})
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {sources.map((s: SourceCitation, idx: number) => (
              <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-[11px]">
                <div className="font-mono text-indigo-400 font-semibold">{s.sourceId}</div>
                <div className="text-slate-300">{s.sourceFile} ({s.sourceType})</div>
                <div className="text-slate-500 text-[10px]">{s.resolutionReason}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
