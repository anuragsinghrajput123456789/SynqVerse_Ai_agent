'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Bell,
  Menu,
  ChevronDown,
  User,
} from 'lucide-react';

interface HeaderProps {
  onOpenCommandPalette?: () => void;
  onToggleMobileSidebar?: () => void;
}

export default function Header({ onOpenCommandPalette, onToggleMobileSidebar }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        setShowNotifications(false);
        setShowProfile(false);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-[#E5E7EB] px-4 sm:px-6 h-15 flex items-center justify-between shadow-2xs">
      {/* Left: Mobile Toggle & Page Title / Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400 hidden sm:inline">Console</span>
          <span className="text-xs text-slate-300 hidden sm:inline">/</span>
          <h1 className="text-sm sm:text-base font-semibold text-slate-900 tracking-tight">
            Operations Dashboard
          </h1>
        </div>
      </div>

      {/* Center & Right: Search, Status, Notifications, Profile */}
      <div className="flex items-center gap-3">
        {/* Global Search Trigger (Ctrl + K) */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 border border-[#E5E7EB] rounded-xl text-xs transition-colors w-40 sm:w-64 cursor-pointer text-left shadow-2xs"
          title="Open search (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="flex-1 truncate text-xs text-slate-500">Search anything...</span>
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 rounded text-slate-400 font-mono shadow-2xs">
            Ctrl + K
          </kbd>
        </button>

        {/* System Status Pill */}
        <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Operational</span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" data-dropdown>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowNotifications(!showNotifications);
              setShowProfile(false);
            }}
            className="relative p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-[#E5E7EB] transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Notifications
                </h3>
                <span className="text-[10px] bg-[#6D5DF5]/10 text-[#6D5DF5] font-semibold px-2 py-0.5 rounded-full">
                  1 Unread
                </span>
              </div>
              <div className="mt-2.5 space-y-2">
                <div className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-100 transition-colors">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-900">Incident Triage Complete</p>
                    <span className="text-[10px] text-slate-400">2m ago</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    13 deterministic rules evaluated. Work order WO-1042 ready for dispatch.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar / Menu */}
        <div className="relative" data-dropdown>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-[#E5E7EB] transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-[#6D5DF5] text-white flex items-center justify-center text-xs font-bold shadow-2xs">
              AR
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-slate-800 leading-tight">Anurag Rajput</p>
              <p className="text-[10px] text-slate-400 leading-tight">Fleet Operations</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
          </button>

          {showProfile && (
            <div className="absolute right-0 mt-2 w-52 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900">Anurag Rajput</p>
                <p className="text-[11px] text-slate-500 truncate">anuragsinghrajput@gmail.com</p>
              </div>
              <div className="py-1">
                <div className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Account Settings</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
