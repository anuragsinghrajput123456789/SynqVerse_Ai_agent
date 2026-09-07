'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap, Search, Menu, X } from 'lucide-react';
import NavLinks from './navbar/NavLinks';
import NavUserMenu from './navbar/NavUserMenu';
import NavMobileMenu from './navbar/NavMobileMenu';

import GrafityLogo from './ui/GrafityLogo';

interface NavbarProps {
  onOpenCommandPalette?: () => void;
}

export default function Navbar({ onOpenCommandPalette }: NavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 bg-[#040814]/90 backdrop-blur-xl border-b border-cyan-500/20 shadow-[0_4px_25px_rgba(0,0,0,0.7),0_0_20px_rgba(0,240,255,0.08)]">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-4">
          {/* 1. Left: Brand Mark */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group">
              <GrafityLogo size={32} glow={true} animated={true} />
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-wider uppercase bg-gradient-to-r from-cyan-300 via-sky-200 to-fuchsia-400 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(0,240,255,0.4)]">
                  GRAFITY
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  AI OPS
                </span>
              </div>
            </Link>
          </div>

          {/* 2. Center: Minimal Horizontal Navigation (Desktop) */}
          <NavLinks pathname={pathname} />

          {/* 3. Right: Command Search, User Profile & Mobile Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Minimal Command Palette Trigger (Ctrl + K) */}
            <button
              onClick={onOpenCommandPalette}
              className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-white/[0.08] hover:border-indigo-500/30 rounded-lg text-xs transition cursor-pointer"
              title="Search operations (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline text-xs text-slate-400">Search</span>
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.2 text-[10px] bg-slate-800 border border-slate-700 rounded text-slate-400 font-mono">
                Ctrl K
              </kbd>
            </button>

            {/* Profile Pill & Menu */}
            <NavUserMenu pathname={pathname} />

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg bg-slate-900/60 text-slate-300 hover:text-white border border-white/[0.08] transition"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Drawer */}
        <NavMobileMenu
          isOpen={mobileMenuOpen}
          pathname={pathname}
          onClose={() => setMobileMenuOpen(false)}
        />
      </div>
    </header>
  );
}
