import { Injectable, signal, computed } from '@angular/core';
import { ProjectGeofence } from '../models/bbs.models';

export interface CurrentPosition {
  lat: number;
  lng: number;
  accuracyM: number;
}

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  readonly currentPosition = signal<CurrentPosition | null>(null);
  readonly isLocating = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly distanceM = signal<number | null>(null);

  /**
   * Evaluasi apakah lokasi saat ini berada di dalam batas geofence proyek
   */
  isWithinGeofence(geofence: ProjectGeofence | undefined): {
    valid: boolean;
    distanceM: number;
    accuracyM: number;
    reason?: string;
  } {
    const pos = this.currentPosition();
    if (!pos) {
      return { valid: false, distanceM: 0, accuracyM: 0, reason: 'Lokasi belum diperoleh. Mohon izinkan akses GPS.' };
    }

    if (!geofence || geofence.required === false) {
      return { valid: true, distanceM: 0, accuracyM: pos.accuracyM };
    }

    const dist = this.calculateHaversine(pos.lat, pos.lng, geofence.lat, geofence.lng);
    this.distanceM.set(dist);

    if (pos.accuracyM > geofence.maxAccuracyM) {
      return {
        valid: false,
        distanceM: dist,
        accuracyM: pos.accuracyM,
        reason: `Akurasi GPS kurang baik (${Math.round(pos.accuracyM)} m). Maksimal toleransi ${geofence.maxAccuracyM} m. Pastikan berada di area terbuka.`,
      };
    }

    if (dist > geofence.radiusM) {
      return {
        valid: false,
        distanceM: dist,
        accuracyM: pos.accuracyM,
        reason: `Lokasi di luar area (${dist} m dari titik pusat). Batas radius ${geofence.radiusM} m.`,
      };
    }

    return {
      valid: true,
      distanceM: dist,
      accuracyM: pos.accuracyM,
    };
  }

  /**
   * Request koordinat GPS dari browser perangkat
   */
  async getCurrentLocation(): Promise<CurrentPosition> {
    this.isLocating.set(true);
    this.errorMessage.set(null);

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const err = 'Perangkat tidak mendukung Geolocation GPS.';
        this.errorMessage.set(err);
        this.isLocating.set(false);
        return reject(new Error(err));
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos: CurrentPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracyM: position.coords.accuracy,
          };
          this.currentPosition.set(pos);
          this.isLocating.set(false);
          resolve(pos);
        },
        (error) => {
          let msg = 'Gagal mendeteksi lokasi GPS.';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              msg = 'Izin lokasi GPS ditolak. Silakan aktifkan izin lokasi di browser Anda.';
              break;
            case error.POSITION_UNAVAILABLE:
              msg = 'Sinyal GPS tidak tersedia.';
              break;
            case error.TIMEOUT:
              msg = 'Waktu pencarian sinyal GPS habis. Coba lagi.';
              break;
          }
          this.errorMessage.set(msg);
          this.isLocating.set(false);
          reject(new Error(msg));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    });
  }

  calculateHaversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }
}
