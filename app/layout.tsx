import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import AppShell from './components/AppShell';

export const metadata: Metadata = {
  title: 'GRAFITY | Smart Logistics • AI-Powered Optimization • End-to-End Visibility',
  description: 'Autonomous AI logistics operations console powering real-time highway emergency dispatch, deterministic conflict resolution, and high-frequency fleet telemetry.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="h-full bg-[#040814] text-slate-100 antialiased"
    >
      <body className="min-h-full bg-[#040814] text-slate-100 selection:bg-cyan-400 selection:text-slate-950 font-sans">
        <Suspense fallback={<div className="min-h-screen bg-[#040814]" />}>
          <AppShell>{children}</AppShell>
        </Suspense>
      </body>
    </html>
  );
}
