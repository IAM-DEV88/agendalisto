import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Clock, DollarSign, User, Info, CheckCircle, XCircle, Loader2, Image as ImageIcon, X } from 'lucide-react';
import type { Service } from '../../lib/api';
import { notifySuccess, notifyError } from '../../lib/toast';
import SectionHeader from '../ui/SectionHeader';
import { Pagination } from '../ui/Pagination';
import { supabase } from '../../lib/supabase';

interface ServicesSectionProps {
  businessId: string;
  getServices: (businessId: string) => Promise<{ success: boolean; data?: Service[]; error?: string }>;
  createService: (service: Omit<Service, 'id' | 'likes_count' | 'created_at' | 'updated_at'>) => Promise<{ success: boolean; data?: Service; error?: string }>;
  updateService: (id: string, service: Partial<Service>) => Promise<{ success: boolean; data?: Service; error?: string }>;
  deleteService: (id: string) => Promise<{ success: boolean; error?: string }>;
  itemsPerPage: number;
}

const ServicesSection: React.FC<ServicesSectionProps> = ({
  businessId,
  getServices,
  createService,
  updateService,
  deleteService,
  itemsPerPage,
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: '',
    price: '',
    is_active: true,
    provider: '',
    image_urls: [] as string[]
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
      provider: '',
      image_urls: []
    });
    setEditingService(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const serviceData = {
      business_id: businessId,
      name: formData.name,
      description: formData.description,
      duration: parseInt(formData.duration),
      price: parseFloat(formData.price),
      is_active: formData.is_active,
      provider: formData.provider || '',
      image_urls: formData.image_urls
    };

    try {
      let response;
      if (editingService) {
        response = await updateService(editingService.id, serviceData);
        if (response.success) {
          notifySuccess('Servicio actualizado correctamente');
        } else {
          throw new Error(response.error);
        }
      } else {
        response = await createService(serviceData);
        if (response.success) {
          notifySuccess('Servicio creado correctamente');
        } else {
          throw new Error(response.error);
        }
      }
      setModalOpen(false);
      resetForm();
      await loadServices();
    } catch (err: any) {
      const errMsg = err.message || 'Error al guardar el servicio';
      setError(errMsg);
      notifyError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este servicio?')) {
      return;
    }

    try {
      const response = await deleteService(id);
      
      if (response.success) {
        await loadServices();
        notifySuccess('Servicio eliminado correctamente');
      } else {
        const errMsg = response.error || 'Error al eliminar el servicio';
        setError(errMsg);
        notifyError(errMsg);
      }
    } catch (err: any) {
      const errMsg = err.message || 'Error al eliminar el servicio';
      setError(errMsg);
      notifyError(errMsg);
    }
  };

  const handleEdit = (service: Service) => {
    setError(null);
    setEditingService(service);
    
    // Asegurarse de que image_urls sea un array válido
    let images: string[] = [];
    if (Array.isArray(service.image_urls)) {
      images = service.image_urls;
    } else if (typeof service.image_urls === 'string') {
      try {
        images = JSON.parse(service.image_urls);
      } catch (e) {
        images = [];
      }
    }

    setFormData({
      name: service.name,
      description: service.description,
      duration: service.duration.toString(),
      price: service.price.toString(),
      is_active: service.is_active,
      provider: service.provider || '',
      image_urls: images
    });
    setModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    
    setIsUploading(true);
    const files = Array.from(e.target.files);
    const newUrls: string[] = [...formData.image_urls];

    try {
      for (const file of files) {
        // Validación de tipo MIME
        if (!allowedTypes.includes(file.type)) {
          throw new Error(`El archivo ${file.name} no es una imagen válida (JPG, PNG, WEBP, GIF)`);
        }
        
        // Validación de tamaño
        if (file.size > maxFileSize) {
          throw new Error(`El archivo ${file.name} supera el límite de 5MB`);
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${businessId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `service-galleries/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('business-assets')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('business-assets')
          .getPublicUrl(filePath);

        newUrls.push(publicUrl);
      }
      
      setFormData(prev => ({ ...prev, image_urls: newUrls }));
      notifySuccess('Imágenes subidas correctamente');
    } catch (err: any) {
      notifyError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      image_urls: prev.image_urls.filter((_, i) => i !== index)
    }));
  };

  const totalPages = Math.ceil(services.length / itemsPerPage);
  const pagedServices = services.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      <SectionHeader 
        title="Servicios" 
        description="Gestiona el catálogo de servicios que ofreces a tus clientes"
        actionButton={
          <button
            type="button"
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-primary-500/25 gap-2"
          >
            <Plus className="w-5 h-5" />
            Nuevo Servicio
          </button>
        }
      />

      {error && (
        <div className="alert alert-error flex items-center gap-3">
          <Info className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
          <p className="text-slate-500 font-medium">Cargando servicios...</p>
        </div>
      ) : services.length === 0 ? (
        <div className="card p-12 flex flex-col items-center text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-6 text-slate-400">
            <Plus className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">No hay servicios</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-8">Comienza agregando tu primer servicio para que tus clientes puedan reservar.</p>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
            className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-500/25 gap-2"
          >
            <Plus className="w-5 h-5" />
            Nuevo Servicio
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {pagedServices.map((service) => (
              <div
                key={service.id}
                className={`card group flex flex-col h-full transition-all hover:border-primary-500/30 ${
                  !service.is_active ? 'opacity-70 grayscale-[0.3]' : ''
                }`}
              >
                <div className="p-6 flex-grow">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="min-w-0">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white truncate tracking-tight">
                        {service.name}
                      </h3>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {service.description}
                      </p>
                    </div>
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                      service.is_active 
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
                    }`}>
                      {service.is_active ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <Clock className="w-4 h-4" />
                        <span>Duración</span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">{service.duration} min</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <DollarSign className="w-4 h-4" />
                        <span>Precio</span>
                      </div>
                      <span className="font-black text-lg text-primary-600 dark:text-primary-400">${service.price.toFixed(2)}</span>
                    </div>
                    {service.provider && (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                          <User className="w-4 h-4" />
                          <span>Proveedor</span>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white truncate max-w-[120px]">{service.provider}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                  <button
                    onClick={() => handleEdit(service)}
                    className="p-2 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={setCurrentPage} 
          />
        </>
      )}

      {/* Modal Form */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <form onSubmit={handleSubmit}>
              <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Completa los datos del servicio para actualizar tu catálogo
                </p>
              </div>

              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-1">
                  <label htmlFor="name" className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Nombre del servicio
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                    placeholder="Ej: Corte de Cabello"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="description" className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Descripción
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all resize-none"
                    placeholder="Describe brevemente el servicio..."
                    required
                  ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="duration" className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      Duración (min)
                    </label>
                    <input
                      type="number"
                      id="duration"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      min="5"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="price" className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      Precio ($)
                    </label>
                    <input
                      type="number"
                      id="price"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="provider" className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Proveedor (opcional)
                  </label>
                  <input
                    type="text"
                    id="provider"
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                    placeholder="Nombre del profesional"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Galería de Imágenes
                  </label>
                  
                  <div className="grid grid-cols-3 gap-3">
                    {formData.image_urls.map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group">
                        <img src={url} alt={`Gallery ${index}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    
                    <label className={`relative aspect-square rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                      {isUploading ? (
                        <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-6 h-6 text-slate-400" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Subir</span>
                        </>
                      )}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Puedes subir varias imágenes para mostrar tu trabajo.</p>
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 rounded-md border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                    Servicio activo y visible para reservas
                  </label>
                </div>
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row-reverse gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingService ? 'Guardar Cambios' : 'Crear Servicio'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    resetForm();
                  }}
                  className="w-full sm:w-auto px-8 py-3 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesSection; 
