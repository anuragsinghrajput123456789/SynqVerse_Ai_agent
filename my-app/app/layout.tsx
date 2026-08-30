import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import Navbar from './components/Navbar';
import FloatingCopilot from './components/FloatingCopilot';

export const metadata: Metadata = {
  title: 'Grafity | Autonomous Breakdown & Dispatch Operations Console',
  description: 'Deterministic Incident Resolution, Replacement Selection & Grounded Dispatching',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="h-full bg-slate-950 text-slate-100 antialiased"
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
        <Suspense fallback={<div className="h-16 bg-slate-900 border-b border-slate-800" />}>
          <Navbar />
        </Suspense>
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <FloatingCopilot />
        <footer className="border-t border-slate-800 bg-slate-900/50 py-4 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
            <span>Grafity · Operations & Dispatch Console</span>
            <span>Deterministic Rules · PII Redacted · Grounded Decisions</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
