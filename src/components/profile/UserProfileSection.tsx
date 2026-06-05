import React, { type FormEvent, type ChangeEvent, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Camera, Check } from 'lucide-react';
import PhoneInput from '../../components/ui/PhoneInput';

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

const FALLBACK_AVATAR = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';

const UserProfileSection: React.FC<UserProfileSectionProps> = ({
  profileData,
  saving,
  message,
  onSave,
  onChange,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const getSignedUrl = async (path: string): Promise<string | null> => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const { data, error } = await supabase.storage
      .from('avatars')
      .createSignedUrl(path, 60 * 60);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  };

  useEffect(() => {
    if (!profileData.avatar_url || isUploading) return;
    getSignedUrl(profileData.avatar_url).then(url => setPreviewUrl(url));
  }, [profileData.avatar_url, isUploading]);

  const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || isUploading) return;

    const file = e.target.files[0];
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setIsUploading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) {
      setIsUploading(false);
      return;
    }

    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}_${Date.now()}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw new Error(uploadError.message);

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath, { download: false });
      if (!data?.publicUrl) throw new Error('No se pudo generar URL pública');

      onChange({ target: { name: 'avatar_url', value: filePath } } as ChangeEvent<HTMLInputElement>);
      setPreviewUrl(data.publicUrl);
    } catch {
      setPreviewUrl(profileData.avatar_url || FALLBACK_AVATAR);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <form onSubmit={onSave} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3 w-full md:w-auto">
              <div className="relative group">
                <div className="h-28 w-28 rounded-full overflow-hidden ring-4 ring-white dark:ring-slate-800 shadow-2xl transition-transform duration-300 group-hover:scale-105">
                  <img
                    src={previewUrl || FALLBACK_AVATAR}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                  {isUploading && (
                    <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center backdrop-blur-sm rounded-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
                    </div>
                  )}
                </div>
                <label
                  htmlFor="avatar"
                  className="absolute bottom-0 right-0 p-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-full shadow-lg cursor-pointer transition-all border-2 border-white dark:border-slate-900 hover:scale-110 active:scale-95"
                >
                  <Camera className="w-4 h-4" />
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
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                {isUploading ? 'Subiendo...' : 'Cambiar foto'}
              </p>
            </div>

            {/* Form */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
              <div className="sm:col-span-2">
                <label htmlFor="full_name" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
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
                <label htmlFor="email" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
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
                <p className="mt-1.5 text-xs text-slate-400 font-medium">El correo no se puede modificar</p>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Teléfono
                </label>
                <PhoneInput
                  id="phone"
                  value={profileData.phone}
                  onChange={(v) => onChange({ target: { name: 'phone', value: v } } as ChangeEvent<HTMLInputElement>)}
                  placeholder="Número de teléfono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Message toast */}
        {message && (
          <div className={`flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold animate-in fade-in slide-in-from-top-2 duration-300 ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
          }`}>
            {message.type === 'success' ? <Check className="w-4 h-4 flex-shrink-0" /> : null}
            {message.text}
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-10 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-500/25 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:-translate-y-0"
          >
            {saving ? (
              <span className="inline-flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Guardando...
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Check className="w-4 h-4" />
                Guardar cambios
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserProfileSection;
