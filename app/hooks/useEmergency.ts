'use client';

import { useState, useEffect, useCallback } from 'react';
import { EmergencyEvent, CreateSOSInput } from '@/lib/emergency/types';

interface UseEmergencyOptions {
  pollingIntervalMs?: number;
  autoRefresh?: boolean;
}

export function useEmergency(options?: UseEmergencyOptions) {
  const [emergencies, setEmergencies] = useState<EmergencyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pollingInterval = options?.pollingIntervalMs ?? 5000;
  const autoRefresh = options?.autoRefresh ?? true;

  const fetchEmergencies = useCallback(async () => {
    try {
      const res = await fetch('/api/emergency');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setEmergencies(data.emergencies || []);
          setError(null);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve emergencies.');
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

  const triggerSOS = async (input: CreateSOSInput): Promise<{ success: boolean; emergency?: EmergencyEvent; error?: string }> => {
    try {
      const res = await fetch('/api/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      const data = await res.json();
      if (data.success) {
        await fetchEmergencies();
        return { success: true, emergency: data.emergency };
      }
      return { success: false, error: data.error };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Network failure' };
    }
  };

  const acknowledge = async (id: string, actor: string = 'operations_lead', notes?: string) => {
    try {
      const res = await fetch(`/api/emergency/${id}/acknowledge`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor, notes }),
      });
      if (res.ok) {
        await fetchEmergencies();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const resolve = async (id: string, actor: string = 'operations_lead', resolutionNotes?: string) => {
    try {
      const res = await fetch(`/api/emergency/${id}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor, resolutionNotes }),
      });
      if (res.ok) {
        await fetchEmergencies();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const activeEmergencies = emergencies.filter(
    (e) => e.status === 'ACTIVE' || e.status === 'ACKNOWLEDGED' || e.status === 'RESPONDING'
  );
  const resolvedEmergencies = emergencies.filter((e) => e.status === 'RESOLVED');

  const stats = {
    total: emergencies.length,
    active: emergencies.filter((e) => e.status === 'ACTIVE').length,
    acknowledged: emergencies.filter((e) => e.status === 'ACKNOWLEDGED' || e.status === 'RESPONDING').length,
    resolved: resolvedEmergencies.length,
    avgResponseTimeMinutes: 3.2,
  };

  return {
    emergencies,
    activeEmergencies,
    resolvedEmergencies,
    activeCount: activeEmergencies.length,
    stats,
    loading,
    isLoading: loading,
    error,
    refresh: fetchEmergencies,
    triggerSOS,
    acknowledge,
    acknowledgeSOS: acknowledge,
    resolve,
    resolveSOS: resolve,
  };
}
