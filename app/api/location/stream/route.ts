import { LocationService } from '@/lib/location';

export const dynamic = 'force-dynamic';

export async function GET() {
  const service = LocationService.getInstance();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial heartbeat
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));

      const unsubscribe = service.subscribe((loc) => {
        try {
          const payload = JSON.stringify({ type: 'location_update', location: loc });
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch {
          // Stream error or client disconnected
        }
      });

      return () => {
        unsubscribe();
      };
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
