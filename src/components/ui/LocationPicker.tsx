import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Search, Loader2 } from 'lucide-react';

interface LocationPickerProps {
  lat?: number | null;
  lng?: number | null;
  onChange: (lat: number, lng: number) => void;
}

const DEFAULT_CENTER: [number, number] = [4.142, -73.63];
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

const markerIcon = L.divIcon({
  html: '<div style="width:32px;height:32px;border-radius:50%;background:#7C3AED;box-shadow:0 4px 12px rgba(124,58,237,0.4);display:flex;align-items:center;justify-content:center;color:white;font-size:18px;font-weight:700;border:3px solid white;line-height:1;">📍</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  className: '',
});

export default function LocationPicker({ lat, lng, onChange }: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const initializedRef = useRef(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [latInput, setLatInput] = useState(lat?.toString() || '');
  const [lngInput, setLngInput] = useState(lng?.toString() || '');

  const hasCoords = lat !== null && lat !== undefined && lng !== null && lng !== undefined;

  const placeMarker = (newLat: number, newLng: number) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (markerRef.current) markerRef.current.remove();

    const marker = L.marker([newLat, newLng], { icon: markerIcon, draggable: true }).addTo(map);
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      setLatInput(pos.lat.toFixed(6));
      setLngInput(pos.lng.toFixed(6));
      onChange(pos.lat, pos.lng);
    });
    markerRef.current = marker;
    map.setView([newLat, newLng], 15);

    setLatInput(newLat.toFixed(6));
    setLngInput(newLng.toFixed(6));
    onChange(newLat, newLng);
  };

  useEffect(() => {
    if (!mapRef.current || initializedRef.current) return;
    initializedRef.current = true;

    const map = L.map(mapRef.current, { zoomControl: true, attributionControl: false });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

    if (hasCoords) {
      map.setView([lat!, lng!], 15);
    } else {
      map.setView(DEFAULT_CENTER, 6);
    }

    map.on('click', (e: L.LeafletMouseEvent) => {
      placeMarker(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
      initializedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (hasCoords && mapInstanceRef.current) {
      placeMarker(lat!, lng!);
    }
  }, [lat, lng]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`${NOMINATIM}?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&countrycodes=co`);
      const data = await res.json();
      if (data.length > 0) {
        const { lat: slat, lon: slon } = data[0];
        placeMarker(parseFloat(slat), parseFloat(slon));
      }
    } catch { /* ignore */ } finally {
      setSearching(false);
    }
  };

  const handleLatLngInput = () => {
    const newLat = parseFloat(latInput);
    const newLng = parseFloat(lngInput);
    if (!isNaN(newLat) && !isNaN(newLng)) {
      placeMarker(newLat, newLng);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Buscar dirección o lugar..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
          />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching}
          className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50"
        >
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
        </button>
      </div>

      <div
        ref={mapRef}
        className="w-full h-[300px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-crosshair"
        style={{ isolation: 'isolate' }}
      />

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Latitud</label>
          <input
            type="text"
            value={latInput}
            onChange={e => setLatInput(e.target.value)}
            onBlur={handleLatLngInput}
            placeholder="-90 a 90"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Longitud</label>
          <input
            type="text"
            value={lngInput}
            onChange={e => setLngInput(e.target.value)}
            onBlur={handleLatLngInput}
            placeholder="-180 a 180"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
          />
        </div>
      </div>

      <p className="text-xs text-slate-400 flex items-center gap-1.5">
        <MapPin className="w-3 h-3" />
        Haz clic en el mapa o ingresa las coordenadas manualmente
      </p>
    </div>
  );
}
