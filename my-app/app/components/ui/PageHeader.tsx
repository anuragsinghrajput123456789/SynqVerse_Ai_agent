import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  badge,
  backHref,
  backLabel,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
      <div>
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{backLabel || 'Back'}</span>
          </Link>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
          {badge}
        </div>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">{subtitle}</p>
        )}
      </div>

      {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
}
