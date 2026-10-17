import { Injectable, inject, signal } from '@angular/core';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { AuthService } from './auth.service';
import { FirebaseService } from './firebase.service';
import { Observation } from '../models/bbs.models';

export interface ObservationSubmitPayload {
  projectId: string;
  areaId: string;
  loc: {
    lat: number;
    lng: number;
    accuracyM: number;
  };
  answers: Array<{
    projectItemId: string;
    itemId: string;
    category: 'wajib' | 'medium';
    standardVersion: number;
    result: 'positif' | 'improvement';
    finding?: {
      risk: 'rendah' | 'sedang' | 'tinggi';
      note: string;
      photosBefore: string[];
      picUid: string;
      dueDate: string;
    };
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class ObservationService {
  private auth = inject(AuthService);
  private fb = inject(FirebaseService);

  readonly history = signal<Observation[]>([]);
  readonly isLoading = signal<boolean>(false);

  /**
   * Mengirim observasi ke Vercel Serverless Function (/api/observations)
   */
  async submitObservation(payload: ObservationSubmitPayload): Promise<{
    success: boolean;
    observationId: string;
    findingIds: string[];
  }> {
    this.isLoading.set(true);
    try {
      const token = await this.auth.getIdToken();
      if (!token) {
        throw new Error('Anda belum login atau sesi telah berakhir.');
      }

      const res = await fetch('/api/observations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengirim observasi');
      }

      // Increment local count of completed observations for standard card auto-open logic
      const currentCount = parseInt(localStorage.getItem('bbs_observation_count') || '0', 10);
      localStorage.setItem('bbs_observation_count', (currentCount + 1).toString());

      return data;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Mengambil riwayat observasi milik user yang login untuk proyek aktif
   */
  async loadUserHistory(projectId: string): Promise<Observation[]> {
    this.isLoading.set(true);
    try {
      const user = this.auth.currentUser();
      if (!user) return [];

      const q = query(
        collection(this.fb.db, 'observations'),
        where('projectId', '==', projectId),
        where('observerUid', '==', user.uid),
        orderBy('submittedAt', 'desc'),
        limit(50)
      );

      const snap = await getDocs(q);
      const list = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Observation[];

      this.history.set(list);
      return list;
    } catch (err) {
      console.warn('Could not query observations history (may need index or rules):', err);
      return [];
    } finally {
      this.isLoading.set(false);
    }
  }
}
