'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  AlertOctagon,
  Layers,
  Sparkles,
  Mic,
  CheckSquare,
  FileCheck2,
  Activity,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  X,
} from 'lucide-react';
import Tooltip from './ui/Tooltip';

interface NavItem {
  name: string;
  href: string;
  alias?: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  count?: number;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ isOpenMobile = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sections: NavSection[] = [
    {
      title: 'MAIN',
      items: [
        { name: 'Dashboard', href: '/dashboard', alias: '/', icon: LayoutDashboard, exact: true },
        { name: 'Incidents', href: '/incidents', alias: '/tickets', icon: AlertOctagon },
        { name: 'Context Explorer', href: '/context', icon: Layers },
      ],
    },
    {
      title: 'AI',
      items: [
        { name: 'Operations Copilot', href: '/copilot', alias: '/chat', icon: Sparkles },
        { name: 'Voice Agent', href: '/voice', icon: Mic, badge: 'Live' },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        { name: 'Approvals', href: '/approvals', icon: CheckSquare },
        { name: 'Work Orders', href: '/work-orders', icon: FileCheck2 },
        { name: 'Audit Trail', href: '/audit', icon: Activity },
      ],
    },
    {
      title: 'ANALYTICS',
      items: [
        { name: 'Reports', href: '/reports', icon: BarChart3 },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { name: 'Settings', href: '/settings', icon: Settings },
      ],
    },
  ];

  const isItemActive = (href: string, exact?: boolean, alias?: string) => {
    if (exact) {
      return pathname === '/' || pathname === '/dashboard';
    }
    if (alias && (pathname === alias || pathname.startsWith(alias + '/'))) return true;
    return pathname === href || pathname.startsWith(href + '/');
  };

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full">
      {/* Brand Header */}
      <div>
        <div
          className={`h-16 px-4 flex items-center border-b border-[#E5E7EB] ${
            isCollapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          <Link
            href="/"
            onClick={() => onCloseMobile?.()}
            className="flex items-center gap-3 group"
          >
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-[#6D5DF5] text-white shadow-xs group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-slate-900 leading-tight">
                  Grafity
                </span>
                <span className="text-[10px] font-medium text-slate-500 tracking-normal">
                  Intelligence in Motion
                </span>
              </div>
            )}
          </Link>

          {/* Desktop collapse toggle */}
          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Close drawer"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Expand button when collapsed (desktop only) */}
        {isCollapsed && (
          <div className="hidden lg:flex justify-center py-2 border-b border-[#E5E7EB]">
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Sections */}
        <nav className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)]">
          {sections.map((section, sIdx) => (
            <div key={sIdx}>
              {!isCollapsed && (
                <div className="px-3 mb-1.5 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  {section.title}
                </div>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isItemActive(item.href, item.exact, item.alias);

                  const linkEl = (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => onCloseMobile?.()}
                      className={`group relative flex items-center rounded-xl text-xs font-medium transition-all duration-150 ${
                        isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
                      } ${
                        active
                          ? 'bg-[#F4F2FF] text-[#6D5DF5] font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                      }`}
                    >
                      {/* Active indicator bar */}
                      {active && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#6D5DF5] rounded-r-full" />
                      )}

                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            active ? 'text-[#6D5DF5]' : 'text-slate-400 group-hover:text-slate-700'
                          }`}
                        />
                        {!isCollapsed && <span>{item.name}</span>}
                      </div>

                      {!isCollapsed && item.badge && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );

                  if (isCollapsed) {
                    return (
                      <Tooltip key={item.name} content={item.name} position="right" className="w-full">
                        {linkEl}
                      </Tooltip>
                    );
                  }

                  return linkEl;
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Sidebar Footer Info */}
      <div className="p-3 border-t border-[#E5E7EB] bg-[#F7F8FC]/80">
        {isCollapsed ? (
          <div className="flex justify-center" title="Zero Hallucination Gating Active">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        ) : (
          <div className="flex items-center gap-2.5 px-2 py-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div className="text-[11px] leading-tight">
              <p className="text-slate-800 font-semibold">Autonomous Ops</p>
              <p className="text-[10px] text-slate-500">Zero Hallucination Gating</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 bg-white border-r border-[#E5E7EB] min-h-screen select-none z-30 transition-all duration-200 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Drawer */}
          <aside className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl z-50 transform transition-transform duration-200 ease-in-out border-r border-[#E5E7EB]">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
