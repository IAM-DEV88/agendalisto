const COORDS_RE = /^([-+]?\d+\.?\d*)\s*[,;]\s*([-+]?\d+\.?\d*)[.,\s]/;

export function parseCoordinatesFromAddress(
  address: string
): { lat: number | null; lng: number | null } {
  const m = address.trim().match(COORDS_RE);
  if (!m) return { lat: null, lng: null };

  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[2]);

  if (isNaN(lat) || isNaN(lng)) return { lat: null, lng: null };
  if (lat < -90 || lat > 90) return { lat: null, lng: null };
  if (lng < -180 || lng > 180) return { lat: null, lng: null };

  return { lat, lng };
}
