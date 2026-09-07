'use client';

import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import CommandPalette from './CommandPalette';
import FloatingVoiceButton from './voice/FloatingVoiceButton';
import FloatingSOSButton from './safety/FloatingSOSButton';
import Footer from './Footer';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#040814] text-slate-100 selection:bg-cyan-400 selection:text-slate-950 bg-cyber-grid">
      {/* 1. Horizontal Top Navigation Bar */}
      <Navbar onOpenCommandPalette={() => setCommandPaletteOpen(true)} />

      {/* 2. Main Full-Width Content Canvas */}
      <main className="flex-1 w-full max-w-[1700px] mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* 3. Global Footer */}
      <Footer />

      {/* 4. Persistent Global Floating Controls: Pink SOS (Hold 3s) & Voice Agent */}
      <FloatingSOSButton />
      <FloatingVoiceButton />

      {/* 5. Global Command Palette Modal */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
}
