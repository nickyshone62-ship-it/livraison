export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Extracts latitude and longitude from Google Maps, Apple Maps, Waze, OpenStreetMap URLs or lat,lng text.
 */
export function extractCoordinatesFromMapUrl(urlOrText: string): LocationCoordinates | null {
  if (!urlOrText || typeof urlOrText !== 'string') return null;

  const cleanText = urlOrText.trim();

  // Pattern 1: Google Maps @lat,lng e.g. https://www.google.com/maps/@12.3714,-1.5197,15z
  const atMatch = cleanText.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (isValidLatLong(lat, lng)) return { latitude: lat, longitude: lng };
  }

  // Pattern 2: URL params query q=lat,lng or ll=lat,lng or daddr=lat,lng or saddr=lat,lng
  const paramMatch = cleanText.match(/(?:q|ll|daddr|saddr|center|location|loc:)=(-?\d+\.\d+)(?:,|\+|\s+)(-?\d+\.\d+)/i);
  if (paramMatch) {
    const lat = parseFloat(paramMatch[1]);
    const lng = parseFloat(paramMatch[2]);
    if (isValidLatLong(lat, lng)) return { latitude: lat, longitude: lng };
  }

  // Pattern 3: geo:lat,lng
  const geoMatch = cleanText.match(/geo:(-?\d+\.\d+),(-?\d+\.\d+)/i);
  if (geoMatch) {
    const lat = parseFloat(geoMatch[1]);
    const lng = parseFloat(geoMatch[2]);
    if (isValidLatLong(lat, lng)) return { latitude: lat, longitude: lng };
  }

  // Pattern 4: Direct lat,lng string e.g. "12.3714, -1.5197" or "12.3714 -1.5197"
  const directMatch = cleanText.match(/^(-?\d+\.\d+)[\s,]+(-?\d+\.\d+)$/);
  if (directMatch) {
    const lat = parseFloat(directMatch[1]);
    const lng = parseFloat(directMatch[2]);
    if (isValidLatLong(lat, lng)) return { latitude: lat, longitude: lng };
  }

  return null;
}

function isValidLatLong(lat: number, lng: number): boolean {
  return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Builds a universal map navigation URL for mobile & desktop devices.
 */
export function buildNavigationUrl(
  latitude?: number | null,
  longitude?: number | null,
  addressOrUrl?: string | null
): string {
  if (latitude !== undefined && latitude !== null && longitude !== undefined && longitude !== null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  }

  if (addressOrUrl && addressOrUrl.trim().length > 0) {
    const text = addressOrUrl.trim();
    if (text.startsWith('http://') || text.startsWith('https://')) {
      return text;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(text)}`;
  }

  return 'https://maps.google.com';
}
