'use client';

import React from 'react';
import { AlertOctagon, CheckCircle2, CheckSquare, FileCheck2 } from 'lucide-react';
import MetricCard from './MetricCard';

interface MetricsGridProps {
  stats?: {
    total?: number;
    processed?: number;
    pendingApprovalsCount?: number;
    workOrdersCount?: number;
  } | null;
}

export default function MetricsGrid({ stats }: MetricsGridProps) {
  const cards = [
    {
      label: 'Active Incidents',
      value: stats?.total ?? 0,
      trend: '-20%',
      isPositive: true,
      description: 'vs previous period',
      accent: 'pink' as const,
      icon: AlertOctagon,
      bars: [30, 45, 60, 50, 40, 25],
    },
    {
      label: 'Processed Today',
      value: stats?.processed ?? 0,
      trend: '+12%',
      isPositive: true,
      description: 'auto-triaged by rules',
      accent: 'cyan' as const,
      icon: CheckCircle2,
      bars: [20, 35, 45, 60, 75, 85],
    },
    {
      label: 'Pending Approvals',
      value: stats?.pendingApprovalsCount ?? 0,
      trend: stats && stats.pendingApprovalsCount && stats.pendingApprovalsCount > 0 ? `${stats.pendingApprovalsCount} req` : '0 req',
      isPositive: (stats?.pendingApprovalsCount ?? 0) <= 5,
      description: 'awaiting supervisor sign-off',
      accent: 'amber' as const,
      icon: CheckSquare,
      bars: [70, 60, 45, 35, 25, 18],
    },
    {
      label: 'Work Orders',
      value: stats?.workOrdersCount ?? 0,
      trend: '+18%',
      isPositive: true,
      description: 'generated and dispatched',
      accent: 'purple' as const,
      icon: FileCheck2,
      bars: [35, 40, 55, 65, 70, 80],
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <MetricCard key={idx} {...card} />
      ))}
    </div>
  );
}
