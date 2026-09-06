'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { User } from 'lucide-react';

interface NavUserMenuProps {
  pathname: string;
}

export default function NavUserMenu({ pathname }: NavUserMenuProps) {
  const [showProfile, setShowProfile] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setShowProfile(false);
  }, [pathname]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div className="relative" ref={profileDropdownRef}>
      <button
        type="button"
        onClick={() => setShowProfile(!showProfile)}
        className="flex items-center gap-2 p-1 pl-1.5 rounded-lg hover:bg-white/[0.06] transition cursor-pointer"
        aria-label="User Profile Menu"
      >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-[11px] font-black text-white shadow-sm">
          AR
        </div>
      </button>

      {showProfile && (
        <div className="absolute right-0 mt-2 w-48 bg-[#0d1428]/95 border border-slate-700/70 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl">
          <div className="px-3 py-2 border-b border-slate-800">
            <p className="text-xs font-bold text-white">Anurag Rajput</p>
            <p className="text-[10px] text-slate-400 truncate">Lead Dispatcher</p>
          </div>
          <div className="py-1">
            <Link
              href="/settings"
              onClick={() => setShowProfile(false)}
              className="px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-2 transition"
            >
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Console Settings</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
