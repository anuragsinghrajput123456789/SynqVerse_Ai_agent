'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  AlertOctagon,
  Layers,
  CheckSquare,
  Sparkles,
  Mic,
  Activity,
  BarChart3,
  Settings,
  Truck,
  X,
  ArrowRight,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickActions = [
    { title: 'Dashboard Overview', href: '/dashboard', icon: LayoutDashboard, category: 'Navigation' },
    { title: 'Active Incidents & Breakdowns', href: '/incidents', icon: AlertOctagon, category: 'Incidents' },
    { title: 'Context Explorer', href: '/context', icon: Layers, category: 'Data Hub' },
    { title: 'Pending Dispatcher Approvals', href: '/approvals', icon: CheckSquare, category: 'Operations' },
    { title: 'Operations Copilot', href: '/copilot', icon: Sparkles, category: 'AI Assistant' },
    { title: 'Voice Dispatcher Agent', href: '/voice', icon: Mic, category: 'Voice' },
    { title: 'Forensic Audit Trail', href: '/audit', icon: Activity, category: 'Security' },
    { title: 'Fleet & SLA Reports', href: '/reports', icon: BarChart3, category: 'Analytics' },
    { title: 'Console Settings', href: '/settings', icon: Settings, category: 'System' },
    { title: 'Vehicle TRK-104 (UP-60-BK-0144)', href: '/tickets/BRK-1042', icon: Truck, category: 'Quick Entity' },
  ];

  const filtered = quickActions.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-[#0d1428]/95 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden shadow-indigo-500/10 backdrop-blur-xl animate-in zoom-in-95 duration-150">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anything: tickets, vehicles, rules, destinations..."
            className="w-full px-3 py-1 bg-transparent text-white text-sm placeholder-slate-500 focus:outline-none"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No matching records or actions found for &quot;{query}&quot;
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(item.href)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-800/80 text-left transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-800 group-hover:bg-indigo-600/30 text-slate-400 group-hover:text-indigo-300 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200 group-hover:text-white">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-500">{item.category}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span>Navigate with click or arrow keys</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
}
