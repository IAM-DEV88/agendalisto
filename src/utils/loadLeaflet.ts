/**
 * Dynamically loads Leaflet library and CSS only when needed.
 * This prevents leaflet (~150KB) from being bundled in the initial JS/CSS.
 */
export async function loadLeaflet(): Promise<typeof import('leaflet')> {
  // Dynamically import leaflet CSS
  await import('leaflet/dist/leaflet.css');
  // Dynamically import leaflet library
  const L = await import('leaflet');
  return L.default || L;
}
