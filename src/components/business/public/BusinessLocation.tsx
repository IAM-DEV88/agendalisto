import React, { useEffect, useRef, useState } from 'react';
import { MapPin, ExternalLink } from 'lucide-react';
import { parseCoordinatesFromAddress } from '../../../utils/coordinates';
import type { Map as LeafletMap } from 'leaflet';

interface BusinessLocationProps {
  address: string;
  lat?: number | null;
  lng?: number | null;
}

const BusinessLocation: React.FC<BusinessLocationProps> = ({ address, lat, lng }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<typeof import('leaflet') | null>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Try DB coords first, then parse from address
  const coords = (lat && lng)
    ? { lat: Number(lat), lng: Number(lng) }
    : address
      ? parseCoordinatesFromAddress(address)
      : { lat: null, lng: null };

  const hasCoords = coords.lat !== null && coords.lng !== null;

  useEffect(() => {
    let cancelled = false;
    async function initLeaflet() {
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');
      if (!cancelled) {
        leafletRef.current = L;
        setLeafletLoaded(true);
      }
    }
    initLeaflet();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !hasCoords || !leafletLoaded || !leafletRef.current) return;

    const L = leafletRef.current;
    const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false }).setView([coords.lat!, coords.lng!], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

    const markerIcon = L.divIcon({
      html: '<div style="width:32px;height:32px;border-radius:50%;background:#7C3AED;box-shadow:0 4px 12px rgba(124,58,237,0.4);display:flex;align-items:center;justify-content:center;color:white;font-size:18px;font-weight:700;border:3px solid white;line-height:1;">📍</div>',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      className: '',
    });

    L.marker([coords.lat!, coords.lng!], { icon: markerIcon }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [hasCoords, leafletLoaded]);

  if (!address && !hasCoords) {
    return (
      <p className="text-sm text-slate-400 italic text-center py-4">Dirección no disponible</p>
    );
  }

  const googleMapsUrl = hasCoords
    ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}`
    : `https://www.google.com/maps/search/${encodeURIComponent(address)}`;
  const displayAddress = address || `${coords.lat?.toFixed(6)}, ${coords.lng?.toFixed(6)}`;

  return (
    <div className="space-y-3">
      {hasCoords ? (
        <div
          ref={mapRef}
          className="w-full h-44 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700"
          style={{ isolation: 'isolate' }}
        />
      ) : (
        <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
          <iframe
            title="Ubicación del negocio"
            className="w-full h-44"
            src={`https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
            allowFullScreen
            loading="lazy"
          />
        </div>
      )}
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-sm font-bold text-primary-600 dark:text-primary-400 hover:text-primary-500 transition-colors"
      >
        <MapPin className="w-4 h-4" />
        <span className="truncate">{displayAddress}</span>
        <ExternalLink className="w-3 h-3 flex-shrink-0" />
      </a>
    </div>
  );
};

export default BusinessLocation;
