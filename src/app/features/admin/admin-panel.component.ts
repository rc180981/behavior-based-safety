import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProjectService } from '../../core/services/project.service';
import { GeolocationService } from '../../core/services/geolocation.service';
import { Project, ProjectArea, ProjectItem, ProjectMember } from '../../core/models/bbs.models';
import * as QRCode from 'qrcode';

interface ToastInfo {
  message: string;
  type: 'success' | 'error' | 'info';
}

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28">
      
      <!-- Toast Notification -->
      @if (toast(); as t) {
        <div 
          class="fixed bottom-20 right-4 sm:right-8 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold animate-bounce transition-all duration-300"
          [ngClass]="{
            'bg-emerald-900 text-white border-emerald-700': t.type === 'success',
            'bg-rose-900 text-white border-rose-700': t.type === 'error',
            'bg-navy-900 text-white border-navy-700': t.type === 'info'
          }"
        >
          <span>{{ t.message }}</span>
          <button (click)="toast.set(null)" class="text-white/70 hover:text-white ml-2 text-sm">✕</button>
        </div>
      }

      <!-- Admin Header -->
      <div class="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-navy-100 text-navy-900 text-sm font-bold">⚙️</span>
            <h1 class="text-xl sm:text-2xl font-bold text-navy-950">Panel Administrasi HSE</h1>
          </div>
          <p class="text-xs text-slate-500 mt-1">Konfigurasi operasional proyek: Area & QR Titik Genba, Standar Item Kepatuhan HSE, dan Parameter Geofence.</p>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <a 
            routerLink="/admin/users"
            class="inline-flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-xs font-bold px-4 py-3 rounded-xl shadow-xs active:scale-95 transition-all"
            title="Kelola Akun, Peran RBAC, dan Hak Akses Pengguna"
          >
            <span>👥</span>
            <span>Kelola Pengguna (RBAC) ➔</span>
          </a>

          <button 
            (click)="openCreateProjectModal()"
            class="inline-flex items-center justify-center gap-2 bg-navy-800 text-white text-xs font-bold px-4 py-3 rounded-xl hover:bg-navy-900 shadow-sm active:scale-95 transition-transform"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
            <span>+ Buat Proyek Baru</span>
          </button>
        </div>
      </div>

      <!-- Project Selector & Summary Card (Tahap 0) -->
      <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs mb-6">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <!-- Select Box -->
          <div class="flex flex-col sm:flex-row sm:items-center gap-3">
            <label class="text-xs font-bold text-slate-700 flex items-center gap-1.5 whitespace-nowrap">
              <span>Proyek Aktif:</span>
            </label>
            <div class="relative min-w-[260px] sm:w-80">
              <select 
                [ngModel]="auth.activeProject()?.id"
                (ngModelChange)="onSelectProject($event)"
                class="w-full appearance-none rounded-xl border border-slate-300 py-2.5 pl-3.5 pr-8 text-xs font-bold text-navy-950 focus:border-navy-600 focus:outline-none bg-slate-50 shadow-inner"
              >
                @for (p of projectService.projects(); track p.id) {
                  <option [value]="p.id">{{ p.name }} [{{ p.code }}]</option>
                }
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          <!-- Quick Stats Pills -->
          <div class="flex flex-wrap items-center gap-2 sm:gap-3">
            <div class="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span class="text-slate-500">Kode:</span>
              <span class="font-extrabold text-navy-900 uppercase">{{ auth.activeProject()?.code || '-' }}</span>
            </div>
            <div class="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs">
              <span class="text-slate-500">Area:</span>
              <span class="font-extrabold text-navy-900">{{ projectService.activeAreas().length }}</span>
            </div>
            <div class="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs">
              <span class="text-slate-500">Item HSE:</span>
              <span class="font-extrabold text-navy-900">{{ projectService.activeItems().length }}</span>
            </div>
            <a 
              routerLink="/admin/users"
              title="Kelola Pengguna di Halaman Terpisah"
              class="bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs transition-colors"
            >
              <span class="text-slate-500">Pengguna (RBAC):</span>
              <span class="font-extrabold text-navy-900">{{ members().length }}</span>
              <span class="text-[10px] text-indigo-600 font-bold">↗</span>
            </a>
          </div>

        </div>
      </div>

      <!-- Navigation Tabs (Pills style) - Alur Operasional: Tahap 2 -> Tahap 3 -> Tahap 1 -->
      <div class="flex gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200 mb-6 overflow-x-auto text-xs font-bold no-scrollbar">
        <button 
          (click)="activeTab = 'areas'"
          [ngClass]="activeTab === 'areas' ? 'bg-white text-navy-950 shadow-xs' : 'text-slate-600 hover:text-navy-900'"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap"
        >
          <span>🏷️</span>
          <span>1. Area Proyek & QR Titik Genba ({{ projectService.activeAreas().length }})</span>
        </button>
        <button 
          (click)="activeTab = 'items'"
          [ngClass]="activeTab === 'items' ? 'bg-white text-navy-950 shadow-xs' : 'text-slate-600 hover:text-navy-900'"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap"
        >
          <span>📋</span>
          <span>2. Item HSE & Standar Kategori ({{ projectService.activeItems().length }})</span>
        </button>
        <button 
          (click)="activeTab = 'geofence'"
          [ngClass]="activeTab === 'geofence' ? 'bg-white text-navy-950 shadow-xs' : 'text-slate-600 hover:text-navy-900'"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap"
        >
          <span>📍</span>
          <span>3. Geofence & Parameter Proyek</span>
        </button>
      </div>

      <!-- ========================================== -->
      <!-- TAB 1: AREA PROYEK & QR CODE (TAHAP 2)   -->
      <!-- ========================================== -->
      @if (activeTab === 'areas') {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Tambah Area Form (1 col) -->
          <div class="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs h-fit">
            <h3 class="text-sm font-bold text-navy-950 mb-1">+ Tambah Area Proyek Baru</h3>
            <p class="text-xs text-slate-500 mb-4">Area digunakan untuk mengelompokkan zona inspeksi dan generate stiker QR Code.</p>
            
            <form (ngSubmit)="addArea()" class="space-y-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Nama Area / Zona</label>
                <input 
                  type="text" 
                  [(ngModel)]="newAreaName" 
                  name="areaName"
                  placeholder="Misal: Warehouse A, Bengkel Fabrikasi, Area Tangki"
                  class="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-navy-600 focus:outline-none"
                  required
                />
              </div>
              <button 
                type="submit"
                [disabled]="!newAreaName.trim() || isAddingArea()"
                class="w-full bg-navy-800 text-white text-xs font-bold py-3 rounded-xl hover:bg-navy-900 disabled:opacity-50 active:scale-95 transition-all shadow-xs flex items-center justify-center gap-2"
              >
                @if (isAddingArea()) {
                  <span>Menyimpan...</span>
                } @else {
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                  <span>Simpan Area Baru</span>
                }
              </button>
            </form>
          </div>

          <!-- Daftar Area (2 cols) -->
          <div class="lg:col-span-2 space-y-3">
            <div class="flex items-center justify-between pb-1">
              <span class="text-xs font-bold text-slate-700">Daftar Area Kerja ({{ projectService.activeAreas().length }})</span>
              <span class="text-[11px] text-slate-400">Pindai QR saat observasi untuk verifikasi lokasi</span>
            </div>

            @if (projectService.activeAreas().length === 0) {
              <div class="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                <span class="text-3xl block mb-2">🏷️</span>
                <h4 class="text-xs font-bold text-slate-700">Belum ada area kerja di proyek ini</h4>
                <p class="text-[11px] text-slate-400 mt-1">Tambahkan area melalui form di samping untuk mulai memetakan zona genba.</p>
              </div>
            }

            @for (area of projectService.activeAreas(); track area.id) {
              <div class="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-colors">
                <div class="flex items-start gap-3">
                  <div class="w-9 h-9 rounded-xl bg-navy-50 text-navy-800 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
                    📍
                  </div>
                  <div>
                    <h4 class="text-xs sm:text-sm font-bold text-slate-900">{{ area.name }}</h4>
                    <span class="text-[10px] text-slate-400 font-mono">ID: {{ area.id }}</span>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex items-center gap-2 self-end sm:self-center flex-wrap">
                  <button 
                    (click)="generateAreaQr(area)"
                    class="text-xs font-bold text-navy-800 bg-navy-50 hover:bg-navy-100 px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors active:scale-95 border border-navy-100"
                    title="Cetak Stiker QR Code untuk Area ini"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                    <span>Cetak QR</span>
                  </button>

                  <button 
                    (click)="openEditAreaModal(area)"
                    class="text-xs font-semibold text-slate-600 hover:text-navy-900 hover:bg-slate-100 px-2.5 py-2 rounded-xl transition-colors border border-slate-200"
                    title="Ubah Nama Area"
                  >
                    ✏️ Edit
                  </button>

                  <button 
                    (click)="confirmDeleteArea(area)"
                    class="text-xs font-semibold text-rose-600 hover:bg-rose-50 px-2.5 py-2 rounded-xl transition-colors border border-rose-100"
                    title="Hapus Area"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            }
          </div>

        </div>
      }

      <!-- ========================================== -->
      <!-- TAB 2: ITEM HSE & KATEGORI (TAHAP 3)     -->
      <!-- ========================================== -->
      @if (activeTab === 'items') {
        <div class="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
          
          <!-- Filter & Action Header -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <h3 class="text-base font-bold text-navy-950">Item Perilaku & Kategori Kepatuhan</h3>
              <p class="text-xs text-slate-500 mt-0.5">Kategori <strong>Wajib</strong> mengunci tombol kirim di lapangan sebelum dinilai. Penurunan ke <strong>Medium</strong> wajib menyertakan alasan HSE.</p>
            </div>

            <!-- Sync Master Button -->
            <button 
              (click)="syncMasterItems()"
              [disabled]="isSyncingItems()"
              class="inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-navy-950 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-200 transition-colors disabled:opacity-50"
            >
              @if (isSyncingItems()) {
                <span>Menyinkronkan...</span>
              } @else {
                <span>🔄 Sinkronkan Master BBS</span>
              }
            </button>
          </div>

          <!-- Search & Filter Controls -->
          <div class="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="relative w-full sm:w-80">
              <input 
                type="text" 
                [(ngModel)]="itemSearchQuery" 
                placeholder="Cari item perilaku..." 
                class="w-full rounded-xl border border-slate-300 pl-8 pr-3 py-2 text-xs focus:border-navy-600 focus:outline-none"
              />
              <span class="absolute left-2.5 top-2.5 text-slate-400 text-xs">🔍</span>
            </div>

            <div class="flex items-center gap-1.5 self-start sm:self-auto">
              <button 
                (click)="itemCategoryFilter = 'all'"
                [ngClass]="itemCategoryFilter === 'all' ? 'bg-navy-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                class="text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors"
              >
                Semua ({{ projectService.activeItems().length }})
              </button>
              <button 
                (click)="itemCategoryFilter = 'wajib'"
                [ngClass]="itemCategoryFilter === 'wajib' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'"
                class="text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors"
              >
                Wajib ({{ countItemsByCategory('wajib') }})
              </button>
              <button 
                (click)="itemCategoryFilter = 'medium'"
                [ngClass]="itemCategoryFilter === 'medium' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'"
                class="text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors"
              >
                Medium ({{ countItemsByCategory('medium') }})
              </button>
            </div>
          </div>

          <!-- Item List -->
          <div class="divide-y divide-slate-100">
            @if (filteredItems().length === 0) {
              <div class="py-12 text-center text-slate-400 text-xs">
                Tidak ada item perilaku yang sesuai kriteria pencarian / filter.
              </div>
            }

            @for (item of filteredItems(); track item.id) {
              <div class="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div class="max-w-2xl">
                  <div class="flex items-center gap-2 mb-1.5">
                    <span 
                      [ngClass]="item.category === 'wajib' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-800 border-amber-200'"
                      class="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border tracking-wider"
                    >
                      {{ item.category }}
                    </span>
                    <h4 class="text-xs sm:text-sm font-bold text-slate-900">{{ item.title }}</h4>
                  </div>
                  <p class="text-xs text-slate-500 leading-relaxed">{{ item.description }}</p>
                </div>

                <div class="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                  <label class="text-[11px] text-slate-400 font-semibold hidden sm:inline">Kategori:</label>
                  <select 
                    [ngModel]="item.category"
                    (ngModelChange)="onCategoryChange(item, $event)"
                    class="rounded-xl border border-slate-300 py-1.5 px-3 text-xs font-bold focus:border-navy-600 focus:outline-none bg-slate-50 cursor-pointer shadow-xs"
                  >
                    <option value="wajib">🔴 Wajib (Ketat)</option>
                    <option value="medium">🟡 Medium (Standar)</option>
                  </select>
                </div>
              </div>
            }
          </div>

        </div>
      }

      <!-- ========================================== -->
      <!-- TAB 3: GEOFENCE & PARAMETER PROYEK (TAHAP 1) -->
      <!-- ========================================== -->
      @if (activeTab === 'geofence') {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Main Parameter Form (2 cols) -->
          <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
            <div class="border-b border-slate-100 pb-4 mb-5">
              <h2 class="text-base font-bold text-navy-950">Parameter Proyek & Geofence Lapangan</h2>
              <p class="text-xs text-slate-500 mt-0.5">Atur perimeter koordinat GPS, batas toleransi radius, tingkat risiko, dan target SLA penyelesaian temuan.</p>
            </div>

            <form (ngSubmit)="saveProjectAndGeofence()" class="space-y-5">
              
              <!-- Info Dasar Proyek -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Nama Proyek</label>
                  <input 
                    type="text" 
                    [(ngModel)]="projectForm.name" 
                    name="projectName" 
                    class="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-medium focus:border-navy-600 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Kode Proyek</label>
                  <input 
                    type="text" 
                    [(ngModel)]="projectForm.code" 
                    name="projectCode" 
                    class="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold uppercase focus:border-navy-600 focus:outline-none bg-slate-50"
                    required
                  />
                </div>
              </div>

              <!-- Risk Level & Due Days -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Tingkat Risiko Proyek</label>
                  <select 
                    [(ngModel)]="projectForm.riskLevel" 
                    name="riskLevel" 
                    class="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold focus:border-navy-600 focus:outline-none bg-white"
                  >
                    <option value="tinggi">Tinggi (High Risk)</option>
                    <option value="medium">Medium (Standard Risk)</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Tenggat Temuan Wajib (Hari)</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="30"
                    [(ngModel)]="projectForm.dueDaysWajib" 
                    name="dueDaysWajib" 
                    class="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-navy-600 focus:outline-none"
                  />
                  <span class="text-[10px] text-slate-400">Standar HSE: 3 hari</span>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Tenggat Temuan Medium (Hari)</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="60"
                    [(ngModel)]="projectForm.dueDaysMedium" 
                    name="dueDaysMedium" 
                    class="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-navy-600 focus:outline-none"
                  />
                  <span class="text-[10px] text-slate-400">Standar HSE: 7 hari</span>
                </div>
              </div>

              <!-- Perimeter Geofence -->
              <div class="pt-2 border-t border-slate-100">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-bold text-navy-950 uppercase tracking-wider">Perimeter Titik Pusat Geofence</span>
                  <button 
                    type="button" 
                    (click)="useCurrentLocationAsCenter()" 
                    [disabled]="isDetectingGps()"
                    class="text-xs text-navy-700 font-bold hover:text-navy-900 hover:underline flex items-center gap-1.5 disabled:opacity-50"
                  >
                    @if (isDetectingGps()) {
                      <svg class="animate-spin h-3.5 w-3.5 text-navy-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      <span>Mendeteksi GPS...</span>
                    } @else {
                      <span>📍 Gunakan Koordinat GPS Saya Sekarang</span>
                    }
                  </button>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-medium text-slate-600 mb-1">Latitude Titik Pusat</label>
                    <input 
                      type="number" 
                      step="any" 
                      [(ngModel)]="geofenceForm.lat" 
                      name="lat" 
                      class="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-navy-600 focus:outline-none bg-slate-50"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-slate-600 mb-1">Longitude Titik Pusat</label>
                    <input 
                      type="number" 
                      step="any" 
                      [(ngModel)]="geofenceForm.lng" 
                      name="lng" 
                      class="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-navy-600 focus:outline-none bg-slate-50"
                    />
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                  <div>
                    <label class="block text-xs font-medium text-slate-600 mb-1">Radius Toleransi (Meter)</label>
                    <input 
                      type="number" 
                      [(ngModel)]="geofenceForm.radiusM" 
                      name="radiusM" 
                      class="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-navy-600 focus:outline-none"
                    />
                    <span class="text-[10px] text-slate-400">Rekomendasi area gedung/pabrik: 150 - 300 m</span>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-slate-600 mb-1">Batas Maksimal Akurasi GPS (Meter)</label>
                    <input 
                      type="number" 
                      [(ngModel)]="geofenceForm.maxAccuracyM" 
                      name="maxAccuracyM" 
                      class="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-navy-600 focus:outline-none"
                    />
                    <span class="text-[10px] text-slate-400">Rekomendasi toleransi mobile: 50 m</span>
                  </div>
                </div>
              </div>

              <!-- Switch Validasi Geofence -->
              <div class="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span class="text-xs font-bold text-slate-800 block">Wajibkan Validasi Geofence Lapangan</span>
                  <span class="text-[11px] text-slate-500 block">Jika aktif, petugas di luar radius tidak dapat mengirim form observasi tanpa override.</span>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    [(ngModel)]="geofenceForm.required" 
                    name="required"
                    class="sr-only peer"
                  />
                  <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-navy-800"></div>
                </label>
              </div>

              <!-- Action Submit -->
              <div class="pt-4 border-t border-slate-100 flex justify-end">
                <button 
                  type="submit" 
                  [disabled]="isSaving()"
                  class="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-navy-800 text-white text-xs font-bold px-6 py-3 rounded-xl hover:bg-navy-900 shadow-sm disabled:opacity-50 active:scale-95 transition-all"
                >
                  @if (isSaving()) {
                    <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span>Menyimpan Perubahan...</span>
                  } @else {
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                    <span>Simpan Pengaturan Proyek & Geofence</span>
                  }
                </button>
              </div>

            </form>
          </div>

          <!-- Geofence Info Card (1 col) -->
          <div class="space-y-4">
            <div class="bg-gradient-to-br from-navy-900 to-navy-950 text-white rounded-2xl p-5 shadow-xs">
              <span class="text-[10px] font-extrabold uppercase tracking-widest text-navy-300">Panduan Geofence BBS</span>
              <h3 class="text-sm font-bold mt-1 mb-2">Integritas Validasi Lapangan</h3>
              <p class="text-xs text-navy-100 leading-relaxed">
                Serverless API memvalidasi jarak koordinat petugas menggunakan rumus Haversine. Validasi ini memastikan observasi benar-benar dilakukan secara nyata (*genba*) di lokasi proyek.
              </p>
              
              <div class="mt-4 pt-4 border-t border-navy-800/80 space-y-2 text-xs">
                <div class="flex items-center justify-between">
                  <span class="text-navy-300">Status Geofence:</span>
                  <span 
                    [ngClass]="geofenceForm.required ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'"
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                  >
                    {{ geofenceForm.required ? 'AKTIF KETAT' : 'MODE FLEKSIBEL' }}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-navy-300">Radius Cakupan:</span>
                  <span class="font-bold text-white">{{ geofenceForm.radiusM }} Meter</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-navy-300">Toleransi Akurasi:</span>
                  <span class="font-bold text-white">{{ geofenceForm.maxAccuracyM }} Meter</span>
                </div>
              </div>
            </div>

            <!-- Quick SLA Info -->
            <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs">
              <h4 class="font-bold text-slate-800 mb-1">Kebijakan Eskalasi SLA</h4>
              <p class="text-slate-500 text-[11px] leading-relaxed">
                Temuan berkategori <strong class="text-red-700">Wajib</strong> beresiko tinggi memiliki tenggat penyelesaian {{ projectForm.dueDaysWajib }} hari. Melewati batas ini, kartu temuan akan berstatus <strong class="text-red-600">OVERDUE</strong> dan ditampilkan mencolok di dashboard HSE.
              </p>
            </div>
          </div>

        </div>
      }

      <!-- ========================================== -->
      <!-- MODAL: DOWNGRASE REASON (HSE AUDIT)       -->
      <!-- ========================================== -->
      @if (downgradeModalItem()) {
        <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div class="flex items-center gap-2 mb-2 text-amber-700">
              <span class="text-lg">⚠️</span>
              <h3 class="text-sm font-bold text-navy-950">Alasan Penurunan Kategori (Wajib ➔ Medium)</h3>
            </div>
            <p class="text-xs text-slate-500 mb-4 leading-relaxed">
              Sesuai standar kepatuhan K3, setiap perubahan item berkategori Wajib menjadi Medium harus disertai pembenaran operasional dan dicatat ke dalam <strong>Audit Log</strong>.
            </p>

            <label class="block text-xs font-bold text-slate-700 mb-1">Catatan Pembenaran HSE:</label>
            <textarea 
              [(ngModel)]="downgradeReason"
              rows="3"
              placeholder="Tuliskan alasan pembenaran HSE (minimal 5 karakter)..."
              class="w-full rounded-xl border border-slate-300 p-3 text-xs focus:border-navy-600 focus:outline-none mb-4"
            ></textarea>
            
            <div class="flex justify-end gap-2">
              <button 
                (click)="cancelDowngrade()"
                class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button 
                (click)="confirmDowngrade()"
                [disabled]="downgradeReason.trim().length < 5"
                class="px-4 py-2 text-xs font-bold text-white bg-navy-800 hover:bg-navy-900 rounded-xl disabled:opacity-50"
              >
                Konfirmasi & Simpan
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ========================================== -->
      <!-- MODAL: BUAT PROYEK BARU                   -->
      <!-- ========================================== -->
      @if (showCreateProjectModal()) {
        <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 class="text-base font-bold text-navy-950 mb-1">Buat Proyek Baru</h3>
            <p class="text-xs text-slate-500 mb-4">Tambahkan lokasi proyek baru ke dalam sistem BBS Genba.</p>

            <form (ngSubmit)="createProject()" class="space-y-3.5 mb-6">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Nama Proyek</label>
                <input 
                  type="text" 
                  [(ngModel)]="newProjectForm.name" 
                  name="newName"
                  placeholder="Misal: Proyek Warehouse Cikarang"
                  class="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-navy-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Kode Proyek Singkat</label>
                <input 
                  type="text" 
                  [(ngModel)]="newProjectForm.code" 
                  name="newCode"
                  placeholder="Misal: WH-CKR"
                  class="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold uppercase focus:border-navy-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Tingkat Risiko</label>
                <select 
                  [(ngModel)]="newProjectForm.riskLevel" 
                  name="newRisk"
                  class="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold focus:border-navy-600 focus:outline-none bg-white"
                >
                  <option value="tinggi">Tinggi (High Risk)</option>
                  <option value="medium">Medium (Standard)</option>
                </select>
              </div>

              <div class="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  (click)="showCreateProjectModal.set(false)"
                  class="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  [disabled]="!newProjectForm.name.trim() || !newProjectForm.code.trim() || isCreatingProject()"
                  class="px-5 py-2.5 text-xs font-bold text-white bg-navy-800 hover:bg-navy-900 rounded-xl disabled:opacity-50"
                >
                  @if (isCreatingProject()) {
                    <span>Membuat...</span>
                  } @else {
                    <span>Buat Proyek</span>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- ========================================== -->
      <!-- MODAL: EDIT NAMA AREA                     -->
      <!-- ========================================== -->
      @if (editingArea(); as ea) {
        <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 class="text-sm font-bold text-navy-950 mb-1">Ubah Nama Area</h3>
            <p class="text-xs text-slate-500 mb-4">Perbarui nama area kerja di proyek aktif.</p>

            <form (ngSubmit)="saveEditedArea()" class="space-y-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Nama Area</label>
                <input 
                  type="text" 
                  [(ngModel)]="editAreaName" 
                  name="editName"
                  class="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-navy-600 focus:outline-none"
                  required
                />
              </div>

              <div class="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  (click)="editingArea.set(null)"
                  class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  [disabled]="!editAreaName.trim()"
                  class="px-4 py-2 text-xs font-bold text-white bg-navy-800 hover:bg-navy-900 rounded-xl disabled:opacity-50"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- ========================================== -->
      <!-- MODAL: QR CODE AREA (PRINT & DOWNLOAD)    -->
      <!-- ========================================== -->
      @if (qrModalData(); as qrd) {
        <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy-50 text-navy-800 text-[10px] font-extrabold uppercase tracking-widest mb-2">
              <span>📍 QR Check-in Area</span>
            </div>
            
            <h3 class="text-base font-extrabold text-navy-950">{{ qrd.areaName }}</h3>
            <p class="text-[11px] text-slate-400 mb-4">{{ auth.activeProject()?.name }} [{{ auth.activeProject()?.code }}]</p>
            
            <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 inline-block mb-4 shadow-inner">
              <img [src]="qrd.dataUrl" alt="QR Code" class="w-52 h-52 mx-auto rounded-lg" />
            </div>

            <p class="text-[11px] text-slate-500 mb-5 leading-normal">
              Cetak dan tempel stiker ini di pintu masuk zona. Petugas dapat memindai saat observasi genba untuk otomatis mengisi area.
            </p>

            <div class="grid grid-cols-2 gap-2">
              <button 
                (click)="downloadQrPng(qrd)"
                class="px-3 py-2.5 text-xs font-bold text-navy-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <span>⬇️ Unduh PNG</span>
              </button>
              <button 
                (click)="printQrCode(qrd)"
                class="px-3 py-2.5 text-xs font-bold text-white bg-navy-800 hover:bg-navy-900 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>🖨️ Cetak / Print</span>
              </button>
            </div>

            <button 
              (click)="qrModalData.set(null)"
              class="w-full mt-2.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Tutup
            </button>
          </div>
        </div>
      }

    </div>
  `
})
export class AdminPanelComponent implements OnInit {
  auth = inject(AuthService);
  projectService = inject(ProjectService);
  geo = inject(GeolocationService);

  activeTab: 'areas' | 'items' | 'geofence' = 'areas';
  toast = signal<ToastInfo | null>(null);

  isSaving = signal<boolean>(false);
  isDetectingGps = signal<boolean>(false);
  isAddingArea = signal<boolean>(false);
  isSyncingItems = signal<boolean>(false);
  isCreatingProject = signal<boolean>(false);

  members = signal<ProjectMember[]>([]);

  // Form Model
  projectForm = {
    name: '',
    code: '',
    riskLevel: 'tinggi' as 'tinggi' | 'medium',
    dueDaysWajib: 3,
    dueDaysMedium: 7,
  };

  geofenceForm = {
    lat: -6.2088,
    lng: 106.8456,
    radiusM: 200,
    maxAccuracyM: 50,
    required: true,
  };

  newAreaName = '';
  editingArea = signal<ProjectArea | null>(null);
  editAreaName = '';

  showCreateProjectModal = signal<boolean>(false);
  newProjectForm = { 
    name: '', 
    code: '', 
    riskLevel: 'tinggi' as 'tinggi' | 'medium' 
  };

  downgradeModalItem = signal<ProjectItem | null>(null);
  downgradeReason = '';

  qrModalData = signal<{ areaName: string; dataUrl: string } | null>(null);

  itemSearchQuery = '';
  itemCategoryFilter: 'all' | 'wajib' | 'medium' = 'all';

  filteredItems = computed(() => {
    const list = this.projectService.activeItems();
    const query = this.itemSearchQuery.toLowerCase().trim();
    const filter = this.itemCategoryFilter;

    return list.filter((item) => {
      const matchQuery = !query || (item.title ? item.title.toLowerCase().includes(query) : false) || (item.description ? item.description.toLowerCase().includes(query) : false);
      const matchCat = filter === 'all' || item.category === filter;
      return matchQuery && matchCat;
    });
  });

  countItemsByCategory(cat: 'wajib' | 'medium'): number {
    return this.projectService.activeItems().filter((i) => i.category === cat).length;
  }

  showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.toast.set({ message, type });
    setTimeout(() => {
      if (this.toast()?.message === message) {
        this.toast.set(null);
      }
    }, 4000);
  }

  async ngOnInit(): Promise<void> {
    await this.projectService.loadProjects();
    this.populateForms();
    await this.loadMembers();
  }

  populateForms(): void {
    const proj = this.auth.activeProject();
    if (proj) {
      this.projectForm.name = proj.name || '';
      this.projectForm.code = proj.code || '';
      this.projectForm.riskLevel = proj.riskLevel || 'tinggi';
      this.projectForm.dueDaysWajib = proj.dueDays?.wajib || 3;
      this.projectForm.dueDaysMedium = proj.dueDays?.medium || 7;

      if (proj.geofence) {
        this.geofenceForm = { ...proj.geofence };
      }
    }
  }

  async onSelectProject(projectId: string): Promise<void> {
    const found = this.projectService.projects().find((p) => p.id === projectId);
    if (found) {
      this.auth.setActiveProject(found, 'admin');
      this.populateForms();
      await this.projectService.loadProjectDetails(found.id);
      await this.loadMembers();
      this.showToast(`Beralih ke proyek: ${found.name}`, 'info');
    }
  }

  async useCurrentLocationAsCenter(): Promise<void> {
    this.isDetectingGps.set(true);
    try {
      const pos = await this.geo.getCurrentLocation();
      this.geofenceForm.lat = Number(pos.lat.toFixed(6));
      this.geofenceForm.lng = Number(pos.lng.toFixed(6));
      if (pos.accuracyM) {
        this.geofenceForm.maxAccuracyM = Math.max(30, Math.ceil(pos.accuracyM * 1.5));
      }
      this.showToast(`📍 Koordinat GPS berhasil disetel: ${this.geofenceForm.lat}, ${this.geofenceForm.lng} (Akurasi: ±${Math.round(pos.accuracyM)}m)`, 'success');
    } catch (err: unknown) {
      this.showToast('Gagal membaca GPS: ' + (err instanceof Error ? err.message : String(err)), 'error');
    } finally {
      this.isDetectingGps.set(false);
    }
  }

  async saveProjectAndGeofence(): Promise<void> {
    const proj = this.auth.activeProject();
    if (!proj) return;

    this.isSaving.set(true);
    try {
      const token = await this.auth.getIdToken();
      const res = await fetch('/api/admin/projects', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: proj.id,
          name: this.projectForm.name.trim(),
          code: this.projectForm.code.trim().toUpperCase(),
          riskLevel: this.projectForm.riskLevel,
          dueDays: {
            wajib: Number(this.projectForm.dueDaysWajib),
            medium: Number(this.projectForm.dueDaysMedium),
          },
          geofence: {
            lat: Number(this.geofenceForm.lat),
            lng: Number(this.geofenceForm.lng),
            radiusM: Number(this.geofenceForm.radiusM),
            maxAccuracyM: Number(this.geofenceForm.maxAccuracyM),
            required: Boolean(this.geofenceForm.required),
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menyimpan pengaturan');
      }

      proj.name = this.projectForm.name.trim();
      proj.code = this.projectForm.code.trim().toUpperCase();
      proj.riskLevel = this.projectForm.riskLevel;
      proj.geofence = { ...this.geofenceForm };
      proj.dueDays = { wajib: this.projectForm.dueDaysWajib, medium: this.projectForm.dueDaysMedium };

      this.showToast('✅ Pengaturan Proyek & Perimeter Geofence berhasil disimpan!', 'success');
    } catch (err: unknown) {
      this.showToast(err instanceof Error ? err.message : String(err), 'error');
    } finally {
      this.isSaving.set(false);
    }
  }

  async addArea(): Promise<void> {
    const proj = this.auth.activeProject();
    if (!proj || !this.newAreaName.trim()) return;

    this.isAddingArea.set(true);
    const token = await this.auth.getIdToken();
    try {
      const res = await fetch('/api/admin/areas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: proj.id,
          name: this.newAreaName.trim(),
        }),
      });

      if (res.ok) {
        const createdAreaName = this.newAreaName.trim();
        this.newAreaName = '';
        await this.projectService.loadProjectDetails(proj.id);
        this.showToast(`✅ Area "${createdAreaName}" berhasil ditambahkan!`, 'success');
      } else {
        const err = await res.json();
        this.showToast(err.error || 'Gagal menambah area', 'error');
      }
    } catch {
      this.showToast('Gagal menghubungi server', 'error');
    } finally {
      this.isAddingArea.set(false);
    }
  }

  openEditAreaModal(area: ProjectArea): void {
    this.editingArea.set(area);
    this.editAreaName = area.name;
  }

  async saveEditedArea(): Promise<void> {
    const area = this.editingArea();
    const proj = this.auth.activeProject();
    if (!area || !proj || !this.editAreaName.trim()) return;

    const token = await this.auth.getIdToken();
    try {
      const res = await fetch('/api/admin/areas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: proj.id,
          areaId: area.id,
          name: this.editAreaName.trim(),
        }),
      });

      if (res.ok) {
        area.name = this.editAreaName.trim();
        this.editingArea.set(null);
        this.showToast('✅ Nama area berhasil diperbarui', 'success');
      } else {
        const err = await res.json();
        this.showToast(err.error || 'Gagal mengubah area', 'error');
      }
    } catch {
      this.showToast('Gagal menghubungi server', 'error');
    }
  }

  async confirmDeleteArea(area: ProjectArea): Promise<void> {
    if (!confirm(`Hapus area "${area.name}"? Pastikan tidak ada aktivitas observasi berjalan di area ini.`)) {
      return;
    }

    const proj = this.auth.activeProject();
    if (!proj) return;

    const token = await this.auth.getIdToken();
    try {
      const res = await fetch(`/api/admin/areas?projectId=${proj.id}&areaId=${area.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        await this.projectService.loadProjectDetails(proj.id);
        this.showToast(`✅ Area "${area.name}" berhasil dihapus`, 'success');
      } else {
        const err = await res.json();
        this.showToast(err.error || 'Gagal menghapus area', 'error');
      }
    } catch {
      this.showToast('Gagal menghubungi server', 'error');
    }
  }

  async generateAreaQr(area: ProjectArea): Promise<void> {
    const proj = this.auth.activeProject();
    const qrContent = `BBS-AREA:${proj?.id || 'PROJ'}:${area.id}`;
    try {
      const dataUrl = await QRCode.toDataURL(qrContent, { width: 360, margin: 2 });
      this.qrModalData.set({ areaName: area.name, dataUrl });
    } catch {
      this.showToast('Gagal membuat QR Code', 'error');
    }
  }

  downloadQrPng(qrd: { areaName: string; dataUrl: string }): void {
    const link = document.createElement('a');
    link.href = qrd.dataUrl;
    link.download = `QR-BBS-${qrd.areaName.replace(/\s+/g, '_')}.png`;
    link.click();
    this.showToast('📥 Mengunduh stiker QR Code...', 'info');
  }

  printQrCode(qrd: { areaName: string; dataUrl: string }): void {
    const printWindow = window.open('', '_blank');
    const proj = this.auth.activeProject();
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>QR Code BBS - ${qrd.areaName}</title>
            <style>
              @page { size: auto; margin: 15mm; }
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; text-align: center; margin: 0; padding: 20px; }
              .card { border: 2.5px solid #0f172a; border-radius: 16px; padding: 28px 20px; max-width: 380px; margin: 0 auto; box-sizing: border-box; }
              .badge { display: inline-block; background-color: #0f172a; color: #fff; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; padding: 4px 12px; border-radius: 9999px; }
              h1 { font-size: 20px; font-weight: 800; color: #0f172a; margin: 12px 0 4px; }
              .project-title { font-size: 13px; font-weight: 600; color: #475569; margin: 0 0 16px; }
              img { width: 240px; height: 240px; border-radius: 8px; }
              .footer { font-size: 11px; color: #64748b; margin-top: 16px; line-height: 1.4; }
            </style>
          </head>
          <body>
            <div class="card">
              <span class="badge">BBS Genba Area Check-in</span>
              <h1>${qrd.areaName}</h1>
              <p class="project-title">${proj?.name || ''} [${proj?.code || ''}]</p>
              <img src="${qrd.dataUrl}" />
              <p class="footer">Pindai QR ini melalui aplikasi BBS Genba saat melakukan observasi lapangan untuk verifikasi area kerja.</p>
            </div>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(() => window.close(), 500);
              };
            <\/script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      window.print();
    }
  }

  async syncMasterItems(): Promise<void> {
    const proj = this.auth.activeProject();
    if (!proj) return;

    this.isSyncingItems.set(true);
    const token = await this.auth.getIdToken();
    try {
      const res = await fetch('/api/admin/project-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: proj.id,
          action: 'sync_master',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        await this.projectService.loadProjectDetails(proj.id);
        this.showToast(`✅ ${data.message || 'Sinkronisasi standar BBS berhasil'}`, 'success');
      } else {
        const err = await res.json();
        this.showToast(err.error || 'Gagal sinkronisasi master', 'error');
      }
    } catch {
      this.showToast('Gagal menghubungi server', 'error');
    } finally {
      this.isSyncingItems.set(false);
    }
  }

  onCategoryChange(item: ProjectItem, newCategory: 'wajib' | 'medium'): void {
    if (item.category === 'wajib' && newCategory === 'medium') {
      this.downgradeModalItem.set(item);
      this.downgradeReason = '';
    } else {
      this.updateItemCategory(item, newCategory);
    }
  }

  cancelDowngrade(): void {
    this.downgradeModalItem.set(null);
  }

  async confirmDowngrade(): Promise<void> {
    const item = this.downgradeModalItem();
    if (!item) return;

    await this.updateItemCategory(item, 'medium', this.downgradeReason);
    this.downgradeModalItem.set(null);
  }

  async updateItemCategory(item: ProjectItem, category: 'wajib' | 'medium', reason?: string): Promise<void> {
    const proj = this.auth.activeProject();
    if (!proj) return;

    const token = await this.auth.getIdToken();
    try {
      const res = await fetch('/api/admin/project-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: proj.id,
          id: item.id,
          itemId: item.itemId,
          areaId: item.areaId,
          category,
          categoryChangeReason: reason,
        }),
      });

      if (res.ok) {
        item.category = category;
        this.showToast(`✅ Kategori item diubah menjadi "${category.toUpperCase()}"`, 'success');
      } else {
        const err = await res.json();
        this.showToast(err.error || 'Gagal mengubah kategori', 'error');
      }
    } catch {
      this.showToast('Gagal menghubungi server', 'error');
    }
  }

  async loadMembers(): Promise<void> {
    const proj = this.auth.activeProject();
    if (!proj) return;

    const token = await this.auth.getIdToken();
    try {
      const res = await fetch(`/api/admin/members?projectId=${proj.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        this.members.set(data.members || []);
      }
    } catch {
      // Ignored
    }
  }

  openCreateProjectModal(): void {
    this.newProjectForm = { name: '', code: '', riskLevel: 'tinggi' };
    this.showCreateProjectModal.set(true);
  }

  async createProject(): Promise<void> {
    if (!this.newProjectForm.name.trim() || !this.newProjectForm.code.trim()) return;

    this.isCreatingProject.set(true);
    try {
      const created = await this.projectService.createInitialProject(
        this.newProjectForm.name.trim(),
        this.newProjectForm.code.trim()
      );
      this.showCreateProjectModal.set(false);
      this.populateForms();
      this.showToast(`✅ Proyek baru "${created.name}" berhasil dibuat!`, 'success');
    } catch (err: unknown) {
      this.showToast(err instanceof Error ? err.message : 'Gagal membuat proyek', 'error');
    } finally {
      this.isCreatingProject.set(false);
    }
  }
}
