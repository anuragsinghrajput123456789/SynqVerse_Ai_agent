'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface DriverGeoState {
  permission: 'prompt' | 'granted' | 'denied' | 'unavailable';
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  lastUpdated: string | null;
  isStreaming: boolean;
  error: string | null;
  isOffline: boolean;
}

export function useDriverLocation(driverId: string, vehicleRegistration?: string) {
  const [state, setState] = useState<DriverGeoState>({
    permission: 'prompt',
    latitude: 28.2045, // default Delhi NCR corridor
    longitude: 76.8320,
    accuracy: 10,
    speed: 0,
    heading: 0,
    lastUpdated: null,
    isStreaming: false,
    error: null,
    isOffline: false,
  });

  const watchIdRef = useRef<number | null>(null);
  const queueRef = useRef<Array<{ lat: number; lng: number; time: string }>>([]);

  // Send coordinates to backend
  const pushLocation = useCallback(
    async (lat: number, lng: number, accuracy?: number, speed?: number, heading?: number) => {
      try {
        const res = await fetch('/api/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            driverId,
            vehicleRegistration,
            latitude: lat,
            longitude: lng,
            accuracyMeters: accuracy || 10,
            speedKmH: speed || 0,
            heading: heading || 0,
            timestamp: new Date().toISOString(),
          }),
        });

        if (res.ok) {
          setState((prev) => ({ ...prev, isOffline: false, error: null }));
          // Drain queued points if any
          queueRef.current = [];
        } else {
          throw new Error('Server returned ' + res.status);
        }
      } catch {
        queueRef.current.push({ lat, lng, time: new Date().toISOString() });
        setState((prev) => ({ ...prev, isOffline: true }));
      }
    },
    [driverId, vehicleRegistration]
  );

  const startTracking = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        permission: 'unavailable',
        error: 'Geolocation is not supported by your browser.',
      }));
      return;
    }

    setState((prev) => ({ ...prev, isStreaming: true, error: null }));

    // Request high accuracy position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = pos.coords.accuracy;
        const spd = pos.coords.speed !== null ? Math.round(pos.coords.speed * 3.6) : 0;
        const hdg = pos.coords.heading || 0;
        const now = new Date().toISOString();

        setState((prev) => ({
          ...prev,
          permission: 'granted',
          latitude: lat,
          longitude: lng,
          accuracy: acc,
          speed: spd,
          heading: hdg,
          lastUpdated: now,
          error: null,
        }));

        pushLocation(lat, lng, acc, spd, hdg);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setState((prev) => ({
            ...prev,
            permission: 'denied',
            isStreaming: false,
            error: 'Location access is required for live driver tracking. Please allow permission.',
          }));
        } else {
          setState((prev) => ({
            ...prev,
            error: err.message || 'Unable to retrieve GPS signal.',
          }));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );
  }, [pushLocation]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setState((prev) => ({ ...prev, isStreaming: false }));
  }, []);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    ...state,
    startTracking,
    stopTracking,
    pushLocation,
  };
}
