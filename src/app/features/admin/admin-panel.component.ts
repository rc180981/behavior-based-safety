import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ProjectService } from '../../core/services/project.service';
import { GeolocationService } from '../../core/services/geolocation.service';
import { Project, ProjectArea, ProjectItem, ProjectMember } from '../../core/models/bbs.models';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28">
      
      <!-- Admin Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-navy-950">Panel Administrasi HSE</h1>
        <p class="text-xs text-slate-500">Kelola perimeter geofence, daftar area, kategori item HSE, dan penugasan peran anggota.</p>
      </div>

      <!-- Project Selector / Creator Bar -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-6 flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <label class="text-xs font-bold text-slate-700">Proyek Aktif:</label>
          <select 
            [ngModel]="auth.activeProject()?.id"
            (ngModelChange)="onSelectProject($event)"
            class="rounded-xl border border-slate-300 py-2 px-3 text-xs font-semibold focus:border-navy-600 focus:outline-none bg-slate-50"
          >
            @for (p of projectService.projects(); track p.id) {
              <option [value]="p.id">{{ p.name }} ({{ p.code }})</option>
            }
          </select>
        </div>

        <button 
          (click)="showCreateProjectModal.set(true)"
          class="bg-navy-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-navy-900 shadow-xs"
        >
          + Buat Proyek Baru
        </button>
      </div>

      <!-- Navigation Tabs -->
      <div class="flex border-b border-slate-200 mb-6 gap-2 sm:gap-6 overflow-x-auto text-xs font-bold">
        <button 
          (click)="activeTab = 'geofence'"
          [ngClass]="activeTab === 'geofence' ? 'border-b-2 border-navy-900 text-navy-950 pb-3' : 'text-slate-500 hover:text-slate-800 pb-3'"
        >
          Geofence & Lokasi
        </button>
        <button 
          (click)="activeTab = 'areas'"
          [ngClass]="activeTab === 'areas' ? 'border-b-2 border-navy-900 text-navy-950 pb-3' : 'text-slate-500 hover:text-slate-800 pb-3'"
        >
          Area Proyek ({{ projectService.activeAreas().length }})
        </button>
        <button 
          (click)="activeTab = 'items'"
          [ngClass]="activeTab === 'items' ? 'border-b-2 border-navy-900 text-navy-950 pb-3' : 'text-slate-500 hover:text-slate-800 pb-3'"
        >
          Item HSE & Kategori
        </button>
        <button 
          (click)="activeTab = 'members'"
          [ngClass]="activeTab === 'members' ? 'border-b-2 border-navy-900 text-navy-950 pb-3' : 'text-slate-500 hover:text-slate-800 pb-3'"
        >
          Pengguna & Role
        </button>
      </div>

      <!-- TAB 1: GEOFENCE & LOKASI -->
      @if (activeTab === 'geofence') {
        <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-2xl">
          <h2 class="text-base font-bold text-navy-950 mb-1">Pengaturan Perimeter Geofence</h2>
          <p class="text-xs text-slate-500 mb-6">Toleransi radius dan batas akurasi GPS tanpa fasilitas override bagi petugas lapangan.</p>

          <form (ngSubmit)="saveGeofenceSettings()" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Latitude Titik Pusat</label>
                <input 
                  type="number" 
                  step="any" 
                  [(ngModel)]="geofenceForm.lat" 
                  name="lat" 
                  class="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-navy-600 focus:outline-none"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Longitude Titik Pusat</label>
                <input 
                  type="number" 
                  step="any" 
                  [(ngModel)]="geofenceForm.lng" 
                  name="lng" 
                  class="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-navy-600 focus:outline-none"
                />
              </div>
            </div>

            <div class="flex justify-end">
              <button 
                type="button" 
                (click)="useCurrentLocationAsCenter()" 
                class="text-xs text-navy-700 font-bold hover:underline flex items-center gap-1"
              >
                📍 Isi dengan koordinat GPS saya sekarang
              </button>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Radius Toleransi (Meter)</label>
                <input 
                  type="number" 
                  [(ngModel)]="geofenceForm.radiusM" 
                  name="radiusM" 
                  class="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-navy-600 focus:outline-none"
                />
                <span class="text-[10px] text-slate-400">Rekomendasi area gedung/pabrik: 150 - 300 m</span>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Batas Maks Akurasi GPS (Meter)</label>
                <input 
                  type="number" 
                  [(ngModel)]="geofenceForm.maxAccuracyM" 
                  name="maxAccuracyM" 
                  class="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-navy-600 focus:outline-none"
                />
                <span class="text-[10px] text-slate-400">Rekomendasi akurasi mobile: 50 m</span>
              </div>
            </div>

            <!-- Validation Switch -->
            <div class="pt-2 flex items-center justify-between border-t border-slate-100">
              <div>
                <span class="text-xs font-bold text-slate-800 block">Wajibkan Validasi Geofence</span>
                <span class="text-[11px] text-slate-400 block">Jika aktif, petugas di luar radius tidak dapat mengirim observasi.</span>
              </div>
              <input 
                type="checkbox" 
                [(ngModel)]="geofenceForm.required" 
                name="required"
                class="w-5 h-5 rounded text-navy-800 focus:ring-navy-600 border-slate-300"
              />
            </div>

            <div class="pt-4 flex justify-end">
              <button 
                type="submit" 
                [disabled]="isSaving()"
                class="bg-navy-800 text-white text-xs font-bold px-6 py-3 rounded-xl hover:bg-navy-900 shadow-sm disabled:opacity-50"
              >
                @if (isSaving()) {
                  <span>Menyimpan...</span>
                } @else {
                  <span>Simpan Perubahan Geofence</span>
                }
              </button>
            </div>
          </form>
        </div>
      }

      <!-- TAB 2: AREA PROYEK -->
      @if (activeTab === 'areas') {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs h-fit">
            <h3 class="text-sm font-bold text-slate-900 mb-3">+ Tambah Area Baru</h3>
            <div class="space-y-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Nama Area</label>
                <input 
                  type="text" 
                  [(ngModel)]="newAreaName" 
                  placeholder="Misal: Warehouse A, Bengkel Fabrikasi"
                  class="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-navy-600 focus:outline-none"
                />
              </div>
              <button 
                (click)="addArea()"
                [disabled]="!newAreaName.trim()"
                class="w-full bg-navy-800 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-navy-900 disabled:opacity-50"
              >
                Simpan Area
              </button>
            </div>
          </div>

          <div class="md:col-span-2 space-y-3">
            @for (area of projectService.activeAreas(); track area.id) {
              <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
                <div>
                  <h4 class="text-xs font-bold text-slate-900">{{ area.name }}</h4>
                  <span class="text-[10px] text-slate-400">ID: {{ area.id }}</span>
                </div>
                <div class="flex items-center gap-3">
                  <button 
                    (click)="generateAreaQr(area)"
                    class="text-[11px] font-bold text-navy-800 bg-navy-50 hover:bg-navy-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                    Cetak QR Area
                  </button>
                  <span class="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                    Aktif
                  </span>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- TAB 3: ITEM HSE & KATEGORI -->
      @if (activeTab === 'items') {
        <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-base font-bold text-navy-950">Item Perilaku & Kategori Kepatuhan</h3>
              <p class="text-xs text-slate-500">Kategori Wajib mengunci tombol Kirim jika belum dinilai. Menurunkan Wajib ke Medium wajib menyertakan alasan.</p>
            </div>
          </div>

          <div class="divide-y divide-slate-100">
            @for (item of projectService.activeItems(); track item.id) {
              <div class="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div class="max-w-lg">
                  <div class="flex items-center gap-2 mb-1">
                    <span 
                      [ngClass]="item.category === 'wajib' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'"
                      class="text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase"
                    >
                      {{ item.category }}
                    </span>
                    <h4 class="text-xs font-bold text-slate-900">{{ item.title }}</h4>
                  </div>
                  <p class="text-xs text-slate-500">{{ item.description }}</p>
                </div>

                <div class="flex items-center gap-2 flex-shrink-0">
                  <select 
                    [ngModel]="item.category"
                    (ngModelChange)="onCategoryChange(item, $event)"
                    class="rounded-xl border border-slate-300 py-1.5 px-3 text-xs font-semibold focus:border-navy-600 focus:outline-none"
                  >
                    <option value="wajib">Wajib</option>
                    <option value="medium">Medium</option>
                  </select>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- TAB 4: PENGGUNA & ROLE -->
      @if (activeTab === 'members') {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs h-fit">
            <h3 class="text-sm font-bold text-slate-900 mb-3">+ Tugaskan Pengguna</h3>
            <div class="space-y-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Email Pengguna</label>
                <input 
                  type="email" 
                  [(ngModel)]="newMemberEmail" 
                  placeholder="user@perusahaan.com"
                  class="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-navy-600 focus:outline-none"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Peran (Role)</label>
                <select 
                  [(ngModel)]="newMemberRole"
                  class="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-navy-600 focus:outline-none"
                >
                  <option value="petugas">Petugas (Pengisi Observasi)</option>
                  <option value="supervisor">Supervisor (Verifikator)</option>
                  <option value="admin">Admin Proyek</option>
                </select>
              </div>
              <button 
                (click)="assignMember()"
                [disabled]="!newMemberEmail.trim()"
                class="w-full bg-navy-800 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-navy-900 disabled:opacity-50"
              >
                Tugaskan ke Proyek
              </button>
            </div>
          </div>

          <div class="md:col-span-2 space-y-3">
            @for (m of members(); track m.uid) {
              <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
                <div>
                  <h4 class="text-xs font-bold text-slate-900">{{ m.name || m.email || m.uid }}</h4>
                  <span class="text-[10px] text-slate-400 block">{{ m.email }}</span>
                </div>
                <span class="bg-navy-50 text-navy-800 text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                  {{ m.role }}
                </span>
              </div>
            }
          </div>
        </div>
      }

      <!-- Modal Downgrade Reason -->
      @if (downgradeModalItem()) {
        <div class="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 class="text-sm font-bold text-navy-950 mb-1">Alasan Penurunan Kategori Wajib ke Medium</h3>
            <p class="text-xs text-slate-500 mb-4">Setiap penurunan kategori item dicatat dalam Audit Log untuk kepatuhan HSE.</p>
            <textarea 
              [(ngModel)]="downgradeReason"
              rows="3"
              placeholder="Jelaskan alasan pembenaran HSE..."
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

      <!-- Modal Create Project -->
      @if (showCreateProjectModal()) {
        <div class="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 class="text-sm font-bold text-navy-950 mb-1">Buat Proyek Baru</h3>
            <div class="space-y-3 mb-6">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Nama Proyek</label>
                <input 
                  type="text" 
                  [(ngModel)]="newProjectForm.name" 
                  placeholder="Misal: Proyek Warehouse Cikarang"
                  class="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-navy-600 focus:outline-none"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Kode Proyek</label>
                <input 
                  type="text" 
                  [(ngModel)]="newProjectForm.code" 
                  placeholder="Misal: WH-CKR"
                  class="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-navy-600 focus:outline-none uppercase"
                />
              </div>
            </div>
            <div class="flex justify-end gap-2">
              <button 
                (click)="showCreateProjectModal.set(false)"
                class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button 
                (click)="createProject()"
                [disabled]="!newProjectForm.name.trim() || !newProjectForm.code.trim()"
                class="px-4 py-2 text-xs font-bold text-white bg-navy-800 hover:bg-navy-900 rounded-xl disabled:opacity-50"
              >
                Buat Proyek
              </button>
            </div>
          </div>
        </div>
      }

      <!-- QR Area Modal -->
      @if (qrModalData(); as qrd) {
        <div class="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl">
            <span class="text-[10px] font-extrabold text-navy-800 uppercase tracking-widest block mb-1">QR Code Lokasi Area</span>
            <h3 class="text-base font-bold text-navy-950 mb-1">{{ qrd.areaName }}</h3>
            <p class="text-[11px] text-slate-400 mb-4">Cetak dan tempel di pintu masuk area untuk scan verifikasi petugas.</p>
            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 inline-block mb-4">
              <img [src]="qrd.dataUrl" alt="QR Code" class="w-48 h-48 mx-auto" />
            </div>
            <div class="flex justify-center gap-2">
              <button 
                (click)="qrModalData.set(null)"
                class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Tutup
              </button>
              <button 
                (click)="printQrCode()"
                class="px-4 py-2 text-xs font-bold text-white bg-navy-800 hover:bg-navy-900 rounded-xl shadow-xs"
              >
                Cetak / Print
              </button>
            </div>
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

  activeTab: 'geofence' | 'areas' | 'items' | 'members' = 'geofence';
  isSaving = signal<boolean>(false);
  members = signal<ProjectMember[]>([]);

  geofenceForm = {
    lat: -6.2088,
    lng: 106.8456,
    radiusM: 200,
    maxAccuracyM: 50,
    required: true,
  };

  newAreaName = '';
  newMemberEmail = '';
  newMemberRole: 'petugas' | 'supervisor' | 'admin' = 'petugas';

  showCreateProjectModal = signal<boolean>(false);
  newProjectForm = { name: '', code: '' };

  downgradeModalItem = signal<ProjectItem | null>(null);
  downgradeReason = '';
  qrModalData = signal<{ areaName: string; dataUrl: string } | null>(null);

  async generateAreaQr(area: ProjectArea): Promise<void> {
    const proj = this.auth.activeProject();
    const qrContent = `BBS-AREA:${proj?.id || 'PROJ'}:${area.id}`;
    try {
      const dataUrl = await QRCode.toDataURL(qrContent, { width: 300, margin: 2 });
      this.qrModalData.set({ areaName: area.name, dataUrl });
    } catch {
      alert('Gagal membuat QR Code');
    }
  }

  printQrCode(): void {
    window.print();
  }

  async ngOnInit(): Promise<void> {
    await this.projectService.loadProjects();
    this.populateGeofenceForm();
    await this.loadMembers();
  }

  populateGeofenceForm(): void {
    const proj = this.auth.activeProject();
    if (proj?.geofence) {
      this.geofenceForm = { ...proj.geofence };
    }
  }

  async onSelectProject(projectId: string): Promise<void> {
    const found = this.projectService.projects().find((p) => p.id === projectId);
    if (found) {
      this.auth.setActiveProject(found, 'admin');
      this.populateGeofenceForm();
      await this.projectService.loadProjectDetails(found.id);
      await this.loadMembers();
    }
  }

  async useCurrentLocationAsCenter(): Promise<void> {
    try {
      const pos = await this.geo.getCurrentLocation();
      this.geofenceForm.lat = pos.lat;
      this.geofenceForm.lng = pos.lng;
      alert(`Koordinat diperbarui ke: ${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`);
    } catch (err: unknown) {
      alert('Gagal mengambil GPS: ' + (err instanceof Error ? err.message : String(err)));
    }
  }

  async saveGeofenceSettings(): Promise<void> {
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
          geofence: this.geofenceForm,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menyimpan');
      }

      alert('✅ Pengaturan Geofence berhasil disimpan!');
      proj.geofence = { ...this.geofenceForm };
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      this.isSaving.set(false);
    }
  }

  async addArea(): Promise<void> {
    const proj = this.auth.activeProject();
    if (!proj || !this.newAreaName.trim()) return;

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
        this.newAreaName = '';
        await this.projectService.loadProjectDetails(proj.id);
      }
    } catch (err) {
      alert('Gagal menambah area');
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
        alert('✅ Kategori item diperbarui.');
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal mengubah kategori');
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi');
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

  async assignMember(): Promise<void> {
    const proj = this.auth.activeProject();
    if (!proj || !this.newMemberEmail.trim()) return;

    const token = await this.auth.getIdToken();
    try {
      const res = await fetch('/api/admin/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: proj.id,
          targetEmail: this.newMemberEmail.trim(),
          role: this.newMemberRole,
        }),
      });

      if (res.ok) {
        this.newMemberEmail = '';
        await this.loadMembers();
        alert('✅ Anggota berhasil ditugaskan ke proyek.');
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal menugaskan anggota');
      }
    } catch {
      alert('Terjadi kesalahan koneksi');
    }
  }

  async createProject(): Promise<void> {
    try {
      await this.projectService.createInitialProject(
        this.newProjectForm.name.trim(),
        this.newProjectForm.code.trim()
      );
      this.showCreateProjectModal.set(false);
      this.newProjectForm = { name: '', code: '' };
      alert('✅ Proyek baru berhasil dibuat!');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal membuat proyek');
    }
  }
}
