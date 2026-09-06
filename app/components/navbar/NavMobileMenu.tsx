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
    <div className="lg:hidden py-3 border-t border-white/[0.08] animate-in slide-in-from-top-2 duration-150">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Core Operations</div>
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
                  ? 'bg-indigo-500/20 text-white border border-indigo-500/40 font-semibold'
                  : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${active ? 'text-indigo-400' : 'text-slate-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Tools & Ecosystem</div>
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
                  ? 'bg-indigo-500/20 text-white border border-indigo-500/40 font-semibold'
                  : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${active ? 'text-indigo-400' : 'text-slate-400'}`} />
              <span>{tool.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
