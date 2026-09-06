'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function TicketAuditRedirect() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params?.ticketId as string;

  useEffect(() => {
    if (ticketId) {
      router.replace(`/audit?ticketId=${encodeURIComponent(ticketId)}`);
    } else {
      router.replace('/audit');
    }
  }, [ticketId, router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-slate-400 text-sm animate-pulse">
        Loading audit timeline for ticket {ticketId || ''}...
      </div>
    </div>
  );
}
