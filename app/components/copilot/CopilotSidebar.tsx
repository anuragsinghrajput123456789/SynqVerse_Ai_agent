'use client';

import React from 'react';
import { Plus, ChevronRight, ShieldCheck } from 'lucide-react';
import Button from '../ui/Button';

interface CopilotSidebarProps {
  chatSessions: string[];
  activeSession: string;
  onSelectSession: (session: string) => void;
  onClearChat: () => void;
}

export default function CopilotSidebar({
  chatSessions,
  activeSession,
  onSelectSession,
  onClearChat,
}: CopilotSidebarProps) {
  return (
    <div className="lg:col-span-3 hidden lg:flex flex-col justify-between rounded-3xl glass-panel border border-slate-800 p-4">
      <div className="space-y-4">
        <Button
          variant="primary"
          size="sm"
          onClick={onClearChat}
          className="w-full"
          icon={<Plus className="w-4 h-4" />}
        >
          New Conversation
        </Button>

        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2">
            Recent Inquiries
          </span>
          <div className="space-y-1 mt-2">
            {chatSessions.map((session) => {
              const isActive = activeSession === session;
              return (
                <button
                  key={session}
                  onClick={() => onSelectSession(session)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <span className="truncate">{session}</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Operational Guardrail Callout */}
      <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5 text-[11px]">
        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Strict Zero-Hallucination</span>
        </div>
        <p className="text-slate-400">
          Grounded strictly on ingested spreadsheets, tickets, and verified dispatcher rules.
        </p>
      </div>
    </div>
  );
}
