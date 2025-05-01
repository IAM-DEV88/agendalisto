import React from 'react';
import { Business } from '../../lib/api';

interface BusinessProfileSectionProps {
  businessData: Business;
  saving: boolean;
  message: { text: string; type: 'success' | 'error' } | null;
  onSave: (e: React.FormEvent) => Promise<void>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const BusinessProfileSection: React.FC<BusinessProfileSectionProps> = ({
  businessData,
  saving,
  message,
  onSave,
  onChange
}) => {
  return (
    <div>      
      <div className="dark:bg-opacity-10 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={onSave}>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-white">Nombre</label>
                <input 
                  type="text" 
                  name="name" 
                  id="name" 
                  value={businessData.name} 
                  onChange={onChange} 
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-900 p-2" 
                />
              </div>
              <div className="sm:col-span-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-white">Descripción</label>
                <textarea 
                  name="description" 
                  id="description" 
                  value={businessData.description} 
                  onChange={onChange} 
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-900 p-2" 
                  rows={3}
                ></textarea>
              </div>
              <div className="sm:col-span-3">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-white">Dirección</label>
                <input 
                  type="text" 
                  name="address" 
                  id="address" 
                  value={businessData.address} 
                  onChange={onChange} 
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-900 p-2" 
                />
              </div>
              <div className="sm:col-span-3">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-white">Teléfono</label>
                <input 
                  type="text" 
                  name="phone" 
                  id="phone" 
                  value={businessData.phone} 
                  onChange={onChange} 
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-900 p-2" 
                />
              </div>
              
              <div className="sm:col-span-3">
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-white">Sitio Web</label>
                <input 
                  type="text" 
                  name="website" 
                  id="website" 
                  value={businessData.website || ''} 
                  onChange={onChange} 
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-900 p-2" 
                />
              </div>
              
              <div className="sm:col-span-3">
                <label htmlFor="logo_url" className="block text-sm font-medium text-gray-700 dark:text-white">URL del Logo</label>
                <input 
                  type="text" 
                  name="logo_url" 
                  id="logo_url" 
                  value={businessData.logo_url || ''} 
                  onChange={onChange} 
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-900 p-2" 
                />
              </div>
            </div>
            <div className="mt-6">
              <button 
                type="submit" 
                disabled={saving} 
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BusinessProfileSection; 