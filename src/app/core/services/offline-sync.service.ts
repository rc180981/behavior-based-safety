import { Injectable, signal, inject } from '@angular/core';
import { ObservationSubmitPayload } from './observation.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class OfflineSyncService {
  private auth = inject(AuthService);

  readonly isOnline = signal<boolean>(navigator.onLine);
  readonly pendingCount = signal<number>(0);
  readonly isSyncing = signal<boolean>(false);

  private readonly QUEUE_KEY = 'bbs_offline_observations_queue';

  constructor() {
    this.updatePendingCount();
    window.addEventListener('online', () => {
      this.isOnline.set(true);
      this.autoSync();
    });
    window.addEventListener('offline', () => {
      this.isOnline.set(false);
    });
  }

  getPendingQueue(): ObservationSubmitPayload[] {
    const raw = localStorage.getItem(this.QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  enqueueObservation(payload: ObservationSubmitPayload): void {
    const queue = this.getPendingQueue();
    queue.push(payload);
    localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
    this.updatePendingCount();
  }

  updatePendingCount(): void {
    this.pendingCount.set(this.getPendingQueue().length);
  }

  async autoSync(): Promise<{ synced: number; failed: number }> {
    const queue = this.getPendingQueue();
    if (queue.length === 0 || this.isSyncing()) {
      return { synced: 0, failed: 0 };
    }

    this.isSyncing.set(true);
    let synced = 0;
    let failed = 0;
    const remaining: ObservationSubmitPayload[] = [];

    const token = await this.auth.getIdToken();
    if (!token) {
      this.isSyncing.set(false);
      return { synced: 0, failed: queue.length };
    }

    for (const item of queue) {
      try {
        const res = await fetch('/api/observations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(item),
        });

        if (res.ok) {
          synced++;
        } else {
          failed++;
          remaining.push(item);
        }
      } catch {
        failed++;
        remaining.push(item);
      }
    }

    localStorage.setItem(this.QUEUE_KEY, JSON.stringify(remaining));
    this.updatePendingCount();
    this.isSyncing.set(false);

    if (synced > 0) {
      alert(`✅ ${synced} observasi offline berhasil disinkronkan ke server.`);
    }

    return { synced, failed };
  }
}
