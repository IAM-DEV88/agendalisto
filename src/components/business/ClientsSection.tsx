import React from 'react';
import { UserProfile } from '../../lib/supabase';

interface ClientsSectionProps {
  clients: UserProfile[];
  loading: boolean;
  message: { text: string; type: 'success' | 'error' } | null;
}

const ClientsSection: React.FC<ClientsSectionProps> = ({ clients, loading, message }) => {
  return (
    <div>
      {message && (
        <div className={`mb-4 p-4 rounded ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : clients.length === 0 ? (
        <div className="dark:bg-opacity-10 bg-gray-50 shadow overflow-hidden sm:rounded-md p-6 text-center">
          <p className="text-gray-500 dark:text-white">No hay clientes.</p>
        </div>
      ) : (
        <div className="dark:bg-opacity-10 bg-gray-50 shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {clients.map((client) => (
              <li key={client.id} className="px-4 py-4 sm:px-6">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{client.full_name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email: {client.email}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Teléfono: {client.phone}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ClientsSection; 
