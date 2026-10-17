/**
 * Menghitung jarak antara dua koordinat geografis menggunakan rumus Haversine (dalam satuan meter).
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radius bumi dalam meter
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export interface GeofenceValidationResult {
  valid: boolean;
  distanceM: number;
  reason?: string;
}

export function validateGeofence(
  userLat: number,
  userLng: number,
  accuracyM: number,
  projectLat: number,
  projectLng: number,
  radiusM: number,
  maxAccuracyM: number
): GeofenceValidationResult {
  const distanceM = calculateHaversineDistance(userLat, userLng, projectLat, projectLng);

  if (accuracyM > maxAccuracyM) {
    return {
      valid: false,
      distanceM,
      reason: `Akurasi GPS tidak mencukupi (${Math.round(accuracyM)} m, batas maksimal ${maxAccuracyM} m).`,
    };
  }

  if (distanceM > radiusM) {
    return {
      valid: false,
      distanceM,
      reason: `Lokasi Anda berada di luar area proyek (${distanceM} m dari titik pusat, batas radius ${radiusM} m).`,
    };
  }

  return {
    valid: true,
    distanceM,
  };
}
