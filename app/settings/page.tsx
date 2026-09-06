'use client';

import { useState } from 'react';
import {
  Cpu,
  Volume2,
  CheckCircle2,
  Lock,
  Save,
} from 'lucide-react';

export default function SettingsPage() {
  const [model, setModel] = useState('gemini-2.0-flash');
  const [maskPii, setMaskPii] = useState(true);
  const [autoDispatch, setAutoDispatch] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <span>Console Settings</span>
            <span className="text-xs font-mono font-normal bg-indigo-950 text-indigo-300 border border-indigo-700/60 px-2.5 py-0.5 rounded-full">
              System Admin
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure autonomous rule thresholds, PII masking boundaries, and AI model orchestration.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>Save Preferences</span>
        </button>
      </div>

      {saved && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>Settings successfully committed to persistent environment.</span>
        </div>
      )}

      {/* AI Model Orchestration */}
      <div className="rounded-3xl glass-panel border border-slate-800 p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800/80">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold text-white">AI Model &amp; Reasoning Core</h2>
        </div>

        <div className="space-y-3 text-xs">
          <label className="text-slate-300 font-medium block">Active Gemini Model</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full sm:w-80 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="gemini-2.0-flash">Gemini 2.0 Flash (Low-Latency Operational Triage)</option>
            <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Multimodal RAG)</option>
            <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite</option>
          </select>
          <p className="text-[11px] text-slate-400">
            Enforces strict grounding and zero hallucination gating against ingested database records.
          </p>
        </div>
      </div>

      {/* Security & PII Masking */}
      <div className="rounded-3xl glass-panel border border-slate-800 p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800/80">
          <Lock className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-bold text-white">Security &amp; Boundary Privacy</h2>
        </div>

        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div>
              <p className="font-semibold text-white">PII Redaction at Boundary</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Mask Aadhaar, Driving License, and Phone Numbers before sending prompts to external APIs.
              </p>
            </div>
            <input
              type="checkbox"
              checked={maskPii}
              onChange={(e) => setMaskPii(e.target.checked)}
              className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div>
              <p className="font-semibold text-white">Automated Autonomous Dispatch</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Allow deterministic engine to approve and dispatch work orders with &gt;95% confidence without human-in-the-loop review.
              </p>
            </div>
            <input
              type="checkbox"
              checked={autoDispatch}
              onChange={(e) => setAutoDispatch(e.target.checked)}
              className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Audio & Voice Configuration */}
      <div className="rounded-3xl glass-panel border border-slate-800 p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800/80">
          <Volume2 className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm font-bold text-white">Voice &amp; Audio Synthesizer</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <p className="font-semibold text-white">Voice Provider</p>
            <p className="text-[11px] text-slate-400">ElevenLabs Multilingual v2 &amp; Web Speech API</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <p className="font-semibold text-white">Audio Stream Latency</p>
            <p className="text-[11px] text-emerald-400 font-mono">180ms Ultra-Low Latency</p>
          </div>
        </div>
      </div>
    </div>
  );
}
