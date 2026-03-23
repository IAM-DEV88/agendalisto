import React from 'react';
import { User, Mail, Phone, Loader2, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../../lib/supabase';
import SectionHeader from '../ui/SectionHeader';

interface ClientsSectionProps {
  clients: UserProfile[];
  loading: boolean;
  message: { text: string; type: 'success' | 'error' } | null;
}

const ClientsSection: React.FC<ClientsSectionProps> = ({ clients, loading, message }) => {
  return (
    <div className="space-y-6">
      <SectionHeader 
        title="Mis Clientes" 
        description="Listado de personas que han realizado reservas en tu negocio"
      />

      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="font-bold">{message.text}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
          <p className="text-slate-500 font-medium">Cargando clientes...</p>
        </div>
      ) : clients.length === 0 ? (
        <div className="card p-12 flex flex-col items-center text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-6 text-slate-400">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Aún no tienes clientes</h3>
          <p className="text-slate-500 dark:text-slate-400">Los clientes aparecerán aquí automáticamente cuando realicen su primera reserva.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {clients.map((client) => (
              <li key={client.id} className="p-4 sm:p-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">
                      {client.full_name || 'Sin nombre'}
                    </h4>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 mt-1">
                      <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{client.email}</span>
                      </div>
                      {client.phone && (
                        <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                          <Phone className="w-4 h-4" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ClientsSection; 
