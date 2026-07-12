import React from 'react';
import { User, Mail, Phone, Users, AlertCircle } from 'lucide-react';
import { UserProfile } from '../../lib/supabase';
import EmptyState from '../ui/EmptyState';

interface ClientsSectionProps {
  clients: UserProfile[];
  loading: boolean;
  message: { text: string; type: 'success' | 'error' } | null;
}

function SkeletonClient() {
  return (
    <div className="flex items-center gap-4 p-4 sm:p-6 animate-pulse">
      <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-32" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-lg w-48" />
      </div>
    </div>
  );
}

const ClientsSection: React.FC<ClientsSectionProps> = ({ clients, loading, message }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-0">Mis Clientes</h2>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5 mb-0">
          Personas que han reservado en tu negocio
        </p>
      </div>

      {message && (
        <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold animate-in fade-in slide-in-from-top-2 duration-300 ${
          message.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
            : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
        }`}>
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
          {[1, 2, 3].map(i => <SkeletonClient key={i} />)}
        </div>
      ) : clients.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8" />}
          title="Aún no tienes clientes"
          description="Los clientes aparecerán automáticamente cuando realicen su primera reserva."
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
          {clients.map((client) => (
            <div key={client.id} className="p-4 sm:p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {client.full_name || 'Sin nombre'}
                  </h4>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 mt-1">
                    <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                    {client.phone && (
                      <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientsSection;
