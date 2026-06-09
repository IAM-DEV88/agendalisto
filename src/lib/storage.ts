import { supabase } from './supabase';

const BUCKET = 'agendaya-public';

export async function uploadImage(
  file: File,
  folder: 'avatars' | 'business-logos' | 'service-images' | 'blog-images',
  userId: string
): Promise<{ url: string | null; error: string | null }> {
  try {
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${folder}/${userId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: publicUrl } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(fileName);

    return { url: publicUrl.publicUrl, error: null };
  } catch (err: any) {
    return { url: null, error: err.message || 'Error al subir la imagen' };
  }
}

export async function deleteImage(url: string): Promise<{ error: string | null }> {
  try {
    const path = url.split(`${BUCKET}/`)[1];
    if (!path) return { error: null };

    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([path]);

    if (error) throw error;
    return { error: null };
  } catch (err: any) {
    return { error: err.message || 'Error al eliminar la imagen' };
  }
}

export function getImageUrl(path: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
