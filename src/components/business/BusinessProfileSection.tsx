import React, { useState, useEffect } from 'react';
import { Camera, Save, Loader2, Globe, Phone, MapPin, Mail, Tag, Info, Settings } from 'lucide-react';
import { Business, updateBusiness, getBusinessCategories, BusinessCategory } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import SectionHeader from '../ui/SectionHeader';

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
    <div className="space-y-6">
      <SectionHeader 
        title="Perfil del Negocio" 
        description="Información pública y datos de contacto de tu establecimiento"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Logo Upload Section */}
            <div className="flex-shrink-0 flex flex-col items-center gap-4 w-full md:w-auto">
              <div className="relative group">
                <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-slate-100 dark:border-slate-800 shadow-xl group-hover:border-primary-500/30 transition-all">
                  <img
                    src={previewUrl || FALLBACK_LOGO}
                    alt="Logo del negocio"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = FALLBACK_LOGO; }}
                  />
                  {isUploading && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-lg cursor-pointer transition-all hover:scale-110">
                  <Camera className="w-5 h-5" />
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={isUploading} />
                </label>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Logo del Negocio</p>
            </div>

            {/* Form Fields */}
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-slate-400" />
                  Nombre del Negocio
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={businessData.name}
                  onChange={onChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:text-black dark:border-slate-700 bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium text-slate-900 dark:text-white"
                  placeholder="Ej: Barbería Estilo"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="category_id" className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-slate-400" />
                  Categoría
                </label>
                <select
                  name="category_id"
                  id="category_id"
                  value={businessData.category_id || ''}
                  onChange={onChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:text-black dark:border-slate-700 bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium text-slate-900 dark:text-white"
                  required
                >
                  <option value="" disabled>Selecciona una categoría</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="description" className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Info className="w-4 h-4 text-slate-400" />
                  Descripción
                </label>
                <textarea
                  name="description"
                  id="description"
                  value={businessData.description}
                  onChange={onChange}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:text-black dark:border-slate-700 bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium resize-none text-slate-900 dark:text-white"
                  placeholder="Describe los servicios y valores de tu negocio..."
                ></textarea>
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  Teléfono de Contacto
                </label>
                <input
                  type="text"
                  name="phone"
                  id="phone"
                  value={businessData.phone}
                  onChange={onChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:text-black dark:border-slate-700 bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium text-slate-900 dark:text-white"
                  placeholder="+56 9 1234 5678"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={businessData.email}
                  onChange={onChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:text-black dark:border-slate-700 bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium text-slate-900 dark:text-white"
                  placeholder="contacto@negocio.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="address" className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  Dirección
                </label>
                <input
                  type="text"
                  name="address"
                  id="address"
                  value={businessData.address}
                  onChange={onChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:text-black dark:border-slate-700 bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium text-slate-900 dark:text-white"
                  placeholder="Calle Ficticia 123, Ciudad"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="website" className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-slate-400" />
                  Sitio Web (opcional)
                </label>
                <input
                  type="text"
                  name="website"
                  id="website"
                  value={businessData.website || ''}
                  onChange={onChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:text-black dark:border-slate-700 bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium text-slate-900 dark:text-white"
                  placeholder="https://www.tu-web.com"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving || isUploading}
            className="inline-flex items-center px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-500/25 gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BusinessProfileSection; 
