'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Layers, CheckSquare, Activity, AlertCircle } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [activeRoute, setActiveRoute] = useState('/dashboard');

  useEffect(() => {
    if (pathname) {
      setActiveRoute(pathname);
    }
  }, [pathname]);

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Layers },
    { name: 'Tickets', href: '/tickets', icon: AlertCircle },
    { name: 'Approvals', href: '/approvals', icon: CheckSquare },
    { name: 'Audit Trail', href: '/audit', icon: Activity },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Title */}
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-md shadow-indigo-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <Link href="/dashboard" className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Grafity</span>
                <span className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-700/50 px-2 py-0.5 rounded font-mono uppercase">
                  Ops Console
                </span>
              </Link>
              <p className="text-xs text-slate-400">Autonomous Incident Resolution & Operational Dispatch</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeRoute === item.href || (item.href !== '/dashboard' && activeRoute.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-indigo-400 border border-slate-700'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* System Status Pill */}
          <div className="hidden sm:flex items-center space-x-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-full text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300 font-mono">Engine: ONLINE</span>
            <span className="text-slate-600">|</span>
            <span className="text-indigo-400 font-mono">PII: MASKED</span>
          </div>
        </div>
      </div>
    </header>
  );
}
