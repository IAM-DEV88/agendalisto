import React, { useState, useEffect } from 'react';
import { Camera, Save, Loader2, Globe, Phone, MapPin, Mail, Tag, Info, Wand2, Crosshair, MessageCircle, Instagram, Facebook, Store } from 'lucide-react';
import { Business, updateBusiness, getBusinessCategories, BusinessCategory } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { generateBusinessDescription } from '../../lib/ai';
import PhoneInput from '../ui/PhoneInput';
import { toast } from 'react-hot-toast';
import SectionHeader from '../ui/SectionHeader';
import LocationPicker from '../ui/LocationPicker';
import FormInput from '../ui/FormInput';
import FormTextarea from '../ui/FormTextarea';
import FormSelect from '../ui/FormSelect';

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
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [mapLat, setMapLat] = useState<number | null>(businessData.lat);
  const [mapLng, setMapLng] = useState<number | null>(businessData.lng);

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
      console.error('[BusinessProfileSection] Logo upload error:', error);
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
          console.error('[BusinessProfileSection] Error saving logo_url after upload:', err);
        }
      }
    }
    // Step 2: save any other changes via parent handler
    await onSave(e);
    // Step 3: save lat/lng AFTER onSave so it doesn't get overwritten
    if (mapLat !== businessData.lat || mapLng !== businessData.lng) {
      await updateBusiness(businessData.id, { lat: mapLat, lng: mapLng });
    }
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
                <div className="w-32 h-32 rounded-lg overflow-hidden border-4 border-slate-100 dark:border-slate-800 shadow-xl group-hover:border-primary-500/30 transition-all">
                  <img
                    src={previewUrl || FALLBACK_LOGO}
                    alt="Logo del negocio"
                    className="w-full h-full object-contain"
                    onError={(e) => { e.currentTarget.src = FALLBACK_LOGO; }}
                  />
                  {isUploading && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-lg cursor-pointer transition-all hover:scale-110">
                  <Camera className="w-5 h-5" />
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={isUploading} />
                </label>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Logo del Negocio</p>
            </div>

            {/* Form Fields */}
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <div className="space-y-2">
                <FormInput
                  label="Nombre del Negocio"
                  icon={Store}
                  type="text"
                  name="name"
                  id="name"
                  value={businessData.name}
                  onChange={onChange}
                  placeholder="Ej: Barbería Estilo"
                  required
                />
              </div>

              <div className="space-y-2">
                <FormSelect
                  label="Categoría"
                  icon={Tag}
                  name="category_id"
                  id="category_id"
                  value={businessData.category_id || ''}
                  onChange={onChange}
                  required
                >
                  <option value="" disabled>Selecciona una categoría</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </FormSelect>
              </div>

              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="description" className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Descripción
                  </label>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!businessData.name.trim()) {
                        toast.error('El negocio debe tener un nombre');
                        return;
                      }
                      setGeneratingDesc(true);
                      try {
                        const category = categories.find(c => c.id === businessData.category_id);
                        const desc = await generateBusinessDescription(
                          businessData.name,
                          category?.name
                        );
                        onChange({
                          target: { name: 'description', value: desc }
                        } as React.ChangeEvent<HTMLTextAreaElement>);
                        toast.success('Descripción generada con IA');
                      } catch (err: any) {
                        toast.error(err.message || 'Error al generar descripción');
                      } finally {
                        setGeneratingDesc(false);
                      }
                    }}
                    disabled={generatingDesc}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors disabled:opacity-50"
                  >
                    {generatingDesc ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Wand2 className="w-3.5 h-3.5" />
                    )}
                    {generatingDesc ? 'Generando...' : 'Generar con IA'}
                  </button>
                </div>
                <FormTextarea
                  icon={Info}
                  name="description"
                  id="description"
                  value={businessData.description}
                  onChange={onChange}
                  rows={3}
                  placeholder="Describe los servicios y valores de tu negocio..."
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  Teléfono de Contacto
                </label>
                <PhoneInput
                  id="phone"
                  value={businessData.phone}
                  onChange={(v) => onChange({ target: { name: 'phone', value: v } } as React.ChangeEvent<HTMLInputElement>)}
                  placeholder="Número de teléfono"
                  required
                />
              </div>

              <div className="space-y-2">
                <FormInput
                  label="Correo Electrónico"
                  icon={Mail}
                  type="email"
                  name="email"
                  id="email"
                  value={businessData.email}
                  onChange={onChange}
                  placeholder="contacto@negocio.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <FormInput
                  label="Dirección"
                  icon={MapPin}
                  type="text"
                  name="address"
                  id="address"
                  value={businessData.address}
                  onChange={onChange}
                  placeholder="Calle Ficticia 123, Ciudad"
                  required
                />
              </div>

              <div className="space-y-2">
                <FormInput
                  label="Sitio Web"
                  icon={Globe}
                  type="text"
                  name="website"
                  id="website"
                  value={businessData.website || ''}
                  onChange={onChange}
                  placeholder="https://www.tu-web.com"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="whatsapp" className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-500" />
                  WhatsApp <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <PhoneInput
                  id="whatsapp"
                  value={businessData.whatsapp || ''}
                  onChange={(v) => onChange({ target: { name: 'whatsapp', value: v } } as React.ChangeEvent<HTMLInputElement>)}
                  placeholder="Número de WhatsApp"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="instagram" className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Instagram className="w-4 h-4 text-pink-500" />
                  Instagram <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <Instagram className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-500" />
                  <input
                    type="text"
                    name="instagram"
                    id="instagram"
                    value={businessData.instagram || ''}
                    onChange={onChange}
                    placeholder="@usuario"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="facebook" className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Facebook className="w-4 h-4 text-blue-500" />
                  Facebook <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <Facebook className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                  <input
                    type="text"
                    name="facebook"
                    id="facebook"
                    value={businessData.facebook || ''}
                    onChange={onChange}
                    placeholder="https://facebook.com/tunegocio"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-2">
                  <Crosshair className="w-4 h-4 text-slate-400" />
                  Ubicación en el mapa
                </label>
                <LocationPicker
                  lat={mapLat}
                  lng={mapLng}
                  onChange={(lat, lng) => { setMapLat(lat); setMapLng(lng); }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Showcase Toggle */}
        <div className="bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800/50 p-5">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="showcase_only"
              name="showcase_only"
              checked={!!businessData.showcase_only}
              onChange={onChange}
              className="mt-0.5 w-4 h-4 rounded-lg border-amber-300 text-amber-600 focus:ring-amber-500"
            />
            <div>
              <label htmlFor="showcase_only" className="font-bold text-sm text-amber-800 dark:text-amber-300 cursor-pointer">
                Solo mostrar información (escaparate)
              </label>
              <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-0.5">
                El negocio aparecerá en resultados de búsqueda sin sección de servicios ni reservas online.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving || isUploading}
            className="inline-flex items-center px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-primary-500/25 gap-2 disabled:opacity-50"
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
