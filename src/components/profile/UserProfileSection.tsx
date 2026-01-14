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
    <>
      <div className="mt-2">
        <form onSubmit={onSave} className="space-y-2">
          <div className="dark:bg-opacity-10 bg-gray-50 shadow overflow-hidden rounded-md">
            <div className="px-4 py-5 sm:p-6">
              {/* Avatar preview */}
              <div className="flex justify-center mb-4">
                <img
                  src={previewUrl || FALLBACK_AVATAR}
                  alt="Avatar Preview"
                  className="h-24 w-24 rounded-full object-cover"
                />
              </div>

              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nombre completo
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="full_name"
                      id="full_name"
                      value={profileData.full_name}
                      onChange={onChange}
                      className="shadow-sm dark:bg-opacity-10 p-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300"
                    />
                  </div>
                </div>
                <div className="sm:col-span-3">
                  <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Avatar de perfil
                  </label>
                  <div className="mt-1">
                    <input
                      type="file"
                      name="avatar"
                      id="avatar"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={isUploading}
                      className="block w-full text-sm"
                    />
                  </div>
                </div>
                <div className="sm:col-span-3">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Correo electrónico
                  </label>
                  <div className="mt-1">
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={profileData.email}
                      disabled
                      className="shadow-sm dark:bg-opacity-10 p-2 bg-gray-50 block w-full sm:text-sm border-gray-300"
                    />
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-400">El correo no se puede modificar</p>
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-100">
                    Teléfono
                  </label>
                  <div className="mt-1">
                    <input
                      type="tel"
                      name="phone"
                      id="phone"
                      value={profileData.phone}
                      onChange={onChange}
                      className="shadow-sm dark:bg-opacity-10 p-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300"
                    />
                  </div>
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
    </>
  );
};

export default UserProfileSection;
