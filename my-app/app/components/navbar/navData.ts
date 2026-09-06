import {
  LayoutDashboard,
  MapPin,
  ShieldAlert,
  AlertOctagon,
  CheckSquare,
  Sparkles,
  Mic,
  FileCheck2,
  Layers,
  Truck,
  Activity,
  BarChart3,
  Settings,
  FileSpreadsheet,
  LucideIcon,
} from 'lucide-react';

export interface PrimaryNavItem {
  name: string;
  href: string;
  alias?: string;
  icon: LucideIcon;
  exact?: boolean;
  badge?: string;
}

export interface SecondaryNavItem {
  name: string;
  href: string;
  alias?: string;
  icon: LucideIcon;
  desc: string;
  badge?: string;
}

export const primaryItems: PrimaryNavItem[] = [
  { name: 'Dashboard', href: '/dashboard', alias: '/', icon: LayoutDashboard, exact: true },
  { name: 'Live Map', href: '/map', alias: '/locations', icon: MapPin },
  { name: 'Safety & SOS', href: '/safety', alias: '/emergency', icon: ShieldAlert, badge: 'SOS' },
  { name: 'Data Studio', href: '/data-studio', alias: '/upload', icon: FileSpreadsheet, badge: 'AI' },
  { name: 'Incidents', href: '/incidents', alias: '/tickets', icon: AlertOctagon },
  { name: 'Approvals', href: '/approvals', icon: CheckSquare },
];

export const secondaryItems: SecondaryNavItem[] = [
  { name: 'Copilot AI', href: '/copilot', alias: '/chat', icon: Sparkles, desc: 'Grounded dispatch assistant' },
  { name: 'Voice Agent', href: '/voice', icon: Mic, desc: 'Multilingual field dispatch', badge: 'Live' },
  { name: 'Work Orders', href: '/work-orders', icon: FileCheck2, desc: 'Repair & maintenance sync' },
  { name: 'Driver Console', href: '/driver', icon: Truck, desc: 'In-cab mobile interface' },
  { name: 'Context Base', href: '/context', icon: Layers, desc: 'Roster & contract knowledge' },
  { name: 'Audit Trail', href: '/audit', icon: Activity, desc: 'Module 8 forensic logs' },
  { name: 'Reports', href: '/reports', icon: BarChart3, desc: 'Operations & SLA metrics' },
  { name: 'Settings', href: '/settings', icon: Settings, desc: 'System configuration' },
];

export function isItemActive(pathname: string, href: string, exact?: boolean, alias?: string): boolean {
  if (exact) {
    return pathname === '/' || pathname === '/dashboard';
  }
  if (alias && (pathname === alias || pathname.startsWith(alias + '/'))) return true;
  return pathname === href || pathname.startsWith(href + '/');
}
