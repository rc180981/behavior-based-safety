import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-observasi-baru',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-2xl mx-auto px-4 py-6 pb-24">
      <!-- Geofence Banner Status -->
      <div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-6 shadow-sm flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <span class="text-xs font-semibold text-emerald-800 uppercase tracking-wide">Status Lokasi</span>
            <p class="text-sm font-bold text-emerald-950">Lokasi terverifikasi (18 m dari titik proyek)</p>
          </div>
        </div>
        <button class="text-xs bg-white text-emerald-800 border border-emerald-300 font-semibold px-3 py-1.5 rounded-xl shadow-xs hover:bg-emerald-100">
          Cek Ulang
        </button>
      </div>

      <!-- Area Selection -->
      <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-6">
        <label class="block text-sm font-bold text-slate-800 mb-2">Pilih Area Proyek</label>
        <select class="w-full rounded-xl border border-slate-300 py-3 px-3 text-sm focus:border-navy-600 focus:outline-none">
          <option>Gudang Utama (Warehouse A)</option>
          <option>Area Fabrikasi</option>
          <option>Jalur Logistik & Loading Dock</option>
        </select>
      </div>

      <!-- Initial Behaviors Preview -->
      <h3 class="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3 px-1">Daftar Observasi Perilaku</h3>
      
      <div class="space-y-4">
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div class="flex items-start justify-between gap-2 mb-2">
            <h4 class="font-bold text-slate-900 text-base">Memasuki area warehouse memakai APD lengkap (helm & vest)</h4>
            <span class="bg-red-100 text-red-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase">Wajib</span>
          </div>
          <p class="text-xs text-slate-500 mb-4">Pastikan safety helmet terpasang tali dagu dan safety vest berpendar terlihat jelas.</p>
          
          <div class="grid grid-cols-2 gap-3">
            <button class="py-3 px-4 rounded-xl border-2 border-emerald-600 text-emerald-700 font-bold text-sm bg-emerald-50 flex items-center justify-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
              Positif
            </button>
            <button class="py-3 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:border-amber-500 hover:text-amber-600 flex items-center justify-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              Perlu Improvement
            </button>
          </div>
        </div>

        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div class="flex items-start justify-between gap-2 mb-2">
            <h4 class="font-bold text-slate-900 text-base">Berjalan pada jalur pejalan kaki yang tersedia</h4>
            <span class="bg-red-100 text-red-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase">Wajib</span>
          </div>
          <p class="text-xs text-slate-500 mb-4">Selalu berada di dalam marka hijau/kuning jalur pejalan kaki, tidak melintasi jalur forklift.</p>
          
          <div class="grid grid-cols-2 gap-3">
            <button class="py-3 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:border-emerald-600 flex items-center justify-center gap-2">
              Positif
            </button>
            <button class="py-3 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:border-amber-500 flex items-center justify-center gap-2">
              Perlu Improvement
            </button>
          </div>
        </div>
      </div>

      <!-- Submit button locked placeholder -->
      <div class="mt-8">
        <button disabled class="w-full py-4 rounded-2xl bg-slate-300 text-slate-500 font-bold text-base cursor-not-allowed shadow-none">
          Kirim Observasi (Jawab Semua Item Wajib)
        </button>
      </div>
    </div>
  `
})
export class ObservasiBaruComponent {}
