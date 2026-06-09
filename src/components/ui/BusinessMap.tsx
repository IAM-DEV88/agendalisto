import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Business } from '../../lib/api';

interface BusinessMapProps {
  businesses: Business[];
}

const DEFAULT_CENTER: [number, number] = [4.142, -73.63];

export default function BusinessMap({ businesses }: BusinessMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, { zoomControl: true, attributionControl: false }).setView(DEFAULT_CENTER, 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !businesses.length) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const bounds = new L.LatLngBounds([]);
    let hasValidCoords = false;

    const icon = L.divIcon({
      html: '<div class="w-9 h-9 rounded-xl bg-primary-600 shadow-lg shadow-primary-500/30 flex items-center justify-center text-white font-black text-sm border-2 border-white">B</div>',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      className: '',
    });

    businesses.forEach(biz => {
      const lat = biz.lat;
      const lng = biz.lng;
      if (!lat || !lng) return;

      hasValidCoords = true;
      const marker = L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="min-width:200px;font-family:system-ui,sans-serif;">
            <a href="/${biz.slug}" style="text-decoration:none;color:inherit;">
              <strong style="font-size:14px;color:#1e293b;">${biz.name}</strong>
            </a>
            ${biz.description ? `<p style="font-size:12px;color:#64748b;margin:4px 0;">${biz.description.substring(0, 80)}</p>` : ''}
            <a href="/${biz.slug}" style="display:inline-block;margin-top:6px;padding:4px 12px;background:#7C3AED;color:white;border-radius:8px;font-size:11px;font-weight:700;text-decoration:none;">Ver perfil</a>
          </div>
        `);

      markersRef.current.push(marker);
      bounds.extend([lat, lng]);
    });

    if (hasValidCoords) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [businesses]);

  const hasCoords = businesses.some(b => b.lat && b.lng);

  if (!hasCoords) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
        <p className="text-sm text-slate-400">Los negocios no tienen ubicación configurada</p>
      </div>
    );
  }

  return <div ref={mapRef} className="w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 z-0" />;
}
