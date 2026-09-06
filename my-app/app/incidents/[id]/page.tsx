'use client';

import TicketDetailPage from '../../tickets/[id]/page';

export default function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <TicketDetailPage params={params} />;
}
