'use client';

import React from 'react';
import Link from 'next/link';

interface HeroFeatureCardProps {
  title: string;
  description: string;
  badge: string;
  badgeColor?: 'indigo' | 'rose' | 'emerald' | 'amber';
  icon: React.ReactNode;
  href: string;
  actionText: string;
}

export default function HeroFeatureCard({
  title,
  description,
  badge,
  badgeColor = 'indigo',
  icon,
  href,
  actionText,
}: HeroFeatureCardProps) {
  const badgeStyles = {
    indigo: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    rose: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between hover:border-white/20 transition group">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="p-2.5 rounded-xl bg-slate-800/80 text-white group-hover:scale-105 transition-transform">
            {icon}
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${badgeStyles[badgeColor]}`}>
            {badge}
          </span>
        </div>

        <div>
          <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
            {title}
          </h4>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
            {description}
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-white/5">
        <Link
          href={href}
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center justify-between transition"
        >
          <span>{actionText}</span>
          <span className="transform group-hover:translate-x-1 transition-transform">&rarr;</span>
        </Link>
      </div>
    </div>
  );
}
