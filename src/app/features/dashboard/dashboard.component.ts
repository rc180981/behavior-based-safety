import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { FindingService } from '../../core/services/finding.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28">
      
      <!-- Top Title & Filter -->
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold text-navy-950">Dashboard Kepatuhan Keselamatan BBS</h1>
          <p class="mt-1 text-xs text-slate-500">
            Pemantauan kepatuhan perilaku pekerja & status tindakan korektif proyek.
          </p>
        </div>
        <div class="mt-4 sm:mt-0 flex gap-2">
          <button 
            (click)="exportReport()"
            class="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-xs font-bold rounded-xl text-slate-700 bg-white hover:bg-slate-50 shadow-xs"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Download Laporan Excel
          </button>
        </div>
      </div>

      <!-- 4 KPI Cards (Mockup 3 & 7) -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <!-- Total Observasi -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Observasi</span>
          <div class="mt-2 flex items-baseline justify-between">
            <div class="text-3xl font-black text-navy-900">
              {{ dashboard.kpi().totalObservations }}
            </div>
            <span class="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">Aktif</span>
          </div>
        </div>

        <!-- % Kepatuhan Positif -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">% Kepatuhan Positif</span>
          <div class="mt-2 flex items-baseline justify-between">
            <div 
              [ngClass]="dashboard.kpi().percentPositive >= 85 ? 'text-emerald-600' : 'text-amber-600'"
              class="text-3xl font-black"
            >
              {{ dashboard.kpi().percentPositive }}%
            </div>
            <span 
              [ngClass]="dashboard.kpi().percentPositive >= 85 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'"
              class="text-xs font-bold px-2 py-0.5 rounded-full"
            >
              {{ dashboard.kpi().percentPositive >= 85 ? 'Baik' : 'Perhatian' }}
            </span>
          </div>
        </div>

        <!-- Temuan Open -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Temuan Open</span>
          <div class="mt-2 flex items-baseline justify-between">
            <div class="text-3xl font-black text-amber-600">
              {{ dashboard.kpi().openFindings + dashboard.kpi().waitingVerification }}
            </div>
            <span class="text-[11px] text-slate-400">
              {{ dashboard.kpi().waitingVerification }} Verifikasi
            </span>
          </div>
        </div>

        <!-- Overdue -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Temuan Overdue</span>
          <div class="mt-2 flex items-baseline justify-between">
            <div 
              [ngClass]="dashboard.kpi().overdueFindings > 0 ? 'text-red-600' : 'text-slate-700'"
              class="text-3xl font-black"
            >
              {{ dashboard.kpi().overdueFindings }}
            </div>
            @if (dashboard.kpi().overdueFindings > 0) {
              <span class="text-xs text-red-700 font-extrabold bg-red-50 px-2 py-0.5 rounded-full animate-pulse">
                Eskalasi
              </span>
            } @else {
              <span class="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                Nihil
              </span>
            }
          </div>
        </div>
      </div>

      <!-- Section: Behavior Compliance Ratio Bars -->
      <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs mb-8">
        <h2 class="text-sm font-bold text-navy-950 uppercase tracking-wider mb-4">
          Tingkat Kepatuhan per Perilaku Keselamatan (MCS-01)
        </h2>

        @if (dashboard.behaviorBreakdown().length === 0) {
          <div class="py-8 text-center text-xs text-slate-400">
            Belum ada observasi yang tercatat untuk perilaku keselamatan.
          </div>
        } @else {
          <div class="space-y-4">
            @for (b of dashboard.behaviorBreakdown(); track b.itemId) {
              <div>
                <div class="flex items-center justify-between text-xs mb-1">
                  <span class="font-bold text-slate-800">{{ b.title }}</span>
                  <span class="font-extrabold text-navy-900">{{ b.percent }}% ({{ b.positive }}/{{ b.total }})</span>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div 
                    [style.width.%]="b.percent"
                    [ngClass]="b.percent >= 85 ? 'bg-emerald-500' : (b.percent >= 70 ? 'bg-amber-500' : 'bg-red-500')"
                    class="h-3 rounded-full transition-all duration-500"
                  ></div>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Section: Recent Findings Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-bold text-navy-950 uppercase tracking-wider">Temuan Terbaru</h2>
          <a routerLink="/temuan" class="text-xs font-bold text-navy-800 hover:underline">
            Lihat Semua Temuan →
          </a>
        </div>

        @if (dashboard.recentFindings().length === 0) {
          <div class="py-8 text-center text-xs text-slate-400">
            Tidak ada temuan yang memerlukan tindak lanjut saat ini.
          </div>
        } @else {
          <div class="divide-y divide-slate-100">
            @for (f of dashboard.recentFindings(); track f.id) {
              <div class="py-3 flex items-center justify-between gap-4">
                <div class="max-w-md">
                  <div class="flex items-center gap-2 mb-0.5">
                    @if (f.isOverdue) {
                      <span class="bg-red-100 text-red-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Overdue</span>
                    }
                    <span 
                      [ngClass]="{
                        'bg-amber-100 text-amber-800': f.status === 'open',
                        'bg-blue-100 text-blue-800': f.status === 'waiting_verification',
                        'bg-emerald-100 text-emerald-800': f.status === 'closed'
                      }"
                      class="text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase"
                    >
                      {{ f.status.replace('_', ' ') }}
                    </span>
                    <span class="text-xs font-bold text-slate-900 truncate">{{ f.note }}</span>
                  </div>
                  <span class="text-[10px] text-slate-400">PIC: {{ f.picUid }} · Target: {{ f.dueDate }}</span>
                </div>

                <a [routerLink]="['/temuan', f.id]" class="text-xs text-navy-800 font-bold hover:underline flex-shrink-0">
                  Periksa →
                </a>
              </div>
            }
          </div>
        }
      </div>

    </div>
  `
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  dashboard = inject(DashboardService);
  findingService = inject(FindingService);

  async ngOnInit(): Promise<void> {
    const proj = this.auth.activeProject();
    if (proj) {
      await this.dashboard.loadStats(proj.id);
      await this.findingService.loadFindings(proj.id);
    }
  }

  exportReport(): void {
    this.findingService.exportToCsv(this.findingService.findings());
  }
}
