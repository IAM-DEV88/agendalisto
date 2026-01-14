import React from 'react';
import { BusinessConfig } from '../../lib/api';
import { useItemsPerPage } from '../../hooks/useItemsPerPage';
import { useAuth } from '../../hooks/useAuth';

interface BusinessConfigSectionProps {
  config: BusinessConfig;
  loading: boolean;
  saving: boolean;
  message: { text: string; type: 'success' | 'error' } | null;
  onSave: (e: React.FormEvent) => Promise<boolean | void>;
  onConfigChange: (field: keyof BusinessConfig, value: any) => void;
}

export const BusinessConfigSection: React.FC<BusinessConfigSectionProps> = ({
  config,
  loading,
  saving,
  message,
  onSave,
  onConfigChange
}) => {
  const { user } = useAuth();
  const { localItemsPerPage, setLocalItemsPerPage, saveItemsPerPage } = useItemsPerPage(user?.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await saveItemsPerPage(localItemsPerPage);
    if (result.success) {
      onSave(e);
    }
  };

  return (
    <div>      
      {message && (
        <div className={`mb-4 p-4  ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {message.type === 'error' ? (
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-800">{message.type === 'success' ? 'Éxito' : 'Error'}</h3>
              <div className="mt-2 text-sm text-gray-700">
                <p>{message.text}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          {/* Reservas Online */}
          <div className="bg-gray-50 dark:bg-opacity-10 shadow p-4 rounded-md">
            <h2 className="text-lg font-medium  text-gray-900 dark:text-gray-300 mb-4">Reservas Online</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="permitir_reservas_online"
                    type="checkbox"
                    checked={config.permitir_reservas_online}
                    onChange={(e) => onConfigChange('permitir_reservas_online', e.target.checked)}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 "
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="permitir_reservas_online" className="font-medium text-gray-700 dark:text-gray-300">
                    Permitir reservas online
                  </label>
                  <p className="text-gray-500 dark:text-gray-400">Los clientes podrán realizar reservas directamente desde la web.</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="requiere_confirmacion"
                    type="checkbox"
                    checked={config.requiere_confirmacion}
                    onChange={(e) => onConfigChange('requiere_confirmacion', e.target.checked)}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 "
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="requiere_confirmacion" className="font-medium text-gray-700 dark:text-gray-300">
                    Requerir confirmación manual
                  </label>
                  <p className="text-gray-500 dark:text-gray-400">Las reservas quedarán pendientes hasta que las confirmes manualmente.</p>
                </div>
              </div>

              <div>
                <label htmlFor="tiempo_minimo_cancelacion" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tiempo mínimo para cancelaciones (horas)
                </label>
                <input
                  type="number"
                  id="tiempo_minimo_cancelacion"
                  value={config.tiempo_minimo_cancelacion}
                  onChange={(e) => onConfigChange('tiempo_minimo_cancelacion', parseInt(e.target.value))}
                  min="0"
                  max="72"
                  className="mt-1 block w-full border border-gray-300 -md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <p className="mt-2 text-sm  text-gray-500">
                  Tiempo mínimo requerido para que los clientes puedan cancelar sus citas.
                </p>
              </div>
            </div>
          </div>

          {/* Información Visible */}
          <div className="bg-gray-50 dark:bg-opacity-10 shadow p-4 rounded-md">
            <h2 className="text-lg font-medium  text-gray-900 dark:text-gray-300 mb-4">Información Visible</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="mostrar_precios"
                    type="checkbox"
                    checked={config.mostrar_precios}
                    onChange={(e) => onConfigChange('mostrar_precios', e.target.checked)}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 "
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="mostrar_precios" className="font-medium text-gray-700 dark:text-gray-300">
                    Mostrar precios
                  </label>
                  <p className="text-gray-500 dark:text-gray-400">Los precios de los servicios serán visibles en la página pública.</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="mostrar_telefono"
                    type="checkbox"
                    checked={config.mostrar_telefono}
                    onChange={(e) => onConfigChange('mostrar_telefono', e.target.checked)}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 "
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="mostrar_telefono" className="font-medium text-gray-700 dark:text-gray-300">
                    Mostrar teléfono
                  </label>
                  <p className="text-gray-500 dark:text-gray-400">Tu número de teléfono será visible en la página pública.</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="mostrar_email"
                    type="checkbox"
                    checked={config.mostrar_email}
                    onChange={(e) => onConfigChange('mostrar_email', e.target.checked)}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 "
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="mostrar_email" className="font-medium text-gray-700 dark:text-gray-300">
                    Mostrar email
                  </label>
                  <p className="text-gray-500 dark:text-gray-400">Tu dirección de email será visible en la página pública.</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="mostrar_redes_sociales"
                    type="checkbox"
                    checked={config.mostrar_redes_sociales}
                    onChange={(e) => onConfigChange('mostrar_redes_sociales', e.target.checked)}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 "
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="mostrar_redes_sociales" className="font-medium text-gray-700 dark:text-gray-300">
                    Mostrar redes sociales
                  </label>
                  <p className="text-gray-500 dark:text-gray-400">Tus perfiles de redes sociales serán visibles en la página pública.</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="mostrar_direccion"
                    type="checkbox"
                    checked={config.mostrar_direccion}
                    onChange={(e) => onConfigChange('mostrar_direccion', e.target.checked)}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 "
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="mostrar_direccion" className="font-medium text-gray-700 dark:text-gray-300">
                    Mostrar dirección
                  </label>
                  <p className="text-gray-500 dark:text-gray-400">Tu dirección y mapa serán visibles en la página pública.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notificaciones */}
          <div className="bg-gray-50 dark:bg-opacity-10 shadow p-4 rounded-md">
            <h2 className="text-lg font-medium  text-gray-900 mb-4 dark:text-gray-300">Notificaciones</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="notificaciones_email"
                    type="checkbox"
                    checked={config.notificaciones_email}
                    onChange={(e) => onConfigChange('notificaciones_email', e.target.checked)}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 "
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="notificaciones_email" className="font-medium text-gray-700 dark:text-gray-300">
                    Notificaciones por email
                  </label>
                  <p className="text-gray-500 dark:text-gray-400">Recibir notificaciones de reservas por email.</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="notificaciones_whatsapp"
                    type="checkbox"
                    checked={config.notificaciones_whatsapp}
                    onChange={(e) => onConfigChange('notificaciones_whatsapp', e.target.checked)}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 "
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="notificaciones_whatsapp" className="font-medium text-gray-700 dark:text-gray-300">
                    Notificaciones por WhatsApp
                  </label>
                  <p className="text-gray-500 dark:text-gray-400">Recibir notificaciones de reservas por WhatsApp.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Paginación */}
          <div className="bg-gray-100 dark:bg-opacity-10 rounded-md p-6">
            <h3 className="text-lg font-medium text-white mb-4">Paginación</h3>
            <div className="space-y-4">
              <div>
                <div className="mt-1 flex items-center space-x-2">
                <label htmlFor="items_per_page" className="block text-sm font-medium text-gray-300">
                  Registros por página
                </label>
                  <input
                    type="number"
                    id="items_per_page"
                    name="items_per_page"
                    min="1"
                    max="50"
                    value={localItemsPerPage}
                    onChange={(e) => setLocalItemsPerPage(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                    className="block w-24 rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-400">
                  Número de registros que se mostrarán por página en las listas.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className={`inline-flex rounded-md items-center px-4 py-2 border border-transparent text-sm font-medium -md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                saving ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default BusinessConfigSection; 
