import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBusinesses } from '../../lib/api';
import { Store, MapPin, ArrowRight } from 'lucide-react';

const FALLBACK = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function CrossPromotion({ businessId, businessAddress, excludeId }: { businessId: string; businessAddress: string; excludeId: string }) {
  const [nearby, setNearby] = useState<any[]>([]);

  useEffect(() => {
    getBusinesses().then(results => {
      const current = results.find(b => b.id === excludeId);
      if (!current) {
        const filtered = results
          .filter(b => b.id !== excludeId && b.address?.toLowerCase().includes(businessAddress.split(',')[0]?.trim().toLowerCase() || ''))
          .slice(0, 2);
        setNearby(filtered);
        return;
      }

      const currentLat = current.lat;
      const currentLng = current.lng;

      let sorted = results.filter(b => b.id !== excludeId);

      if (currentLat && currentLng) {
        sorted = sorted
          .map(b => ({
            ...b,
            _dist: b.lat && b.lng ? haversineDistance(currentLat, currentLng, b.lat, b.lng) : Infinity,
          }))
          .filter(b => b._dist < 50)
          .sort((a, b) => a._dist - b._dist);
      } else {
        const cityPart = businessAddress.split(',')[0]?.trim().toLowerCase() || '';
        sorted = sorted.filter(b => b.address?.toLowerCase().includes(cityPart));
      }

      setNearby(sorted.slice(0, 2));
    }).catch(() => {});
  }, [businessId, businessAddress, excludeId]);

  if (!nearby.length) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl p-5 border border-amber-200 dark:border-amber-800/50 mt-6">
      <p className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2">
        <Store className="w-4 h-4" />
        Negocios cerca de ti
      </p>
      <div className="space-y-2">
        {nearby.map(b => (
          <Link key={b.id} to={`/${b.slug}`}
            className="flex items-center gap-3 p-2.5 bg-white dark:bg-slate-800 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all"
          >
            <img src={b.logo_url || FALLBACK} alt="" className="w-10 h-10 rounded-xl object-cover bg-slate-100" onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }} />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{b.name}</p>
              <p className="text-xs text-slate-400 truncate"><MapPin className="w-3 h-3 inline" /> {b.address || `${b._dist?.toFixed(1) || '?'} km`}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
