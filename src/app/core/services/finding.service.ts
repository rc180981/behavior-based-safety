import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { Finding } from '../models/bbs.models';

@Injectable({
  providedIn: 'root'
})
export class FindingService {
  private auth = inject(AuthService);

  readonly findings = signal<Finding[]>([]);
  readonly isLoading = signal<boolean>(false);

  /**
   * Mengambil daftar temuan untuk proyek aktif
   */
  async loadFindings(projectId: string, filter?: { status?: string; picUid?: string }): Promise<Finding[]> {
    this.isLoading.set(true);
    try {
      const token = await this.auth.getIdToken();
      let url = `/api/findings?projectId=${projectId}`;
      if (filter?.status) url += `&status=${filter.status}`;
      if (filter?.picUid) url += `&picUid=${filter.picUid}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Gagal memuat temuan');
      }

      const data = await res.json();
      const list = (data.findings || []).map((f: Finding) => this.enhanceFinding(f));
      this.findings.set(list);
      return list;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Mengambil detail satu temuan berdasarkan id
   */
  async getFindingById(id: string): Promise<Finding> {
    const token = await this.auth.getIdToken();
    const res = await fetch(`/api/findings?id=${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error('Temuan tidak ditemukan');
    }

    const data = await res.json();
    return this.enhanceFinding(data.finding);
  }

  /**
   * PIC mengirimkan tindak lanjut perbaikan beserta foto sesudah
   */
  async submitFollowUp(findingId: string, photosAfter: string[], note: string): Promise<void> {
    const token = await this.auth.getIdToken();
    const res = await fetch('/api/findings/follow-up', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ findingId, photosAfter, note }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal mengirim tindak lanjut');
    }
  }

  /**
   * Supervisor atau Admin memverifikasi temuan (Tutup / Tolak ke PIC)
   */
  async verifyFinding(findingId: string, action: 'approve' | 'reject', note?: string): Promise<void> {
    const token = await this.auth.getIdToken();
    const res = await fetch('/api/findings/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ findingId, action, note }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal memverifikasi temuan');
    }
  }

  /**
   * Export temuan ke format CSV / Excel
   */
  exportToCsv(findings: Finding[]): void {
    const headers = ['ID', 'Kategori', 'Tingkat Risiko', 'Status', 'PIC', 'Target Selesai', 'Overdue', 'Catatan'];
    const rows = findings.map((f) => [
      `"${f.id}"`,
      `"${f.category}"`,
      `"${f.risk}"`,
      `"${f.status}"`,
      `"${f.picUid}"`,
      `"${f.dueDate}"`,
      f.isOverdue ? '"YA"' : '"TIDAK"',
      `"${(f.note || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `rekap_temuan_bbs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private enhanceFinding(f: Finding): Finding {
    const today = new Date().toISOString().split('T')[0]!;
    const isOverdue = f.status !== 'closed' && !!f.dueDate && f.dueDate < today;

    let remainingDays = 0;
    if (f.dueDate) {
      const targetTime = new Date(f.dueDate).getTime();
      const nowTime = new Date(today).getTime();
      remainingDays = Math.round((targetTime - nowTime) / (1000 * 60 * 60 * 24));
    }

    return {
      ...f,
      isOverdue,
      remainingDays,
    };
  }
}
