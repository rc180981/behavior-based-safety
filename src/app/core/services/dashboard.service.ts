import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { Finding } from '../models/bbs.models';

export interface DashboardKPI {
  totalObservations: number;
  percentPositive: number;
  openFindings: number;
  waitingVerification: number;
  closedFindings: number;
  overdueFindings: number;
}

export interface BehaviorBreakdown {
  itemId: string;
  title: string;
  total: number;
  positive: number;
  percent: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private auth = inject(AuthService);

  readonly kpi = signal<DashboardKPI>({
    totalObservations: 0,
    percentPositive: 100,
    openFindings: 0,
    waitingVerification: 0,
    closedFindings: 0,
    overdueFindings: 0,
  });

  readonly behaviorBreakdown = signal<BehaviorBreakdown[]>([]);
  readonly recentFindings = signal<Finding[]>([]);
  readonly isLoading = signal<boolean>(false);

  async loadStats(projectId: string): Promise<void> {
    this.isLoading.set(true);
    try {
      const token = await this.auth.getIdToken();
      const res = await fetch(`/api/dashboard/stats?projectId=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Gagal memuat statistik dashboard');
      }

      const data = await res.json();
      if (data.kpi) this.kpi.set(data.kpi);
      if (data.behaviorBreakdown) this.behaviorBreakdown.set(data.behaviorBreakdown);
      if (data.recentFindings) this.recentFindings.set(data.recentFindings);
    } catch (err) {
      console.warn('Dashboard stats error:', err);
    } finally {
      this.isLoading.set(false);
    }
  }
}
