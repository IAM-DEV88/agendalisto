/**
 * Sanitización de inputs de usuario para prevenir XSS
 */

/**
 * Elimina etiquetas HTML/XML del texto para prevenir XSS
 */
export function stripHtmlTags(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Valida que una URL no use protocolos peligrosos (javascript:, data:, vbscript:)
 * Devuelve la URL si es segura, o un string vacío si no
 */
export function sanitizeUrl(url: string): string {
  const dangerousProtocols = /^(javascript|data|vbscript|file):/i;
  if (dangerousProtocols.test(url.trim())) {
    return '';
  }
  return url;
}

/**
 * Sanitiza un texto de entrada: recorta, elimina HTML y limita longitud
 */
export function sanitizeTextInput(input: string, maxLength: number = 5000): string {
  return stripHtmlTags(input.trim()).slice(0, maxLength);
}
