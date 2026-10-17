import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ObservationService } from '../../core/services/observation.service';

@Component({
  selector: 'app-observasi-riwayat',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-6 pb-24">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-bold text-navy-950">Riwayat Observasi Saya</h2>
          <p class="text-xs text-slate-500">Daftar observasi perilaku keselamatan yang telah Anda kirim.</p>
        </div>
        <a 
          routerLink="/observasi/baru"
          class="bg-navy-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-navy-900 shadow-sm"
        >
          + Buat Baru
        </a>
      </div>

      @if (observationService.isLoading()) {
        <div class="py-12 text-center text-slate-400">
          <span class="inline-block animate-spin text-2xl mb-2">⟳</span>
          <p class="text-xs">Memuat riwayat observasi...</p>
        </div>
      } @else if (observationService.history().length === 0) {
        <div class="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
          <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <h3 class="text-sm font-bold text-slate-700 mb-1">Belum Ada Riwayat Observasi</h3>
          <p class="text-xs text-slate-500 mb-4">Mulai lakukan inspeksi Genba keselamatan kerja di area proyek Anda.</p>
          <a routerLink="/observasi/baru" class="inline-flex text-xs font-bold text-navy-800 bg-navy-50 hover:bg-navy-100 px-4 py-2 rounded-xl">
            Mulai Observasi Sekarang
          </a>
        </div>
      } @else {
        <div class="space-y-4">
          @for (obs of observationService.history(); track obs.id) {
            <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-colors">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold text-navy-900">ID: {{ obs.id.substring(0, 8) }}</span>
                <span class="text-[11px] text-slate-400 font-medium">{{ formatDate(obs.submittedAt) }}</span>
              </div>

              <div class="flex items-center gap-2 mb-3">
                <span class="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-md">
                  Area: {{ obs.areaId }}
                </span>
                <span class="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-md">
                  {{ countPositives(obs) }} Positif
                </span>
                @if (countImprovements(obs) > 0) {
                  <span class="bg-amber-50 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-md">
                    {{ countImprovements(obs) }} Temuan
                  </span>
                }
              </div>

              <div class="border-t border-slate-100 pt-3 text-xs text-slate-500 flex items-center justify-between">
                <span>Akurasi GPS: ±{{ obs.loc.accuracyM }} m</span>
                <span class="text-emerald-700 font-bold">Terverifikasi Server</span>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class ObservasiRiwayatComponent implements OnInit {
  auth = inject(AuthService);
  observationService = inject(ObservationService);

  async ngOnInit(): Promise<void> {
    const proj = this.auth.activeProject();
    if (proj) {
      await this.observationService.loadUserHistory(proj.id);
    }
  }

  formatDate(dateVal: string | Date | undefined): string {
    if (!dateVal) return 'Baru saja';
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? 'Baru saja' : d.toLocaleString('id-ID');
  }

  countPositives(obs: any): number {
    return obs.answers ? obs.answers.filter((a: any) => a.result === 'positif').length : 0;
  }

  countImprovements(obs: any): number {
    return obs.answers ? obs.answers.filter((a: any) => a.result === 'improvement').length : 0;
  }
}
