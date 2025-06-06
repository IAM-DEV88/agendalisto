import React, { useState, useEffect } from 'react';
import { Business, updateBusiness, getBusinessCategories, BusinessCategory } from '../../lib/api';
import { supabase } from '../../lib/supabase';

interface BusinessProfileSectionProps {
  businessData: Business;
  saving: boolean;
  message: { text: string; type: 'success' | 'error' } | null;
  onSave: (e: React.FormEvent) => Promise<void>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const BusinessProfileSection: React.FC<BusinessProfileSectionProps> = ({
  businessData,
  saving,
  onSave,
  onChange
}) => {
  // Imagen fallback para cuando haya error
  const FALLBACK_LOGO = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';

  // Nombre correcto del bucket para logos
  const BUCKET_NAME = 'business-logos';

  // Obtener URL pública del bucket de Supabase
  const getPublicUrl = (key: string) => {
    if (!key || key.startsWith('http')) return key;
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(key);
    return data.publicUrl;
  };

  // Estado para la URL de previsualización inicial basado en businessData.logo_url
  const initialPreviewUrl = businessData.logo_url
    ? (businessData.logo_url.startsWith('http')
      ? businessData.logo_url
      : getPublicUrl(businessData.logo_url))
    : null;
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPreviewUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);

  // Sync previewUrl when businessData.logo_url changes externally (e.g., after saving)
  useEffect(() => {
    // Only update preview if not uploading a new file
    if (selectedFile) return;
    const key = businessData.logo_url;
    if (key) {
      // Determine base URL for the logo
      const baseUrl = key.startsWith('http')
        ? key
        : getPublicUrl(key);
      // Append cache-busting timestamp
      const bustChar = baseUrl.includes('?') ? '&' : '?';
      const cacheBustedUrl = `${baseUrl}${bustChar}t=${Date.now()}`;
      setPreviewUrl(cacheBustedUrl);
    } else {
      // No logo configured, clear preview
      setPreviewUrl(null);
    }
  }, [businessData.logo_url]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { success, data } = await getBusinessCategories();
      if (success && data) {
        setCategories(data);
      }
    };
    fetchCategories();
  }, []);

  // Handle logo file upload to Supabase storage
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];

    // Solo crear vista previa local, sin subir todavía
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    // Guardar referencia al archivo para subirlo más tarde
    setSelectedFile(file);
  };

  // Función para subir el logo al guardar cambios
  const uploadLogoFile = async () => {
    try {
      // Si no hay archivo seleccionado, no hacer nada
      if (!selectedFile) return null;

      setIsUploading(true);

      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${businessData.id}_${Date.now()}.${fileExt}`;

      // IMPORTANTE: Asegurarse de que el filePath sea solo el nombre del archivo
      // Sin incluir el nombre del bucket para evitar duplicaciones
      const filePath = fileName;

      // Subir el archivo
      const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(filePath, selectedFile, {
        upsert: true // Sobreescribir si existe
      });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Obtener URL pública
      const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

      if (!urlData || !urlData.publicUrl) {
        throw new Error('No se pudo generar URL pública');
      }

      // Logo subido con éxito

      // Limpiar el estado del archivo seleccionado
      setSelectedFile(null);

      // Retornar la URL pública para actualizar el modelo
      return urlData.publicUrl;
    } catch (error: any) {
      // Error en la subida del logo
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Interceptar el formulario para manejar la subida del logo
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Step 1: upload the logo file
    if (selectedFile) {
      const logoUrl = await uploadLogoFile();
      if (logoUrl) {
        // update parent state
        onChange({ target: { name: 'logo_url', value: logoUrl } } as any);
        // update local preview
        setPreviewUrl(logoUrl);
        // persist logo_url in database immediately to avoid stale state
        try {
          await updateBusiness(businessData.id, { logo_url: logoUrl });
        } catch (err: any) {
        }
      }
    }
    // Step 2: save any other changes via parent handler
    await onSave(e);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="dark:bg-opacity-10 bg-gray-50 shadow overflow-hidden rounded-md">
          <div className="px-4 py-5 sm:p-6">
            {/* Business logo preview (circular) */}
            <div className="flex justify-center mb-4">
              <img
                src={previewUrl || FALLBACK_LOGO}
                alt="Logo del negocio"
                className="h-24 w-24 rounded-full object-cover"
                onError={(e) => { e.currentTarget.src = FALLBACK_LOGO; }}
              />
            </div>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 ">Nombre</label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={businessData.name}
                  onChange={onChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-900 p-2"
                />
              </div>
              <div className="sm:col-span-3">
                <label htmlFor="logo" className="block text-sm font-medium text-gray-700 ">Logo del negocio</label>
                <input
                  type="file"
                  name="logo"
                  id="logo"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={isUploading}
                  className="mt-1 block w-full text-sm"
                />
              </div>
              <div className="sm:col-span-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 ">Descripción</label>
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
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 ">Dirección</label>
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
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 ">Teléfono</label>
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
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 ">Sitio Web</label>
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
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 ">Correo Electrónico</label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={businessData.email}
                  onChange={onChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-900 p-2"
                />
              </div>
              <div className="sm:col-span-3">
                <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 ">Categoría</label>
                <select
                  name="category_id"
                  id="category_id"
                  value={businessData.category_id || ''}
                  onChange={onChange}
                  className="mt-1 block w-full border-gray-300 bg-gray-50 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-900 p-2"
                >
                  <option value="" disabled>Selecciona una categoría</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

            </div>

          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className={`inline-flex rounded-md items-center px-4 py-2 border border-transparent text-sm font-medium -md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${saving ? 'opacity-70 cursor-not-allowed' : ''
              }`}
          >
            <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BusinessProfileSection; 
