'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  FileCode,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { DocumentAnalysisResult, ExtractedLogisticsRecord } from '../api/data/analyze/route';

interface SamplePayload {
  fileName: string;
  fileType: string;
  rawText: string;
}

export default function DataStudioPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<DocumentAnalysisResult | null>(null);
  const [queryInput, setQueryInput] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryAnswer, setQueryAnswer] = useState<{
    query: string;
    answer: string;
    matchedRecords: ExtractedLogisticsRecord[];
    statsHighlight?: string;
  } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState<string>('');

  const handleFileUpload = async (file: File) => {
    setIsAnalyzing(true);
    setQueryAnswer(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (queryInput.trim()) {
        formData.append('query', queryInput);
      }

      const res = await fetch('/api/data/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Upload analysis failed (${res.status})`);
      }

      const data = await res.json();
      if (data.success) {
        setAnalysisResult(data.analysis);
        if (data.queryAnswer) {
          setQueryAnswer(data.queryAnswer);
        }
      }
    } catch (err) {
      console.error('File upload analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSampleLoad = async (type: 'excel' | 'csv' | 'pdf') => {
    setIsAnalyzing(true);
    setQueryAnswer(null);

    let sampleData: SamplePayload;
    if (type === 'excel') {
      sampleData = {
        fileName: 'national_corridor_fleet_telemetry.xlsx',
        fileType: 'Excel Spreadsheet (.xlsx)',
        rawText: `
Vehicle ID, Driver Name, Corridor, Status, Delay Hours, Estimated Cost, Notes
TRK-104, Devin Sibal, Delhi ↔ Dharuhera (NH-48), BREAKDOWN, 3.5, 24500, Radiator failure & loss of engine coolant on shoulder
TRK-102, Hardik Saini, Lucknow ↔ Kanpur Toll, DELAYED, 2.0, 3200, Rear dual axle puncture near toll plaza
TRK-108, Alexander Chander, Gurgaon ↔ Lucknow (NH-19), ACTIVE, 0, 0, Nominal transit speed 52 km/h on schedule
TRK-112, Charan Chanda, Jaipur ↔ Delhi (NH-48), ACTIVE, 0, 0, Bulk cement cargo in transit nominal
TRK-115, Advik Maharaj, Ambala Hub Workshop, MAINTENANCE, 0, 12800, Scheduled 50000 km brake pad overhaul
TRK-120, Sunil Yadav, Bengaluru ↔ Chennai Corridor, DELAYED, 1.5, 0, Monsoon rain congestion near Krishnagiri
TRK-124, Rajesh Verma, Ludhiana ↔ Ambala Hub, ACTIVE, 0, 0, Express freight transit nominal
TRK-129, Vikram Mehra, Delhi ↔ Jaipur (NH-48), CRITICAL, 4.0, 38000, Transmission slip & oil pressure drop
        `,
      };
    } else if (type === 'csv') {
      sampleData = {
        fileName: 'fleet_incident_master_log.csv',
        fileType: 'CSV Dataset (.csv)',
        rawText: `
id,vehicleId,driver,status,delayHours,repairCost,notes
REC-501,UP17GN7381,Devin Sibal,BREAKDOWN,4.2,28000,Engine overheating alarm triggered on NH-48
REC-502,DL30AN8381,David Radhakrishnan,ACTIVE,0,0,Nominal linehaul dispatch
REC-503,RJ43DD3546,Charan Chanda,ACTIVE,0,0,On-schedule bulk delivery
REC-504,UP13DI3925,Hardik Saini,DELAYED,2.5,4500,Highway toll congestion & dual tire inspection
REC-505,HR73CY1771,Advik Maharaj,NOMINAL,0,0,Full safety clearance verified
REC-506,PB31NP8886,Dalaja Chahal,MAINTENANCE,0,15000,Alternator and battery voltage recalibration
        `,
      };
    } else {
      sampleData = {
        fileName: 'operations_breakdown_audit_report.pdf',
        fileType: 'PDF Document (.pdf)',
        rawText: `
OPERATIONAL AUDIT REPORT - NORTH REGION HIGHWAY CORRIDORS
Date: 2026-09-06 | Security Classification: Internal Operations
Executive Summary:
Vehicle TRK-104 (Driver: Devin Sibal) suffered catastrophic radiator breakdown on NH-48 KM 72 Dharuhera section.
Estimated repair cost: Rs 24,500. Roadside escort unit dispatched.
Vehicle TRK-102 (Driver: Hardik Saini) reported 2.0 hour delay due to puncture at Lucknow toll. Cost: Rs 3,200.
Vehicle TRK-129 flagged critical breakdown on NH-48 transmission failure with Rs 38,000 estimated repair.
All other linehaul units TRK-108, TRK-112, TRK-124 operating on nominal transit schedule.
        `,
      };
    }

    try {
      const res = await fetch('/api/data/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sampleData),
      });
      const data = await res.json();
      if (data.success) {
        setAnalysisResult(data.analysis);
      }
    } catch (err) {
      console.error('Failed to load sample data:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleQuery = async (queryText?: string) => {
    const q = queryText || queryInput;
    if (!q.trim() || !analysisResult) return;

    setQueryLoading(true);
    try {
      const res = await fetch('/api/data/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records: analysisResult.records,
          fileName: analysisResult.fileName,
          fileType: analysisResult.fileType,
          query: q,
        }),
      });
      const data = await res.json();
      if (data.success && data.queryAnswer) {
        setQueryAnswer(data.queryAnswer);
      }
    } catch (err) {
      console.error('Query error:', err);
    } finally {
      setQueryLoading(false);
    }
  };

  const filteredRecords = (analysisResult?.records || []).filter((r) => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      return (
        r.vehicleId.toLowerCase().includes(q) ||
        r.driverName.toLowerCase().includes(q) ||
        r.corridor.toLowerCase().includes(q) ||
        r.notes.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-bold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-widest">
              Data Studio & Extraction
            </span>
            <span className="text-xs text-slate-400">• Multi-Format Ingestion</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 flex items-center gap-3">
            Document Intelligence & Query Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Upload Excel (.xlsx), CSV, PDF reports, or JSON datasets to extract fleet status insights and run natural language queries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/map"
            className="px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700/60 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
          >
            Live Map Radar
          </Link>
          <Link
            href="/safety"
            className="px-3.5 py-2 rounded-xl bg-rose-950/40 border border-rose-500/40 hover:bg-rose-900/50 text-xs font-medium text-rose-300 transition"
          >
            Safety Desk
          </Link>
        </div>
      </div>

      {/* Upload Zone & Quick Sample Loaders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Drag-and-Drop Area (2 Cols) */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`lg:col-span-2 relative rounded-3xl border-2 border-dashed p-8 transition-all flex flex-col items-center justify-center text-center backdrop-blur-xl ${
            isDragging
              ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
              : 'border-white/15 bg-slate-900/60 hover:border-indigo-500/40'
          }`}
        >
          <input
            type="file"
            id="file-upload"
            accept=".xlsx,.xls,.csv,.pdf,.json,.txt"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-400 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30 mb-4 animate-bounce">
            <UploadCloud className="w-8 h-8" />
          </div>

          <label
            htmlFor="file-upload"
            className="text-base sm:text-lg font-bold text-white cursor-pointer hover:text-indigo-300 transition"
          >
            Click to upload or drag & drop files here
          </label>

          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Accepts Excel (.xlsx, .xls), CSV, PDF inspection reports, and structured JSON logs.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950/60 border border-white/5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Excel (.xlsx)
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950/60 border border-white/5">
              <FileText className="w-3.5 h-3.5 text-rose-400" /> PDF Reports (.pdf)
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950/60 border border-white/5">
              <FileCode className="w-3.5 h-3.5 text-cyan-400" /> CSV / JSON
            </span>
          </div>

          {isAnalyzing && (
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-indigo-300 bg-indigo-950/60 border border-indigo-500/30 px-4 py-2 rounded-xl animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Parsing document and extracting fleet status intelligence...</span>
            </div>
          )}
        </div>

        {/* Quick Sample Dataset Cards (1 Col) */}
        <div className="glass-panel p-5 rounded-3xl border border-white/10 flex flex-col justify-between space-y-3">
          <div>
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Pre-Loaded Test Datasets
            </span>
            <p className="text-xs text-slate-400 mt-1">
              Test the extraction and query engine immediately without searching your local files:
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => handleSampleLoad('excel')}
              disabled={isAnalyzing}
              className="w-full text-left p-3 rounded-2xl bg-slate-950/60 border border-white/5 hover:border-emerald-500/40 hover:bg-slate-900 transition group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  Fleet Corridors Telemetry (.xlsx)
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition" />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">8 vehicles with breakdowns & delay hours</p>
            </button>

            <button
              onClick={() => handleSampleLoad('csv')}
              disabled={isAnalyzing}
              className="w-full text-left p-3 rounded-2xl bg-slate-950/60 border border-white/5 hover:border-cyan-500/40 hover:bg-slate-900 transition group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-cyan-400" />
                  Incident Breakdown Master (.csv)
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition" />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Historical breakdown costs & repair logs</p>
            </button>

            <button
              onClick={() => handleSampleLoad('pdf')}
              disabled={isAnalyzing}
              className="w-full text-left p-3 rounded-2xl bg-slate-950/60 border border-white/5 hover:border-rose-500/40 hover:bg-slate-900 transition group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-400" />
                  Highway Audit Report (.pdf)
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-400 group-hover:translate-x-0.5 transition" />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Unstructured text inspection memo</p>
            </button>
          </div>
        </div>
      </div>

      {/* Analysis Results & Query Engine */}
      {analysisResult && (
        <div className="space-y-6">
          {/* Top Status & KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Total Extracted</span>
                <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-black text-white">
                  {analysisResult.summary.totalRecords}
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">Source: {analysisResult.fileName}</p>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-emerald-300">
                <span>Fleet Operational Rate</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                  {analysisResult.summary.operationalRatePct}%
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {analysisResult.summary.nominalCount} nominal units
                </p>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-amber-300">
                <span>Delayed Units</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-black text-amber-400">
                  {analysisResult.summary.delayedCount}
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {analysisResult.summary.totalDelayHours} hours total slip
                </p>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-rose-300">
                <span>Critical / Breakdowns</span>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-black text-rose-400">
                  {analysisResult.summary.criticalBreakdownCount}
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  ₹{analysisResult.summary.totalEstimatedCost.toLocaleString('en-IN')} est. cost
                </p>
              </div>
            </div>
          </div>

          {/* AI Insights & Prescriptive Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                Automated Status Insights
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {analysisResult.insights.map((ins, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                    <span>{ins}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Prescriptive Dispatch Recommendations
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {analysisResult.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Natural Language AI Query Runner */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  Query Uploaded Data with AI
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ask natural language questions to compute metrics, filter trucks, or assess risks.
                </p>
              </div>
            </div>

            {/* Input Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="e.g. Which trucks are delayed? What is the total estimated repair cost?"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleQuery();
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/60 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              </div>
              <button
                onClick={() => handleQuery()}
                disabled={queryLoading || !queryInput.trim()}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
              >
                {queryLoading ? 'Analyzing...' : 'Run Query'}
              </button>
            </div>

            {/* Quick Query Suggestion Chips */}
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                'Which vehicles are delayed?',
                'What is the total estimated repair cost?',
                'Show critical breakdown emergencies',
                'List all active corridors',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setQueryInput(suggestion);
                    handleQuery(suggestion);
                  }}
                  className="px-3 py-1 rounded-lg text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/5 transition"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {/* Query Answer Display */}
            {queryAnswer && (
              <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    Query Answer: "{queryAnswer.query}"
                  </span>
                  {queryAnswer.statsHighlight && (
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-200 border border-indigo-500/30">
                      {queryAnswer.statsHighlight}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-200 leading-relaxed">{queryAnswer.answer}</p>

                {queryAnswer.matchedRecords.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                      Matched Telemetry Records ({queryAnswer.matchedRecords.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {queryAnswer.matchedRecords.slice(0, 6).map((rec) => (
                        <div
                          key={rec.id}
                          className="p-2.5 rounded-xl bg-slate-950/80 border border-white/5 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white font-mono">{rec.vehicleId}</span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                rec.status === 'BREAKDOWN' || rec.status === 'CRITICAL'
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : rec.status === 'DELAYED'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-emerald-500/20 text-emerald-300'
                              }`}
                            >
                              {rec.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">{rec.driverName}</p>
                          <p className="text-[10px] text-slate-500 truncate">{rec.corridor}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Extracted Records Data Table */}
          <div className="glass-panel p-5 rounded-3xl border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Extracted Fleet Telemetry ({filteredRecords.length} of {analysisResult.records.length})
                </h3>
                <p className="text-xs text-slate-400">Structured tabular extraction ready for dispatch</p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Filter table..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-950/80 border border-slate-700/60 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-950/80 border border-slate-700/60 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active / Nominal</option>
                  <option value="DELAYED">Delayed</option>
                  <option value="BREAKDOWN">Breakdown</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/5">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-[10px] uppercase font-bold text-slate-400 border-b border-white/5">
                  <tr>
                    <th className="p-3">Vehicle ID</th>
                    <th className="p-3">Driver</th>
                    <th className="p-3">Corridor</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Delay</th>
                    <th className="p-3">Est. Cost</th>
                    <th className="p-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-slate-900/40">
                  {filteredRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 font-mono font-bold text-white">{rec.vehicleId}</td>
                      <td className="p-3 text-slate-200">{rec.driverName}</td>
                      <td className="p-3 text-slate-400">{rec.corridor}</td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            rec.status === 'BREAKDOWN' || rec.status === 'CRITICAL'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : rec.status === 'DELAYED'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : rec.status === 'MAINTENANCE'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">
                        {rec.delayHours > 0 ? `${rec.delayHours}h` : '—'}
                      </td>
                      <td className="p-3 text-slate-400">
                        {rec.estimatedCost > 0 ? `₹${rec.estimatedCost.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="p-3 text-slate-400 max-w-xs truncate">{rec.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
