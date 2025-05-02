import React, { useState, useEffect } from 'react';
import { Service } from '../../lib/api';

interface ServicesSectionProps {
  businessId: string;
  getServices: (businessId: string) => Promise<{ success: boolean, data?: Service[], error?: string }>;
  createService: (service: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => Promise<any>;
  updateService: (id: string, service: Partial<Service>) => Promise<any>;
  deleteService: (id: string) => Promise<boolean>;
}

const ServicesSection: React.FC<ServicesSectionProps> = ({
  businessId,
  getServices,
  createService,
  updateService,
  deleteService
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const itemsPerPage = 4;
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: '',
    price: '',
    is_active: true,
    provider: ''
  });

  useEffect(() => {
    if (businessId) {
      loadServices();
    }
  }, [businessId]);

  const loadServices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getServices(businessId);
      
      if (response.success && response.data) {
        setServices(response.data);
        setCurrentPage(1);
      } else {
        setError(response.error || 'Error al cargar los servicios');
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar los servicios');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      duration: '',
      price: '',
      is_active: true,
      provider: ''
    });
    setEditingService(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const serviceData = {
      business_id: businessId,
      name: formData.name,
      description: formData.description,
      duration: parseInt(formData.duration),
      price: parseFloat(formData.price),
      is_active: formData.is_active,
      provider: formData.provider
    };

    try {
      if (editingService) {
        await updateService(editingService.id, serviceData);
      } else {
        await createService(serviceData);
      }
    } catch (err: any) {
    } finally {
      setModalOpen(false);
      resetForm();
      await loadServices();
      setError(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este servicio?')) {
      return;
    }

    try {
      const success = await deleteService(id);
      
      if (success) {
        await loadServices();
      } else {
        setError('Error al eliminar el servicio');
      }
    } catch (err: any) {
      setError(err.message || 'Error al eliminar el servicio');
    }
  };

  const handleEdit = (service: Service) => {
    setError(null);
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      duration: service.duration.toString(),
      price: service.price.toString(),
      is_active: service.is_active,
      provider: service.provider
    });
    setModalOpen(true);
  };

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="mt-2 sm:mt-0 sm:ml-4">
          <button
            type="button"
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Nuevo Servicio
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-12">
          <div className="flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay servicios</h3>
          <p className="mt-1 text-sm text-gray-500">Comienza agregando tu primer servicio.</p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setModalOpen(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Nuevo Servicio
            </button>
          </div>
        </div>
      ) : (
        <>
        <div className="mt-2 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(() => {
            const pagedServices = services.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
            return pagedServices.map((service) => (
              <div
                key={service.id}
                className={`dark:bg-opacity-10 bg-white overflow-hidden flex flex-col shadow rounded-lg ${
                  !service.is_active ? 'opacity-75' : ''
                }`}
              >
                <div className="p-6 grow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="dark:text-white text-lg font-medium text-gray-900">{service.name}</h3>
                      <p className="dark:text-white mt-1 text-sm text-gray-500">{service.description}</p>
                    </div>
                    {!service.is_active && (
                      <span className="dark:text-white inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Inactivo
                      </span>
                    )}
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm">
                      <span className="dark:text-white text-gray-500">Duración</span>
                      <span className="dark:text-white font-medium">{service.duration} min</span>
                    </div>
                    <div className="mt-1 flex justify-between text-sm">
                      <span className="dark:text-white text-gray-500">Precio</span>
                      <span className="dark:text-white font-medium">${service.price.toFixed(2)}</span>
                    </div>
                    {service.provider && (
                      <div className="mt-1 flex justify-between text-sm">
                        <span className="dark:text-white text-gray-500">Proveedor</span>
                        <span className="dark:text-white font-medium">{service.provider}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="dark:bg-opacity-10 bg-gray-50 px-6 py-3 flex justify-end space-x-3">
                  <button
                    onClick={() => handleEdit(service)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bdarg-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 0L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Eliminar
                  </button>
                </div>
              </div>
            ));
          })()}
        </div>
        {/* Controles de paginación */}
        {Math.ceil(services.length / itemsPerPage) > 1 && (
          <div className="flex justify-center mt-4">
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => prev - 1)}
                disabled={currentPage === 1}
                aria-label="Anterior"
                className="px-3 py-1 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >◀</button>
              {Array.from({ length: Math.ceil(services.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded-md ${currentPage === page ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >{page}</button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={currentPage === Math.ceil(services.length / itemsPerPage)}
                aria-label="Siguiente"
                className="px-3 py-1 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >▶</button>
            </nav>
          </div>
        )}
        </>
      )}

      {/* Modal Form */}
      {modalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="inline-block align-bottom dark:bg-opacity-10 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white dark:bg-gray-900 px-4 pt-20 pb-4 sm:p-6 sm:pb-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Nombre del servicio
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Descripción
                      </label>
                      <textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                      ></textarea>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                          Duración (minutos)
                        </label>
                        <input
                          type="number"
                          id="duration"
                          value={formData.duration}
                          onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                          min="5"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                          Precio
                        </label>
                        <input
                          type="number"
                          id="price"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          min="0"
                          step="0.01"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="provider" className="block text-sm font-medium text-gray-700">
                        Proveedor (opcional)
                      </label>
                      <input
                        type="text"
                        id="provider"
                        value={formData.provider}
                        onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                        Servicio activo
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {editingService ? 'Guardar cambios' : 'Crear servicio'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalOpen(false);
                      resetForm();
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesSection; 
