import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import AppShell from './components/AppShell';

export const metadata: Metadata = {
  title: 'Grafity | Intelligence in Motion',
  description: 'Your operations. Smarter. Faster. Safer. Autonomous Breakdown & Dispatch Operations Console',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="h-full bg-[#080c18] text-slate-100 antialiased"
    >
      <body className="min-h-full bg-[#080c18] text-slate-100 selection:bg-indigo-500 selection:text-white font-sans">
        <Suspense fallback={<div className="min-h-screen bg-[#080c18]" />}>
          <AppShell>{children}</AppShell>
        </Suspense>
      </body>
    </html>
  );
}
