'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

interface HeroFeatureCardProps {
  title: string;
  description: string;
  badge: string;
  badgeColor?: 'indigo' | 'cyan' | 'rose' | 'emerald' | 'amber';
  icon: React.ReactNode;
  href: string;
  actionText: string;
  imageSrc?: string;
  imageAlt?: string;
  highlightText?: string;
}

export default function HeroFeatureCard({
  title,
  description,
  badge,
  badgeColor = 'cyan',
  icon,
  href,
  actionText,
  imageSrc,
  imageAlt = 'Feature Preview',
  highlightText,
}: HeroFeatureCardProps) {
  const badgeStyles: Record<string, string> = {
    cyan: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 shadow-[0_0_12px_rgba(0,240,255,0.2)]',
    indigo: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40 shadow-[0_0_12px_rgba(99,102,241,0.2)]',
    rose: 'bg-rose-500/20 text-rose-300 border-rose-400/40 shadow-[0_0_12px_rgba(244,63,94,0.25)]',
    emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]',
    amber: 'bg-amber-500/20 text-amber-300 border-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]',
  };

  const borderHoverGlow: Record<string, string> = {
    cyan: 'hover:border-cyan-400/50 hover:shadow-[0_12px_35px_rgba(0,0,0,0.7),0_0_25px_rgba(0,240,255,0.18)]',
    indigo: 'hover:border-indigo-400/50 hover:shadow-[0_12px_35px_rgba(0,0,0,0.7),0_0_25px_rgba(99,102,241,0.18)]',
    rose: 'hover:border-rose-400/50 hover:shadow-[0_12px_35px_rgba(0,0,0,0.7),0_0_25px_rgba(244,63,94,0.2)]',
    emerald: 'hover:border-emerald-400/50 hover:shadow-[0_12px_35px_rgba(0,0,0,0.7),0_0_25px_rgba(16,185,129,0.18)]',
    amber: 'hover:border-amber-400/50 hover:shadow-[0_12px_35px_rgba(0,0,0,0.7),0_0_25px_rgba(245,158,11,0.18)]',
  };

  const actionColors: Record<string, string> = {
    cyan: 'text-cyan-400 group-hover:text-cyan-300',
    indigo: 'text-indigo-400 group-hover:text-indigo-300',
    rose: 'text-rose-400 group-hover:text-rose-300',
    emerald: 'text-emerald-400 group-hover:text-emerald-300',
    amber: 'text-amber-400 group-hover:text-amber-300',
  };

  return (
    <div
      className={`group relative rounded-2xl bg-gradient-to-b from-[#0e162c]/90 to-[#080d1e]/90 border border-white/10 p-5 flex flex-col justify-between transition-all duration-300 backdrop-blur-xl ${borderHoverGlow[badgeColor]}`}
    >
      <div className="space-y-4">
        {/* Optional Rich Thumbnail Image Preview */}
        {imageSrc && (
          <div className="relative h-36 w-full overflow-hidden rounded-xl border border-white/10 bg-slate-950">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              className="object-cover object-center opacity-85 group-hover:scale-105 group-hover:opacity-100 transition-all duration-500"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            {/* Subtle Gradient vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e162c] via-transparent to-black/30" />

            {/* Corner status tag on the image */}
            {highlightText && (
              <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/15 text-[10px] font-mono font-medium text-slate-200">
                {highlightText}
              </div>
            )}
          </div>
        )}

        {/* Top Header: Icon & Badge */}
        <div className="flex items-center justify-between">
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white group-hover:scale-105 group-hover:border-cyan-500/40 transition-all duration-300 shadow-md">
            {icon}
          </div>
          <span
            className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${badgeStyles[badgeColor]}`}
          >
            {badge}
          </span>
        </div>

        {/* Card Title & Content */}
        <div>
          <h3 className="text-base font-bold text-white group-hover:text-cyan-200 transition-colors leading-snug">
            {title}
          </h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {/* Footer Link Action */}
      <div className="pt-4 mt-4 border-t border-white/[0.08]">
        <Link
          href={href}
          className={`text-xs font-semibold flex items-center justify-between transition-colors ${actionColors[badgeColor]}`}
        >
          <span className="font-mono">{actionText}</span>
          <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
