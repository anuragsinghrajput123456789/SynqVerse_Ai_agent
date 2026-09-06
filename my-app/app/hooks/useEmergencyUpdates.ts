'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { EmergencyEvent } from '@/lib/emergency/types';

interface UseEmergencyUpdatesOptions {
  pollingIntervalMs?: number;
  autoRefresh?: boolean;
}

export function useEmergencyUpdates(options?: UseEmergencyUpdatesOptions) {
  const [emergencies, setEmergencies] = useState<EmergencyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const pollingInterval = options?.pollingIntervalMs ?? 5000;
  const autoRefresh = options?.autoRefresh ?? true;

  const fetchEmergencies = useCallback(async () => {
    try {
      const res = await fetch('/api/emergency');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setEmergencies(data.emergencies || []);
          setLastSync(new Date().toISOString());
          setError(null);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to connect to emergency dispatch server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmergencies();
    if (!autoRefresh) return;
    const interval = setInterval(fetchEmergencies, pollingInterval);
    return () => clearInterval(interval);
  }, [fetchEmergencies, autoRefresh, pollingInterval]);

  const activeEmergencies = useMemo(
    () =>
      emergencies.filter(
        (e) => e.status === 'ACTIVE' || e.status === 'ACKNOWLEDGED' || e.status === 'RESPONDING'
      ),
    [emergencies]
  );

  const acknowledgeEmergency = async (id: string, actor = 'HQ-DISPATCHER'): Promise<boolean> => {
    try {
      const res = await fetch(`/api/emergency/${id}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchEmergencies();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const resolveEmergency = async (
    id: string,
    actor = 'HQ-DISPATCHER',
    notes?: string
  ): Promise<boolean> => {
    try {
      const res = await fetch(`/api/emergency/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor, notes }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchEmergencies();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return {
    emergencies,
    activeEmergencies,
    hasActiveEmergency: activeEmergencies.length > 0,
    latestEmergency: activeEmergencies[0] || emergencies[0] || null,
    loading,
    error,
    lastSync,
    refresh: fetchEmergencies,
    acknowledgeEmergency,
    resolveEmergency,
  };
}
