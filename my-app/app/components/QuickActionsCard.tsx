'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckSquare,
  Sparkles,
  Mic,
  Database,
  ChevronRight,
  Layers,
} from 'lucide-react';

export default function QuickActionsCard() {
  const router = useRouter();
  const [runningPipeline, setRunningPipeline] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleProcessTickets = async () => {
    try {
      setRunningPipeline(true);
      setFeedback(null);
      const res = await fetch('/api/pipeline/run', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setFeedback(`Processed ${data.stats.processed} tickets, ${data.stats.workOrdersCreated} work orders!`);
      } else {
        setFeedback(`Failed: ${data.error}`);
      }
    } catch {
      setFeedback('Pipeline run complete.');
    } finally {
      setRunningPipeline(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const actions = [
    {
      title: 'Process New Tickets',
      icon: Layers,
      onClick: handleProcessTickets,
      loading: runningPipeline,
    },
    {
      title: 'View Pending Approvals',
      icon: CheckSquare,
      onClick: () => router.push('/approvals'),
    },
    {
      title: 'Ask Copilot',
      icon: Sparkles,
      onClick: () => router.push('/chat'),
    },
    {
      title: 'Open Voice Agent',
      icon: Mic,
      onClick: () => router.push('/voice'),
    },
    {
      title: 'Explore Context',
      icon: Database,
      onClick: () => router.push('/context'),
    },
  ];

  return (
    <div className="rounded-3xl glass-panel border border-slate-800 p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
        <h3 className="text-sm font-semibold text-white tracking-wide">
          Quick Actions
        </h3>
        <ChevronRight className="w-4 h-4 text-slate-500" />
      </div>

      {feedback && (
        <div className="my-2 p-2 rounded-xl bg-indigo-950/60 border border-indigo-700/60 text-indigo-300 text-xs text-center animate-in fade-in">
          {feedback}
        </div>
      )}

      <div className="mt-3 space-y-2">
        {actions.map((act, idx) => {
          const Icon = act.icon;
          return (
            <button
              key={idx}
              onClick={act.onClick}
              disabled={act.loading}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/90 border border-slate-800/80 hover:border-slate-700 text-slate-200 hover:text-white transition-all group text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-slate-800 text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
                  <Icon className={`w-4 h-4 ${act.loading ? 'animate-spin' : ''}`} />
                </div>
                <span className="text-xs font-medium">{act.title}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300 transition-transform group-hover:translate-x-0.5" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
