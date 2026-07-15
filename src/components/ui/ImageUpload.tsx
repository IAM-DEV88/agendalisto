import { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { uploadImage, deleteImage } from '../../lib/storage';
import { toast } from 'react-hot-toast';

interface ImageUploadProps {
  folder: 'avatars' | 'business-logos' | 'service-images' | 'blog-images';
  userId: string;
  currentUrl?: string | null;
  onUpload: (url: string) => void;
  onDelete?: () => void;
  accept?: string;
  maxSizeMB?: number;
  aspectRatio?: string;
}

export default function ImageUpload({
  folder,
  userId,
  currentUrl,
  onUpload,
  onDelete,
  accept = 'image/*',
  maxSizeMB = 5,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`La imagen no debe superar ${maxSizeMB}MB`);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);

    const { url, error } = await uploadImage(file, folder, userId);

    if (error) {
      toast.error(error);
      setPreview(null);
      setUploading(false);
      return;
    }

    if (url) {
      if (currentUrl && currentUrl.includes('agendaya-public')) {
        await deleteImage(currentUrl);
      }
      onUpload(url);
      toast.success('Imagen subida correctamente');
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  }, [folder, userId, currentUrl, onUpload, maxSizeMB]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleRemove = async () => {
    if (currentUrl) {
      await deleteImage(currentUrl);
    }
    setPreview(null);
    onDelete?.();
  };

  const displayUrl = preview || currentUrl;

  return (
    <div className="space-y-2">
      {displayUrl ? (
        <div className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
          <img
            src={displayUrl}
            alt="Preview"
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="p-2 bg-white/90 rounded-lg hover:bg-white transition-all opacity-0 group-hover:opacity-100"
              aria-label="Cambiar imagen"
            >
              <Upload className="w-4 h-4 text-slate-700" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-2 bg-red-500/90 rounded-lg hover:bg-red-500 transition-all opacity-0 group-hover:opacity-100"
              aria-label="Eliminar imagen"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`w-full h-48 rounded-lg border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
            dragOver
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-slate-300 dark:border-slate-600 hover:border-primary-400 bg-slate-50 dark:bg-slate-800/50'
          }`}
          aria-label="Subir imagen"
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          ) : (
            <>
              <Upload className="w-8 h-8 text-slate-400" />
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Arrastra o haz clic para subir
              </span>
              <span className="text-[10px] text-slate-400">Máx {maxSizeMB}MB</span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
