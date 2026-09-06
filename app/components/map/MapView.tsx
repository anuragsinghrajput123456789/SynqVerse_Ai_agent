'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DriverLocation, LocationHistoryPoint } from '@/lib/location/types';

interface MapViewProps {
  drivers: DriverLocation[];
  selectedDriverId?: string | null;
  onSelectDriver?: (driver: DriverLocation) => void;
  routeHistory?: LocationHistoryPoint[];
  center?: [number, number];
  zoom?: number;
  className?: string;
  theme?: 'dark' | 'light' | 'voyager';
}

export default function MapView({
  drivers,
  selectedDriverId,
  onSelectDriver,
  routeHistory = [],
  center,
  zoom = 6,
  className = 'w-full h-full',
  theme = 'dark',
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const polylineRef = useRef<L.Polyline | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialCenter: [number, number] = center || [25.5, 78.5]; // Default central-north India corridor

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: zoom,
      zoomControl: false,
      attributionControl: false,
    });

    // Reliable CartoDB / OSM Tile URLs
    const tileUrl =
      theme === 'light'
        ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'
        : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';

    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Zoom controls at top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    mapInstanceRef.current = map;

    // CRITICAL FIX: Force size invalidation across rendering phases
    const timers = [
      setTimeout(() => map.invalidateSize(), 100),
      setTimeout(() => map.invalidateSize(), 350),
      setTimeout(() => map.invalidateSize(), 800),
    ];

    // ResizeObserver ensures map adjusts to any flex/sidebar toggle
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    const handleWindowResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      timers.forEach((t) => clearTimeout(t));
      window.removeEventListener('resize', handleWindowResize);
      if (resizeObserver) resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update Tile Theme if changed
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const tileUrl =
      theme === 'light'
        ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'
        : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';
    tileLayerRef.current.setUrl(tileUrl);
  }, [theme]);

  // Update Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const currentMarkerIds = new Set<string>();

    drivers.forEach((driver) => {
      currentMarkerIds.add(driver.driverId);
      const isSelected = selectedDriverId === driver.driverId;
      const isEmergency = driver.status === 'EMERGENCY';

      // Create Custom SVG DivIcon
      const iconHtml = createMarkerHtml(driver, isSelected);
      const customIcon = L.divIcon({
        className: 'custom-driver-pin',
        html: iconHtml,
        iconSize: isEmergency ? [48, 48] : [36, 36],
        iconAnchor: isEmergency ? [24, 24] : [18, 18],
      });

      let marker = markersRef.current.get(driver.driverId);

      if (marker) {
        marker.setLatLng([driver.latitude, driver.longitude]);
        marker.setIcon(customIcon);
      } else {
        marker = L.marker([driver.latitude, driver.longitude], { icon: customIcon });
        marker.on('click', () => {
          if (onSelectDriver) onSelectDriver(driver);
        });
        marker.addTo(map);
        markersRef.current.set(driver.driverId, marker);
      }

      // Popup Content
      const popupContent = `
        <div style="font-family: inherit; min-width: 170px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <strong style="font-size: 13px; color: ${isEmergency ? '#f43f5e' : '#f8fafc'}">${driver.driverName}</strong>
            <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: ${
              isEmergency ? '#881337; color: #fecdd3' : '#1e293b; color: #94a3b8'
            }">${driver.status}</span>
          </div>
          <div style="font-size: 11px; color: #94a3b8; line-height: 1.4;">
            <div>Vehicle: <b style="color: #cbd5e1">${driver.vehicleId || driver.vehicleRegistration}</b></div>
            <div>Speed: <b style="color: #cbd5e1">${Math.round(driver.speed || driver.speedKmH || 0)} km/h</b></div>
            <div>Corridor: <b style="color: #cbd5e1">${driver.corridor || 'Active Transit'}</b></div>
          </div>
        </div>
      `;
      marker.bindPopup(popupContent, {
        className: 'custom-map-popup',
        closeButton: false,
        offset: [0, -14],
      });
    });

    // Remove markers that are no longer in drivers list
    markersRef.current.forEach((marker, id) => {
      if (!currentMarkerIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });
  }, [drivers, selectedDriverId, onSelectDriver]);

  // Pan to selected driver or center prop
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedDriverId) {
      const selected = drivers.find((d) => d.driverId === selectedDriverId);
      if (selected) {
        map.flyTo([selected.latitude, selected.longitude], 13, {
          duration: 1.2,
          easeLinearity: 0.25,
        });
        const marker = markersRef.current.get(selectedDriverId);
        if (marker && !marker.isPopupOpen()) {
          marker.openPopup();
        }
      }
    } else if (center) {
      map.panTo(center);
    }
  }, [selectedDriverId, center, drivers]);

  // Render Breadcrumb History Polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    if (routeHistory && routeHistory.length > 1) {
      const latLngs: [number, number][] = routeHistory.map((pt) => [pt.latitude, pt.longitude]);
      const polyline = L.polyline(latLngs, {
        color: '#6366f1',
        weight: 4,
        opacity: 0.85,
        dashArray: '8, 6',
        lineCap: 'round',
      }).addTo(map);

      polylineRef.current = polyline;
    }
  }, [routeHistory]);

  return (
    <div
      className={`relative ${className} overflow-hidden rounded-2xl border border-white/10 shadow-2xl bg-[#080c18]`}
      style={{ width: '100%', height: '100%', minHeight: '520px' }}
    >
      <div
        ref={mapContainerRef}
        className="w-full h-full"
        style={{ width: '100%', height: '100%', minHeight: '520px' }}
      />

      <style jsx global>{`
        .custom-driver-pin {
          background: transparent;
          border: none;
        }
        .custom-map-popup .leaflet-popup-content-wrapper {
          background: rgba(15, 23, 42, 0.95) !important;
          backdrop-filter: blur(12px) !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.7) !important;
          color: #f8fafc !important;
        }
        .custom-map-popup .leaflet-popup-tip {
          background: rgba(15, 23, 42, 0.95) !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
        }
        .leaflet-container {
          background: #080c18 !important;
          width: 100% !important;
          height: 100% !important;
          min-height: 520px !important;
          z-index: 1 !important;
        }
      `}</style>
    </div>
  );
}

// Marker HTML Generator
function createMarkerHtml(driver: DriverLocation, isSelected: boolean): string {
  const isEmergency = driver.status === 'EMERGENCY';
  const isDelayed = driver.status === 'DELAYED';
  const isOffline = driver.status === 'OFFLINE';

  if (isEmergency) {
    return `
      <div style="position: relative; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 48px; height: 48px; border-radius: 50%; background: rgba(244, 63, 94, 0.35); animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: rgba(244, 63, 94, 0.6); animation: pulse 1.5s ease-in-out infinite;"></div>
        <div style="position: relative; width: 24px; height: 24px; border-radius: 50%; background: #f43f5e; border: 2.5px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 14px #f43f5e;">
          <svg style="width: 13px; height: 13px; fill: none; stroke: #ffffff; stroke-width: 2.5;" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
      </div>
    `;
  }

  const baseColor = isDelayed ? '#f59e0b' : isOffline ? '#64748b' : '#10b981';
  const ringStyle = isSelected ? 'border: 3px solid #6366f1; box-shadow: 0 0 14px #6366f1;' : 'border: 2px solid #ffffff;';

  return `
    <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
      <div style="width: 22px; height: 22px; border-radius: 50%; background: ${baseColor}; ${ringStyle} display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.6);">
        <div style="width: 6px; height: 6px; border-radius: 50%; background: #ffffff;"></div>
      </div>
    </div>
  `;
}
