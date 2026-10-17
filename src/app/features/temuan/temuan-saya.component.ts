import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-temuan-saya',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-6 pb-24">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-navy-950">Tindak Lanjut Temuan PIC</h2>
        <span class="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">2 Open</span>
      </div>

      <!-- Filter Tabs -->
      <div class="flex border-b border-slate-200 mb-6 gap-6 text-sm font-semibold">
        <button class="pb-3 border-b-2 border-navy-800 text-navy-900">Open (2)</button>
        <button class="pb-3 text-slate-500 hover:text-slate-700">Menunggu Verifikasi (1)</button>
        <button class="pb-3 text-slate-500 hover:text-slate-700">Selesai / Closed (12)</button>
      </div>

      <!-- Finding Card Preview -->
      <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div class="flex items-center justify-between">
          <span class="bg-red-50 text-red-700 border border-red-200 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase">
            Overdue (H-1)
          </span>
          <span class="text-xs text-slate-400">16 Okt 2026</span>
        </div>

        <div>
          <h3 class="font-bold text-slate-900 text-base">Tidak memakai safety vest di area loading dock</h3>
          <p class="text-xs text-slate-500 mt-1">Area: Loading Dock · Risiko: Sedang · Kategori: Wajib</p>
        </div>

        <div class="bg-slate-50 p-3 rounded-xl text-xs text-slate-700">
          <span class="font-semibold block text-slate-800">Catatan Petugas:</span>
          Ditemukan operator forklift dan helper berjalan di luar jalur tanpa rompi reflektif.
        </div>

        <div class="pt-2 flex justify-end">
          <button class="w-full sm:w-auto bg-navy-800 text-white font-semibold text-xs px-5 py-2.5 rounded-xl hover:bg-navy-900 shadow-sm">
            Tindak Lanjut & Unggah Bukti
          </button>
        </div>
      </div>
    </div>
  `
})
export class TemuanSayaComponent {}
