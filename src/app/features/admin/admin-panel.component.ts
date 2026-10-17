import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-navy-950">Pengaturan Admin</h1>
        <p class="text-sm text-slate-500">Kelola proyek, parameter geofence, daftar area, item HSE, dan hak akses anggota.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Geofence Card -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div class="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <h3 class="font-bold text-slate-900 text-lg mb-1">Geofence & Lokasi</h3>
          <p class="text-xs text-slate-500 mb-4">Titik koordinat, radius toleransi (meter), dan batas akurasi GPS tanpa override.</p>
          <span class="text-xs text-indigo-600 font-semibold cursor-pointer hover:underline">Kelola Geofence →</span>
        </div>

        <!-- Item HSE Card -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div class="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          </div>
          <h3 class="font-bold text-slate-900 text-lg mb-1">Item HSE & Standar</h3>
          <p class="text-xs text-slate-500 mb-4">Daftar perilaku, kategori Wajib vs Medium, dan gambar kartu standar versi.</p>
          <span class="text-xs text-amber-600 font-semibold cursor-pointer hover:underline">Kelola Item & Standar →</span>
        </div>

        <!-- User & Roles Card -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          </div>
          <h3 class="font-bold text-slate-900 text-lg mb-1">Pengguna & Role</h3>
          <p class="text-xs text-slate-500 mb-4">Penugasan peran (Petugas, Supervisor, Admin) per proyek dan status akun.</p>
          <span class="text-xs text-emerald-600 font-semibold cursor-pointer hover:underline">Kelola Anggota →</span>
        </div>
      </div>
    </div>
  `
})
export class AdminPanelComponent {}
