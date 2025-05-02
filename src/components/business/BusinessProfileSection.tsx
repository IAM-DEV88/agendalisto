import React, { useState, useEffect } from 'react';
import { Business, updateBusiness } from '../../lib/api';
import { supabase } from '../../lib/supabase';

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
      <div className="dark:bg-opacity-10 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={handleSubmit}>
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
                <label htmlFor="logo" className="block text-sm font-medium text-gray-700 dark:text-white">Logo del negocio</label>
                <input
                  type="file"
                  name="logo"
                  id="logo"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={isUploading}
                  className="mt-1 block w-full text-sm"
                />
                <div className="mt-2">
                  {isUploading && (
                    <div className="text-xs text-gray-500 mb-1">Subiendo logo...</div>
                  )}
                  {selectedFile && (
                    <div className="text-xs text-blue-500 mb-1">Archivo listo para subir: {selectedFile.name}</div>
                  )}
                  {previewUrl && (
                    <>
                      <img 
                        src={previewUrl} 
                        alt="Logo del negocio" 
                        className={`h-20 w-20 object-cover rounded ${isUploading ? 'opacity-70' : ''}`}
                        onError={(e) => {
                          // Usar imagen fallback cuando hay error
                          e.currentTarget.src = FALLBACK_LOGO;
                        }}
                      />
                    </>
                  )}
                </div>
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
