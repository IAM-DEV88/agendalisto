import React, { type FormEvent, type ChangeEvent, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface UserProfileSectionProps {
  profileData: {
    full_name: string;
    email: string;
    phone: string;
    avatar_url: string;
  };
  saving: boolean;
  message: { text: string; type: 'success' | 'error' } | null;
  onSave: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

const UserProfileSection: React.FC<UserProfileSectionProps> = ({
  profileData,
  saving,
  onSave,
  onChange
}) => {
  // Debug estado inicial

  // Estado para la URL de previsualización
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");

  // Imagen fallback para cuando hay error
  const FALLBACK_AVATAR = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';

  // URLs del bucket

  // Generar URL firmada para preview desde Supabase (si bucket es privado)
  const getSignedUrl = async (path: string): Promise<string | null> => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const { data, error } = await supabase.storage
      .from('avatars')
      .createSignedUrl(path, 60 * 60);
    if (error || !data.signedUrl) {
      console.error('Error al crear signed URL', error);
      return null;
    }
    return data.signedUrl;
  };

  // Inicializar y actualizar previewUrl cuando cambia profileData
  useEffect(() => {
    if (!profileData.avatar_url || isUploading) return;
    (async () => {
      try {
        const url = await getSignedUrl(profileData.avatar_url);
        if (url) setPreviewUrl(url);
        else setPreviewUrl(null);
      } catch (err: any) {
        console.error('Error al obtener signed URL', err);
        setPreviewUrl(null);
      }
    })();
  }, [profileData.avatar_url, isUploading]);

  // Handle avatar file upload using Supabase storage
  const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    // Evitar múltiples cargas
    if (isUploading) return;

    const file = e.target.files[0];
    // Create immediate local preview while uploading
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setIsUploading(true);

    // Get current user ID from session
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) return;
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExt}`;

    // Asegurarnos de no usar subcarpetas - archivo directo en el bucket
    const filePath = fileName;

    try {
      // Upload file to bucket and store its path
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, {
        upsert: true // Sobreescribir si existe
      });


      if (uploadError) {
        throw new Error(`Error de Supabase: ${uploadError.message}`);
      }

      // Después de subir, obtener URL pública y guardarla
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath, {
        download: false
      });

      if (!data || !data.publicUrl) {
        throw new Error('No se pudo generar URL pública');
      }

      // Guardar solo el nombre del archivo como avatar_url para mantener consistencia
      onChange({ target: { name: 'avatar_url', value: filePath } } as ChangeEvent<HTMLInputElement>);
      setPreviewUrl(data.publicUrl);
      setDebugInfo(`Subida exitosa, archivo: ${filePath}`);
    } catch (err: any) {
      // En caso de error, volver a la imagen original
      setPreviewUrl(profileData.avatar_url);
      setDebugInfo(`Error: ${err?.message || 'desconocido'}`);
    } finally {
      setIsUploading(false);
      // Limpiar el input para permitir seleccionar el mismo archivo de nuevo
      e.target.value = '';
    }
  };

  // Show debug info
  useEffect(() => console.log('[AvatarPreview]', previewUrl, debugInfo), [previewUrl, debugInfo]);

  return (
    <div className="animate-in fade-in duration-500">
      <form onSubmit={onSave} className="space-y-8">
        <div className="card p-6 sm:p-10 shadow-xl shadow-slate-200/50 dark:shadow-none">
          <div className="flex flex-col md:flex-row gap-10 items-start">
            {/* Avatar section */}
            <div className="flex flex-col items-center space-y-4 w-full md:w-auto">
              <div className="relative group">
                <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl transition-transform duration-300 group-hover:scale-105">
                  <img
                    src={previewUrl || FALLBACK_AVATAR}
                    alt="Avatar Preview"
                    className="h-full w-full object-cover"
                  />
                  {isUploading && (
                    <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center backdrop-blur-sm">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-400"></div>
                    </div>
                  )}
                </div>
                <label 
                  htmlFor="avatar" 
                  className="absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-full shadow-lg cursor-pointer hover:bg-primary-500 transition-colors border-2 border-white dark:border-slate-800"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </label>
                <input
                  type="file"
                  name="avatar"
                  id="avatar"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {isUploading ? 'Subiendo...' : 'Cambiar foto'}
              </p>
            </div>

            {/* Form fields */}
            <div className="flex-1 grid grid-cols-1 gap-8 sm:grid-cols-2 w-full">
              <div className="sm:col-span-2">
                <label htmlFor="full_name" className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2">
                  Nombre completo
                </label>
                <input
                  type="text"
                  name="full_name"
                  id="full_name"
                  value={profileData.full_name}
                  onChange={onChange}
                  placeholder="Tu nombre real"
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={profileData.email}
                  disabled
                  className="w-full bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed opacity-70"
                />
                <p className="mt-2 text-xs text-slate-400 font-medium italic">El correo no se puede modificar</p>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  value={profileData.phone}
                  onChange={onChange}
                  placeholder="+34 000 000 000"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full sm:w-auto px-10 py-4 shadow-xl shadow-primary-500/20"
          >
            {saving ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando cambios...
              </span>
            ) : (
              <span className="flex items-center">
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Guardar perfil
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserProfileSection;
