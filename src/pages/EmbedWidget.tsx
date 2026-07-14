import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getBusinessBySlug, getBusinessServices, Business, Service } from '../lib/api';

export default function EmbedWidget() {
  const { slug } = useParams<{ slug: string }>();
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      getBusinessBySlug(slug).then(r => { if (r.success && r.business) setBusiness(r.business); }),
      getBusinessServices(slug).then(r => { if (r.success && r.data) setServices(r.data.filter(s => s.is_active !== false)); }),
    ]).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="flex items-center justify-center h-32 text-sm text-slate-400">Cargando...</div>;
  if (!business) return <div className="text-sm text-red-400 p-4">Negocio no encontrado</div>;

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20, maxWidth: 360 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        {business.logo_url && <img src={business.logo_url} alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }} />}
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#1e293b' }}>{business.name}</div>
          {business.description && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{business.description.substring(0, 60)}</div>}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {services.map(s => (
          <a key={s.id} href={`/${slug}/book/${s.id}`}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f8fafc', borderRadius: 10, textDecoration: 'none', color: 'inherit' }}
          >
            <span style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{s.name}</span>
            <span style={{ fontSize: 12, color: '#7C3AED', fontWeight: 700 }}>
              {s.price ? `$${s.price.toLocaleString()}` : 'Reservar'}
            </span>
          </a>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 12, fontSize: 10, color: '#94a3b8' }}>
        Powered by <a href="https://agendalisto.com" style={{ color: '#7C3AED', fontWeight: 700, textDecoration: 'none' }}>AgendaYa</a>
      </div>
    </div>
  );
}
