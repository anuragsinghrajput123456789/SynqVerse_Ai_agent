'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: '#020617', color: '#f8fafc', padding: '2rem', fontFamily: 'sans-serif' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <h2>Operational System Alert</h2>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
            An unexpected operational issue occurred. Please retry.
            {error.digest ? (
              <span style={{ display: 'block', fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.7 }}>
                Error ID: {error.digest}
              </span>
            ) : null}
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Retry
          </button>
        </div>
      </body>
    </html>
  );
}
