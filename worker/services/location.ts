export interface Coordinates {
  lat: number;
  lon: number;
}

export const INDIAN_CITIES_COORDS: Record<string, Coordinates> = {
  'mumbai': { lat: 19.0760, lon: 72.8777 },
  'delhi ncr': { lat: 28.7041, lon: 77.1025 },
  'bangalore': { lat: 12.9716, lon: 77.5946 },
  'pune': { lat: 18.5204, lon: 73.8567 },
  'goa': { lat: 15.2993, lon: 74.1240 },
  'ahmedabad': { lat: 23.0225, lon: 72.5714 },
  'surat': { lat: 21.1702, lon: 72.8311 },
  'vadodara': { lat: 22.3072, lon: 73.1812 },
  'rajkot': { lat: 22.3039, lon: 70.8022 },
  'hyderabad': { lat: 17.3850, lon: 78.4867 },
  'chennai': { lat: 13.0827, lon: 80.2707 },
  'kolkata': { lat: 22.5726, lon: 88.3639 },
  'jaipur': { lat: 26.9124, lon: 75.7873 },
  'lucknow': { lat: 26.8467, lon: 80.9462 },
  'chandigarh': { lat: 30.7333, lon: 76.7794 },
  'indore': { lat: 22.7196, lon: 75.8577 }
};

export function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const rLat1 = lat1 * Math.PI / 180;
  const rLat2 = lat2 * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(rLat1) * Math.cos(rLat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export function scoreDistance(distance: number): number {
  if (distance <= 10) return 100;
  if (distance <= 25) return 90;
  if (distance <= 50) return 80;
  if (distance <= 100) return 60;
  if (distance <= 300) return 40;
  return 10;
}

export function getCoordinatesForCity(city: string | null | undefined): Coordinates | null {
  if (!city) return null;
  const key = city.trim().toLowerCase();
  return INDIAN_CITIES_COORDS[key] || null;
}

/**
 * Resolves active coordinates for a profile, falling back to city databases.
 */
export function getProfileCoords(profile: {
  city?: string;
  profile_latitude?: number | null;
  profile_longitude?: number | null;
  profileLatitude?: number | null;
  profileLongitude?: number | null;
}): Coordinates | null {
  // Try direct coordinates
  const lat = profile.profile_latitude ?? profile.profileLatitude;
  const lon = profile.profile_longitude ?? profile.profileLongitude;
  
  if (lat !== undefined && lat !== null && lon !== undefined && lon !== null) {
    return { lat: Number(lat), lon: Number(lon) };
  }

  // Fallback to city databases
  return getCoordinatesForCity(profile.city);
}

/**
 * Calculates V2 location score and provides natural explanation text.
 */
export function calculateLocationScore(
  profileA: { city?: string; profile_latitude?: number | null; profile_longitude?: number | null },
  profileB: { city?: string; profile_latitude?: number | null; profile_longitude?: number | null }
): { score: number; distanceKm: number | null; explanation: string } {
  const coordA = getProfileCoords(profileA);
  const coordB = getProfileCoords(profileB);

  if (coordA && coordB) {
    const dist = getHaversineDistance(coordA.lat, coordA.lon, coordB.lat, coordB.lon);
    const score = scoreDistance(dist);
    let explanation = 'In proximity';
    if (dist <= 10) explanation = 'Extremely close (within 10 km)';
    else if (dist <= 25) explanation = 'Nearby (within 25 km)';
    else if (dist <= 50) explanation = 'Within 50 km';
    else if (dist <= 100) explanation = 'Same region (within 100 km)';
    else if (dist <= 300) explanation = 'Moderate distance';
    else explanation = 'Long-distance match';

    return { score, distanceKm: dist, explanation };
  }

  // City-only fallback if coords are completely unavailable
  const cityA = (profileA.city || '').trim().toLowerCase();
  const cityB = (profileB.city || '').trim().toLowerCase();

  if (cityA && cityB && cityA === cityB) {
    return { score: 100, distanceKm: null, explanation: `Both in ${profileA.city}` };
  }

  return { score: 10, distanceKm: null, explanation: 'Different cities' };
}
