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
  queuedUpdatesCount: number;
}

interface QueuedLocationPoint {
  lat: number;
  lng: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  time: string;
}

function computeDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // meters
  const rad1 = (lat1 * Math.PI) / 180;
  const rad2 = (lat2 * Math.PI) / 180;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad1) * Math.cos(rad2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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
    queuedUpdatesCount: 0,
  });

  const watchIdRef = useRef<number | null>(null);
  const queueRef = useRef<QueuedLocationPoint[]>([]);
  const lastPushTimeRef = useRef<number>(0);
  const lastPushCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  // Send single coordinate payload to backend
  const sendLocationPayload = useCallback(
    async (point: QueuedLocationPoint): Promise<boolean> => {
      try {
        const res = await fetch('/api/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            driverId,
            vehicleRegistration,
            latitude: point.lat,
            longitude: point.lng,
            accuracyMeters: point.accuracy || 10,
            speedKmH: point.speed || 0,
            heading: point.heading || 0,
            timestamp: point.time,
          }),
        });

        return res.ok;
      } catch {
        return false;
      }
    },
    [driverId, vehicleRegistration]
  );

  // Drain offline queue when online connection is recovered
  const drainQueue = useCallback(async () => {
    if (queueRef.current.length === 0) return;
    const items = [...queueRef.current];
    const latest = items[items.length - 1];

    // Push the latest consolidated position to restore state
    const success = await sendLocationPayload(latest);
    if (success) {
      queueRef.current = [];
      setState((prev) => ({ ...prev, isOffline: false, queuedUpdatesCount: 0, error: null }));
    }
  }, [sendLocationPayload]);

  // Send coordinates to backend with client-side throttling (min 5s interval unless rapid motion)
  const pushLocation = useCallback(
    async (lat: number, lng: number, accuracy?: number, speed?: number, heading?: number, force = false) => {
      const nowMs = Date.now();
      const timeSinceLastPush = nowMs - lastPushTimeRef.current;

      let distance = 0;
      if (lastPushCoordsRef.current) {
        distance = computeDistanceMeters(
          lastPushCoordsRef.current.lat,
          lastPushCoordsRef.current.lng,
          lat,
          lng
        );
      }

      // Throttling heuristic:
      // Minimum 5 seconds between network transmissions UNLESS forced OR rapid movement (>50m or speed > 15 km/h)
      const isSignificantMovement = distance > 50 || (speed !== undefined && speed > 15);
      const shouldPush = force || timeSinceLastPush >= 5000 || (isSignificantMovement && timeSinceLastPush >= 2500);

      const point: QueuedLocationPoint = {
        lat,
        lng,
        accuracy: accuracy || 10,
        speed: speed || 0,
        heading: heading || 0,
        time: new Date().toISOString(),
      };

      if (!shouldPush) {
        return;
      }

      // If browser is actively offline, queue and return
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        queueRef.current.push(point);
        if (queueRef.current.length > 50) queueRef.current.shift();
        setState((prev) => ({ ...prev, isOffline: true, queuedUpdatesCount: queueRef.current.length }));
        return;
      }

      const success = await sendLocationPayload(point);
      if (success) {
        lastPushTimeRef.current = nowMs;
        lastPushCoordsRef.current = { lat, lng };
        setState((prev) => ({ ...prev, isOffline: false, queuedUpdatesCount: 0, error: null }));
        if (queueRef.current.length > 0) {
          queueRef.current = [];
        }
      } else {
        queueRef.current.push(point);
        if (queueRef.current.length > 50) queueRef.current.shift();
        setState((prev) => ({
          ...prev,
          isOffline: true,
          queuedUpdatesCount: queueRef.current.length,
        }));
      }
    },
    [sendLocationPayload]
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

        // Local state updates immediately for butter-smooth UI gauges
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

        // Network telemetry transmission is throttled
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
        maximumAge: 4000,
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

  // Set up online/offline event listeners for automatic queue drain
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      drainQueue();
    };

    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOffline: true }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [drainQueue]);

  return {
    ...state,
    startTracking,
    stopTracking,
    pushLocation,
  };
}
