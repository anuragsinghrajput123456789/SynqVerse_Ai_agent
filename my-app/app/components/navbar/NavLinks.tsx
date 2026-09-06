'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { primaryItems, secondaryItems, isItemActive } from './navData';

interface NavLinksProps {
  pathname: string;
}

export default function NavLinks({ pathname }: NavLinksProps) {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMoreMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const isMoreActive = secondaryItems.some((item) => isItemActive(pathname, item.href, false, item.alias));

  return (
    <nav className="hidden lg:flex items-center gap-1">
      {primaryItems.map((item) => {
        const Icon = item.icon;
        const active = isItemActive(pathname, item.href, item.exact, item.alias);

        return (
          <Link
            key={item.name}
            href={item.href}
            className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap ${
              active
                ? 'bg-indigo-500/20 text-white border border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                : 'text-slate-300 hover:text-white hover:bg-white/[0.05] border border-transparent'
            }`}
          >
            <Icon
              className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${
                active ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
              }`}
            />
            <span>{item.name}</span>

            {item.badge && (
              <span
                className={`text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.2 rounded-full border animate-pulse ${
                  item.badge === 'SOS'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                }`}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}

      {/* "More" Tools Dropdown */}
      <div className="relative" ref={moreDropdownRef}>
        <button
          type="button"
          onClick={() => setMoreMenuOpen(!moreMenuOpen)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
            isMoreActive || moreMenuOpen
              ? 'bg-indigo-500/20 text-white border border-indigo-500/40'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.05] border border-transparent'
          }`}
        >
          <span>Tools</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${moreMenuOpen ? 'rotate-180 text-indigo-400' : 'text-slate-500'}`} />
        </button>

        {moreMenuOpen && (
          <div className="absolute left-0 mt-2 w-64 bg-[#0d1428]/95 border border-slate-700/70 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/5">
              Operations Ecosystem
            </div>
            <div className="py-1 space-y-0.5">
              {secondaryItems.map((tool) => {
                const ToolIcon = tool.icon;
                const active = isItemActive(pathname, tool.href, false, tool.alias);

                return (
                  <Link
                    key={tool.name}
                    href={tool.href}
                    onClick={() => setMoreMenuOpen(false)}
                    className={`flex items-start gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors ${
                      active
                        ? 'bg-indigo-500/20 text-white font-semibold'
                        : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    <ToolIcon className={`w-4 h-4 mt-0.5 shrink-0 ${active ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white truncate">{tool.name}</span>
                        {tool.badge && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                            {tool.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{tool.desc}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
