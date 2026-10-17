import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold text-navy-950">Dashboard Proyek BBS</h1>
          <p class="mt-1 text-sm text-slate-500">Ringkasan observasi keselamatan & kepatuhan perilaku pekerja.</p>
        </div>
        <div class="mt-4 sm:mt-0">
          <span class="inline-flex rounded-md shadow-sm">
            <button class="inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-xl text-slate-700 bg-white hover:bg-slate-50">
              Download Laporan
            </button>
          </span>
        </div>
      </div>

      <!-- 4 KPI Cards matching Mockup 3 & 7 -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Observasi</span>
          <div class="mt-2 flex items-baseline justify-between">
            <div class="text-2xl font-black text-navy-900">142</div>
            <span class="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">+12%</span>
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wide">% Kepatuhan Positif</span>
          <div class="mt-2 flex items-baseline justify-between">
            <div class="text-2xl font-black text-emerald-600">88.4%</div>
            <span class="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">Baik</span>
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Temuan Open</span>
          <div class="mt-2 flex items-baseline justify-between">
            <div class="text-2xl font-black text-amber-600">7</div>
            <span class="text-xs text-slate-400">Dalam proses</span>
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Overdue</span>
          <div class="mt-2 flex items-baseline justify-between">
            <div class="text-2xl font-black text-red-600">2</div>
            <span class="text-xs text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-full">Perlu Aksi</span>
          </div>
        </div>
      </div>

      <!-- Info Card -->
      <div class="bg-navy-900 text-white rounded-2xl p-6 shadow-md mb-8">
        <h3 class="text-lg font-bold mb-2">Fase 0 Berhasil Diinisialisasi</h3>
        <p class="text-sm text-navy-200 max-w-2xl">
          Aplikasi BBS Genba PWA telah siap dengan arsitektur Angular 19, Tailwind CSS, Vercel Serverless Functions, dan Firebase Security Rules.
        </p>
      </div>
    </div>
  `
})
export class DashboardComponent {}
