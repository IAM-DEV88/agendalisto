import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface BusinessHeaderPreviewProps {
  logoUrl: string | null;
}

const BusinessHeaderPreview: React.FC<BusinessHeaderPreviewProps> = ({ logoUrl }) => {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'success' | 'error'>('loading');
  
  // Tiempo para detectar timeouts de imagen
  const IMAGE_LOAD_TIMEOUT = 5000; // 5 segundos
  
  // Imagen fallback para cuando hay error
  const FALLBACK_LOGO = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';
  
  // Referencia para limpiar el timeout
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Lista de URLs conocidas como inválidas
  const invalidUrlsRef = React.useRef<Set<string>>(new Set());
  
  // Función para limpiar URLs duplicadas
  const cleanLogoUrl = (url: string | null): string | null => {
    if (!url) return null;
    
    // Detectar y corregir rutas duplicadas de "business-logos"
    if (url.includes('/business-logos/business-logos/')) {
      console.log('BusinessHeaderPreview - Corrigiendo URL duplicada:', url);
      return url.replace('/business-logos/business-logos/', '/business-logos/');
    }
    
    // Identificar URLs que han generado errores 400 previamente
    if (url && url.endsWith('_1746130038843.png')) {
      console.log('BusinessHeaderPreview - Detectada URL problemática conocida:', url);
      return null; // Retornar null para forzar el uso de imagen fallback
    }
    
    return url;
  };
  
  useEffect(() => {
    // Limpiar timeout anterior si existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (!logoUrl) {
      console.log('BusinessHeaderPreview - No hay URL de logo');
      setImgSrc(FALLBACK_LOGO);
      setLoadState('error');
      setErrorInfo('No logo URL provided');
      return;
    }
    
    // Verificar si la URL ya está en la lista de URLs inválidas
    if (invalidUrlsRef.current.has(logoUrl)) {
      console.log('BusinessHeaderPreview - URL previamente inválida:', logoUrl);
      setImgSrc(FALLBACK_LOGO);
      setLoadState('error');
      setErrorInfo('Previously failed URL');
      return;
    }
    
    // Verificar si la URL necesita ser limpiada (duplicación de rutas)
    let urlToUse = logoUrl;
    const cleanedLogoUrl = cleanLogoUrl(urlToUse);
    
    // Si la URL fue identificada como problemática, usar fallback
    if (cleanedLogoUrl === null) {
      console.log('BusinessHeaderPreview - URL problemática conocida, usando fallback');
      setImgSrc(FALLBACK_LOGO);
      setLoadState('error');
      setErrorInfo('Known problematic URL');
      invalidUrlsRef.current.add(logoUrl);
      return;
    }
    
    if (cleanedLogoUrl !== urlToUse && cleanedLogoUrl) {
      console.log('BusinessHeaderPreview - URL limpiada de:', urlToUse, 'a:', cleanedLogoUrl);
      urlToUse = cleanedLogoUrl;
    }
    
    const getImageSrc = async () => {
      try {
        setLoadState('loading');
        console.log('BusinessHeaderPreview - Logo URL recibida:', urlToUse);

        // Si ya es una URL completa, usarla directamente
        const isCompleteUrl = urlToUse.startsWith('http');
        if (isCompleteUrl) {
          console.log('BusinessHeaderPreview - Usando URL directa:', urlToUse);
          
          // Verificar si es accesible
          try {
            const response = await fetch(urlToUse as string, { method: 'HEAD' });
            if (!response.ok) {
              console.warn(`URL directa no accesible (${response.status}):`, urlToUse);
              invalidUrlsRef.current.add(logoUrl);
              // Continuar de todos modos, a veces HEAD falla pero GET funciona
            }
          } catch (fetchError) {
            console.warn('Error al verificar URL directa:', urlToUse, fetchError);
            // No marcar como inválida aún, podría ser CORS
          }
          
          // Configurar un timeout para detectar imágenes que nunca cargan
          setImgSrc(urlToUse);
          setLoadState('loading');
          
          // Si después de un tiempo la imagen no ha cargado, intentar con otra técnica
          timeoutRef.current = setTimeout(() => {
            if (loadState === 'loading') {
              console.warn('Timeout cargando imagen:', urlToUse);
              setErrorInfo('Timeout loading image');
              
              // Como fallback, intentar con una etiqueta img directamente
              const testImg = new Image();
              testImg.onload = () => {
                console.log('Imagen cargada via Image constructor:', urlToUse);
                setLoadState('success');
              };
              testImg.onerror = () => {
                console.error('Imagen falló también con Image constructor:', urlToUse);
                setImgSrc(FALLBACK_LOGO);
                setLoadState('error');
                invalidUrlsRef.current.add(logoUrl);
              };
              testImg.src = urlToUse as string;
            }
          }, IMAGE_LOAD_TIMEOUT);
          
          return;
        }
        
        // Intentar convertir clave a URL pública
        console.log('BusinessHeaderPreview - Convirtiendo clave a URL:', urlToUse);
        
        // Asegurarse de que la clave no contenga rutas duplicadas
        const cleanKey = typeof urlToUse === 'string' 
          ? urlToUse.replace('business-logos/business-logos/', 'business-logos/')
          : '';
        
        try {
          // Intentar primero en el bucket business-logos
          const { data: businessLogoData } = supabase.storage
            .from('business-logos')
            .getPublicUrl(cleanKey);
          
          console.log('BusinessHeaderPreview - URL business-logos:', businessLogoData?.publicUrl);
          
          if (businessLogoData?.publicUrl) {
            setImgSrc(businessLogoData.publicUrl);
            setLoadState('success');
            return;
          }
          
          // Si no funciona, intentar en bucket avatars
          const { data: avatarsData } = supabase.storage
            .from('avatars')
            .getPublicUrl(cleanKey);
          
          console.log('BusinessHeaderPreview - URL avatars:', avatarsData?.publicUrl);
          
          if (avatarsData?.publicUrl) {
            setImgSrc(avatarsData.publicUrl);
            setLoadState('success');
            return;
          }
          
          throw new Error('No se pudo obtener URL pública');
        } catch (error: any) {
          console.error('BusinessHeaderPreview - Error generando URL:', error);
          setImgSrc(FALLBACK_LOGO);
          setLoadState('error');
          setErrorInfo(`Error converting key: ${error.message}`);
          invalidUrlsRef.current.add(logoUrl);
        }
      } catch (error: any) {
        console.error('BusinessHeaderPreview - Error global:', error);
        setImgSrc(FALLBACK_LOGO);
        setLoadState('error');
        setErrorInfo(`General error: ${error.message}`);
        invalidUrlsRef.current.add(logoUrl);
      }
    };
    
    getImageSrc();
    
    // Limpiar timeout al desmontar
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [logoUrl]);
  
  if (!imgSrc) {
    return (
      <div className="p-4 border rounded bg-gray-100">
        <p className="text-gray-500">No se encontró logo. {errorInfo}</p>
      </div>
    );
  }
  
  return (
    <div className="p-4 border rounded relative">
      <div className="mb-2 text-sm">
        <strong>Estado:</strong> {loadState === 'loading' ? 'Cargando...' : 
                               loadState === 'success' ? 'Cargada' : 'Error'} 
        {errorInfo && <span className="text-red-500"> - {errorInfo}</span>}
      </div>
      <div className="flex gap-4 items-center">
        <div className="relative w-24 h-24">
          {loadState === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
              <span className="text-xs text-gray-500">Cargando...</span>
            </div>
          )}
          <img 
            src={imgSrc}
            alt="Vista previa de logo" 
            className={`w-24 h-24 object-cover rounded ${loadState === 'loading' ? 'opacity-50' : ''}`}
            onLoad={() => {
              console.log('Imagen cargada correctamente en preview:', imgSrc);
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
              }
              setLoadState('success');
              setErrorInfo(null);
            }}
            onError={(e) => {
              console.error('Error cargando imagen en preview:', imgSrc);
              e.currentTarget.src = FALLBACK_LOGO;
              if (logoUrl) {
                invalidUrlsRef.current.add(logoUrl);
              }
              setErrorInfo('Fallo al cargar imagen');
            }}
          />
        </div>
        <div>
          <p className="text-xs"><strong>URL Original:</strong> {logoUrl || 'No disponible'}</p>
          <p className="text-xs"><strong>URL Mostrada:</strong> {imgSrc === FALLBACK_LOGO ? 'Imagen de respaldo' : imgSrc}</p>
        </div>
      </div>
    </div>
  );
};

export default BusinessHeaderPreview; 