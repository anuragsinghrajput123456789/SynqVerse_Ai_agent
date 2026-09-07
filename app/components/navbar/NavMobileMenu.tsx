'use client';

import React from 'react';
import Link from 'next/link';
import { primaryItems, secondaryItems, isItemActive } from './navData';

interface NavMobileMenuProps {
  isOpen: boolean;
  pathname: string;
  onClose: () => void;
}

export default function NavMobileMenu({ isOpen, pathname, onClose }: NavMobileMenuProps) {
  if (!isOpen) return null;

  return (
    <div className="lg:hidden py-3 border-t border-cyan-500/20 animate-in slide-in-from-top-2 duration-200">
      <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-mono mb-1.5">
        Core Operations
      </div>
      <nav className="grid grid-cols-2 gap-1.5 mb-3">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(pathname, item.href, item.exact, item.alias);

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition ${
                active
                  ? 'bg-cyan-500/20 text-white border border-cyan-500/40 font-semibold shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                  : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${active ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400 font-mono mb-1.5">
        Tools &amp; Ecosystem
      </div>
      <nav className="grid grid-cols-2 gap-1.5">
        {secondaryItems.map((tool) => {
          const Icon = tool.icon;
          const active = isItemActive(pathname, tool.href, false, tool.alias);

          return (
            <Link
              key={tool.name}
              href={tool.href}
              onClick={onClose}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition ${
                active
                  ? 'bg-purple-500/20 text-white border border-purple-500/40 font-semibold shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                  : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${active ? 'text-purple-400' : 'text-slate-400'}`} />
              <span>{tool.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
