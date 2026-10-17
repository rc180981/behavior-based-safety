import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProjectService } from '../../core/services/project.service';
import { GeolocationService } from '../../core/services/geolocation.service';
import { StorageService } from '../../core/services/storage.service';
import { ObservationService } from '../../core/services/observation.service';
import { ProjectItem, FindingRisk } from '../../core/models/bbs.models';

interface AnswerState {
  projectItemId: string;
  itemId: string;
  category: 'wajib' | 'medium';
  standardVersion: number;
  result: 'positif' | 'improvement' | null;
  showStandard: boolean;
  finding?: {
    risk: FindingRisk;
    note: string;
    photosBefore: string[];
    picUid: string;
    dueDate: string;
    isUploadingPhoto?: boolean;
  };
}

@Component({
  selector: 'app-observasi-baru',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-2xl mx-auto px-4 py-6 pb-28">
      
      <!-- Top Title & Project Info -->
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-navy-950">Form Observasi BBS</h2>
          <p class="text-xs text-slate-500">Standar Formulir MCS-01 Digital</p>
        </div>
        <div class="text-right">
          <span class="text-xs text-slate-500 block">{{ currentDateStr }}</span>
          <span class="text-xs font-semibold text-navy-800 block">{{ currentTimeStr }}</span>
        </div>
      </div>

      <!-- Geofence Status Banner -->
      <div 
        [ngClass]="{
          'bg-emerald-50 border-emerald-300 text-emerald-950': geoStatus().valid,
          'bg-amber-50 border-amber-300 text-amber-950': !geoStatus().valid && !geo.errorMessage(),
          'bg-red-50 border-red-300 text-red-950': !!geo.errorMessage()
        }"
        class="border rounded-2xl p-4 mb-6 shadow-sm flex items-center justify-between transition-all"
      >
        <div class="flex items-center gap-3">
          <div 
            [ngClass]="{
              'bg-emerald-600': geoStatus().valid,
              'bg-amber-500': !geoStatus().valid && !geo.errorMessage(),
              'bg-red-500': !!geo.errorMessage()
            }"
            class="w-10 h-10 rounded-xl text-white flex items-center justify-center font-bold flex-shrink-0 shadow-xs"
          >
            @if (geo.isLocating()) {
              <span class="animate-spin text-lg">⟳</span>
            } @else if (geoStatus().valid) {
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            } @else {
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
          </div>
          <div>
            <span class="text-[11px] font-bold uppercase tracking-wider block opacity-75">
              Status Validasi Geofence
            </span>
            <p class="text-xs font-bold leading-snug">
              @if (geo.isLocating()) {
                Mencari sinyal GPS akurasi tinggi...
              } @else if (geoStatus().valid) {
                Lokasi terverifikasi ({{ geoStatus().distanceM }} m dari titik proyek, Akurasi ±{{ Math.round(geoStatus().accuracyM) }} m)
              } @else {
                {{ geoStatus().reason || geo.errorMessage() || 'Lokasi berada di luar radius proyek' }}
              }
            </p>
          </div>
        </div>

        <button 
          (click)="refreshLocation()"
          [disabled]="geo.isLocating()"
          class="text-xs bg-white text-slate-800 border border-slate-300 font-bold px-3 py-2 rounded-xl shadow-xs hover:bg-slate-50 transition-colors flex-shrink-0 disabled:opacity-50"
        >
          Cek Ulang
        </button>
      </div>

      <!-- Area Selection -->
      <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-6">
        <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
          Area Proyek
        </label>
        <select 
          [(ngModel)]="selectedAreaId"
          (change)="onAreaChange()"
          class="w-full rounded-xl border border-slate-300 py-3 px-3 text-sm font-semibold focus:border-navy-600 focus:outline-none bg-slate-50"
        >
          <option value="" disabled>-- Pilih Area Observasi --</option>
          @for (area of projectService.activeAreas(); track area.id) {
            <option [value]="area.id">{{ area.name }}</option>
          }
          @if (projectService.activeAreas().length === 0) {
            <option value="default-area">Area Operasional Utama (Default)</option>
          }
        </select>
      </div>

      <!-- Locked Warning if Outside Geofence -->
      @if (!geoStatus().valid && isGeofenceRequired()) {
        <div class="bg-red-50 border-2 border-red-300 rounded-2xl p-6 text-center mb-8 shadow-sm">
          <div class="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-8a4 4 0 10-8 0v4h8V7z" />
            </svg>
          </div>
          <h3 class="text-base font-bold text-red-950 mb-1">Form Observasi Terkunci</h3>
          <p class="text-xs text-red-700 max-w-md mx-auto mb-4">
            Anda terdeteksi di luar radius lokasi proyek yang ditentukan. Sistem tidak mengizinkan pengisian form di luar geofence tanpa kehadiran langsung di area proyek.
          </p>
          <button 
            (click)="refreshLocation()"
            class="px-5 py-2.5 bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-red-800"
          >
            Cek Lokasi Ulang Sekarang
          </button>
        </div>
      }

      <!-- Items Section (Disabled/Locked if Geofence invalid and required) -->
      <div [class.opacity-40]="!geoStatus().valid && isGeofenceRequired()" [class.pointer-events-none]="!geoStatus().valid && isGeofenceRequired()">
        <div class="flex items-center justify-between mb-3 px-1">
          <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Daftar Perilaku BBS ({{ answers.length }} Item)
          </h3>
          <span class="text-xs text-slate-500 font-medium">
            {{ answeredRequiredCount() }}/{{ totalRequiredCount() }} Wajib Terjawab
          </span>
        </div>

        <div class="space-y-5">
          @for (ans of answers; track ans.projectItemId; let idx = $index) {
            <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm transition-all">
              
              <!-- Title & Category Badge -->
              <div class="flex items-start justify-between gap-3 mb-2">
                <h4 class="font-bold text-slate-900 text-sm leading-snug">
                  {{ getItemTitle(ans.projectItemId) }}
                </h4>
                @if (ans.category === 'wajib') {
                  <span class="bg-red-100 text-red-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase flex-shrink-0">
                    Wajib
                  </span>
                } @else {
                  <span class="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase flex-shrink-0">
                    Medium
                  </span>
                }
              </div>

              <!-- Standard Description & Toggle -->
              <p class="text-xs text-slate-500 mb-3">
                {{ getItemDescription(ans.projectItemId) }}
              </p>

              <div class="mb-4">
                <button 
                  type="button"
                  (click)="ans.showStandard = !ans.showStandard"
                  class="text-[11px] font-semibold text-navy-700 hover:text-navy-900 flex items-center gap-1.5 transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>{{ ans.showStandard ? 'Sembunyikan Standar Kartu' : 'Lihat Standar Kartu' }}</span>
                </button>

                <!-- Standard Card Preview Drawer -->
                @if (ans.showStandard) {
                  <div class="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div class="text-xs font-bold text-slate-800 mb-2">Kartu Standar Keselamatan (Versi {{ ans.standardVersion }})</div>
                    <div 
                      (click)="zoomImage(getItemImagePath(ans.projectItemId))"
                      class="relative rounded-lg overflow-hidden bg-slate-200 cursor-pointer group max-h-48 flex items-center justify-center"
                    >
                      <img 
                        [src]="getItemImagePath(ans.projectItemId)" 
                        alt="Standar Kartu"
                        class="w-full object-cover group-hover:scale-105 transition-transform"
                        (error)="onImageError($event)"
                      />
                      <div class="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold">
                        Ketuk untuk memperbesar
                      </div>
                    </div>
                  </div>
                }
              </div>

              <!-- Rating Action Buttons -->
              <div class="grid grid-cols-2 gap-3 mb-2">
                <button
                  type="button"
                  (click)="setAnswer(ans, 'positif')"
                  [ngClass]="{
                    'bg-emerald-600 text-white font-bold border-emerald-600 shadow-sm': ans.result === 'positif',
                    'bg-white text-slate-700 border-slate-300 hover:border-emerald-500': ans.result !== 'positif'
                  }"
                  class="py-3 px-4 rounded-xl border-2 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Positif
                </button>

                <button
                  type="button"
                  (click)="setAnswer(ans, 'improvement')"
                  [ngClass]="{
                    'bg-amber-600 text-white font-bold border-amber-600 shadow-sm': ans.result === 'improvement',
                    'bg-white text-slate-700 border-slate-300 hover:border-amber-500': ans.result !== 'improvement'
                  }"
                  class="py-3 px-4 rounded-xl border-2 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Perlu Improvement
                </button>
              </div>

              <!-- Evidence Section (Opens automatically on "Perlu Improvement") -->
              @if (ans.result === 'improvement' && ans.finding) {
                <div class="mt-4 pt-4 border-t border-amber-100 bg-amber-50/50 -mx-5 -mb-5 p-5 rounded-b-2xl space-y-4">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-amber-900 uppercase tracking-wide">
                      Evidence & Detail Temuan
                    </span>
                    <span class="text-[10px] text-amber-700 font-semibold bg-amber-100 px-2 py-0.5 rounded-md">
                      Wajib Foto Bukti
                    </span>
                  </div>

                  <!-- Photo Upload (Max 5) -->
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-2">
                      Foto Evidence Sebelum Perbaikan (Maksimal 5)
                    </label>
                    <div class="grid grid-cols-3 gap-2">
                      @for (photo of ans.finding.photosBefore; track photo; let pIdx = $index) {
                        <div class="relative h-24 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group">
                          <img [src]="photo" alt="Bukti" class="w-full h-full object-cover" />
                          <button
                            type="button"
                            (click)="removePhoto(ans, pIdx)"
                            class="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md hover:bg-red-700"
                          >
                            ×
                          </button>
                        </div>
                      }

                      @if (ans.finding.photosBefore.length < 5) {
                        <label class="h-24 rounded-xl border-2 border-dashed border-slate-300 hover:border-navy-600 bg-white flex flex-col items-center justify-center text-slate-500 cursor-pointer transition-colors">
                          @if (ans.finding.isUploadingPhoto) {
                            <span class="animate-spin text-sm">⟳</span>
                            <span class="text-[10px] mt-1 font-semibold">Kompresi...</span>
                          } @else {
                            <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span class="text-[10px] font-bold mt-1 text-slate-600">Ambil Foto</span>
                          }
                          <input 
                            type="file" 
                            accept="image/*" 
                            capture="environment"
                            (change)="onPhotoSelected($event, ans)" 
                            class="hidden" 
                            [disabled]="ans.finding.isUploadingPhoto"
                          />
                        </label>
                      }
                    </div>
                  </div>

                  <!-- Risk Level Selection -->
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1.5">Tingkat Risiko</label>
                    <div class="grid grid-cols-3 gap-2">
                      @for (risk of ['rendah', 'sedang', 'tinggi']; track risk) {
                        <button
                          type="button"
                          (click)="ans.finding.risk = $any(risk)"
                          [ngClass]="{
                            'bg-slate-800 text-white font-bold': ans.finding.risk === risk,
                            'bg-white text-slate-700 border border-slate-300': ans.finding.risk !== risk
                          }"
                          class="py-2 text-xs rounded-lg capitalize font-medium transition-colors"
                        >
                          {{ risk }}
                        </button>
                      }
                    </div>
                  </div>

                  <!-- Notes -->
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">Catatan Temuan</label>
                    <textarea
                      [(ngModel)]="ans.finding.note"
                      rows="2"
                      placeholder="Jelaskan kondisi atau perilaku tidak aman yang teramati..."
                      class="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-navy-600 focus:outline-none bg-white"
                    ></textarea>
                  </div>

                  <!-- PIC & Due Date -->
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block text-xs font-semibold text-slate-700 mb-1">PIC Tindak Lanjut</label>
                      <input
                        type="text"
                        [(ngModel)]="ans.finding.picUid"
                        placeholder="Nama/NIK PIC"
                        class="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-navy-600 focus:outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-slate-700 mb-1">Target Selesai</label>
                      <input
                        type="date"
                        [(ngModel)]="ans.finding.dueDate"
                        class="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-navy-600 focus:outline-none bg-white"
                      />
                    </div>
                  </div>

                </div>
              }

            </div>
          }
        </div>

        <!-- Submit Button Section -->
        <div class="mt-8">
          @if (submitErrorMessage()) {
            <div class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <span>⚠️ {{ submitErrorMessage() }}</span>
            </div>
          }

          <button
            type="button"
            (click)="onSubmit()"
            [disabled]="isSubmitDisabled()"
            [ngClass]="{
              'bg-navy-800 text-white hover:bg-navy-900 shadow-md cursor-pointer': !isSubmitDisabled(),
              'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none': isSubmitDisabled()
            }"
            class="w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2"
          >
            @if (observationService.isLoading()) {
              <span class="animate-spin text-lg">⟳</span>
              <span>Memverifikasi & Menyimpan...</span>
            } @else if (!areAllWajibAnswered()) {
              <span>Kirim Observasi (Jawab Semua Item Wajib Terlebih Dahulu)</span>
            } @else {
              <span>Kirim Observasi BBS</span>
            }
          </button>
        </div>
      </div>

      <!-- Zoom Image Modal -->
      @if (zoomedImage()) {
        <div 
          (click)="zoomedImage.set(null)"
          class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs cursor-zoom-out"
        >
          <div class="max-w-xl max-h-[85vh] bg-white rounded-2xl overflow-hidden p-2 shadow-2xl">
            <img [src]="zoomedImage()" alt="Zoomed Standard" class="max-h-[80vh] w-auto mx-auto object-contain rounded-xl" />
          </div>
        </div>
      }

    </div>
  `
})
export class ObservasiBaruComponent implements OnInit {
  auth = inject(AuthService);
  projectService = inject(ProjectService);
  geo = inject(GeolocationService);
  storageService = inject(StorageService);
  observationService = inject(ObservationService);
  router = inject(Router);

  Math = Math;
  selectedAreaId = '';
  answers: AnswerState[] = [];
  zoomedImage = signal<string | null>(null);
  submitErrorMessage = signal<string | null>(null);

  currentDateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  currentTimeStr = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Evaluated geofence status
  geoStatus = computed(() => {
    const proj = this.auth.activeProject();
    return this.geo.isWithinGeofence(proj?.geofence);
  });

  totalRequiredCount = computed(() => {
    return this.answers.filter((a) => a.category === 'wajib').length;
  });

  answeredRequiredCount = computed(() => {
    return this.answers.filter((a) => a.category === 'wajib' && a.result !== null).length;
  });

  areAllWajibAnswered = computed(() => {
    const required = this.answers.filter((a) => a.category === 'wajib');
    return required.length > 0 && required.every((a) => a.result !== null);
  });

  isSubmitDisabled(): boolean {
    if (this.observationService.isLoading()) return true;
    if (this.isGeofenceRequired() && !this.geoStatus().valid) return true;
    return !this.areAllWajibAnswered();
  }

  isGeofenceRequired(): boolean {
    const proj = this.auth.activeProject();
    return proj?.geofence?.required !== false;
  }

  async ngOnInit(): Promise<void> {
    await this.refreshLocation();
    await this.loadProjectAndItems();
  }

  async refreshLocation(): Promise<void> {
    try {
      await this.geo.getCurrentLocation();
    } catch {
      // Handled in service signal
    }
  }

  async loadProjectAndItems(): Promise<void> {
    // If no active project, load projects
    let proj = this.auth.activeProject();
    if (!proj) {
      const list = await this.projectService.loadProjects();
      if (list.length > 0) {
        proj = list[0]!;
      }
    }

    if (proj) {
      await this.projectService.loadProjectDetails(proj.id);
      this.initAnswersFromProjectItems();
    } else {
      // Mock fallback initial 3 behaviors if no backend project yet
      this.initFallbackAnswers();
    }
  }

  onAreaChange(): void {
    // Optionally filter items per area
  }

  initAnswersFromProjectItems(): void {
    const items = this.projectService.activeItems();
    if (items.length === 0) {
      this.initFallbackAnswers();
      return;
    }

    // Auto-open standard card for the first 5 observations
    const obsCount = parseInt(localStorage.getItem('bbs_observation_count') || '0', 10);
    const autoOpen = obsCount < 5;

    this.answers = items.map((item) => ({
      projectItemId: item.id,
      itemId: item.itemId,
      category: item.category,
      standardVersion: item.standardVersion || 1,
      result: null,
      showStandard: autoOpen,
    }));
  }

  initFallbackAnswers(): void {
    const obsCount = parseInt(localStorage.getItem('bbs_observation_count') || '0', 10);
    const autoOpen = obsCount < 5;

    this.answers = [
      {
        projectItemId: 'item-1',
        itemId: 'master-1',
        category: 'wajib',
        standardVersion: 1,
        result: null,
        showStandard: autoOpen,
      },
      {
        projectItemId: 'item-2',
        itemId: 'master-2',
        category: 'wajib',
        standardVersion: 1,
        result: null,
        showStandard: autoOpen,
      },
      {
        projectItemId: 'item-3',
        itemId: 'master-3',
        category: 'medium',
        standardVersion: 1,
        result: null,
        showStandard: autoOpen,
      },
    ];
  }

  getItemTitle(projectItemId: string): string {
    const found = this.projectService.activeItems().find((i) => i.id === projectItemId);
    if (found?.title) return found.title;

    switch (projectItemId) {
      case 'item-1':
        return 'Memasuki area warehouse memakai APD: helm dan safety vest';
      case 'item-2':
        return 'Berjalan pada jalur pejalan kaki yang tersedia';
      case 'item-3':
        return 'Tidak menggunakan handphone saat berjalan kaki';
      default:
        return 'Perilaku Keselamatan Kerja BBS';
    }
  }

  getItemDescription(projectItemId: string): string {
    const found = this.projectService.activeItems().find((i) => i.id === projectItemId);
    if (found?.description) return found.description;

    switch (projectItemId) {
      case 'item-1':
        return 'Wajib helm standar dengan tali dagu terpasang dan safety vest reflektif.';
      case 'item-2':
        return 'Berjalan di dalam garis batas pedestrian walkway, hindari lintasan forklift.';
      case 'item-3':
        return 'Fokus pada lingkungan sekitar dan dilarang menatap layar ponsel saat melangkah.';
      default:
        return 'Pastikan kepatuhan terhadap standar HSE.';
    }
  }

  getItemImagePath(projectItemId: string): string {
    return 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=600&q=80';
  }

  setAnswer(ans: AnswerState, result: 'positif' | 'improvement'): void {
    ans.result = result;
    if (result === 'improvement' && !ans.finding) {
      const defaultDays = ans.category === 'wajib' ? 3 : 7;
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + defaultDays);

      ans.finding = {
        risk: 'sedang',
        note: '',
        photosBefore: [],
        picUid: '',
        dueDate: targetDate.toISOString().split('T')[0]!,
      };
    }
  }

  async onPhotoSelected(event: Event, ans: AnswerState): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0 || !ans.finding) return;

    const file = input.files[0]!;
    ans.finding.isUploadingPhoto = true;

    try {
      const projId = this.auth.activeProject()?.id || 'default-proj';
      const tempFindingId = 'temp-' + Date.now();
      const photoUrl = await this.storageService.uploadFindingPhoto(projId, tempFindingId, file);
      ans.finding.photosBefore.push(photoUrl);
    } catch (err: unknown) {
      alert('Gagal mengunggah foto: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      ans.finding.isUploadingPhoto = false;
      input.value = '';
    }
  }

  removePhoto(ans: AnswerState, photoIndex: number): void {
    ans.finding?.photosBefore.splice(photoIndex, 1);
  }

  zoomImage(url: string): void {
    this.zoomedImage.set(url);
  }

  onImageError(event: Event): void {
    const el = event.target as HTMLImageElement;
    el.src = 'https://placehold.co/600x400?text=Kartu+Standar+BBS';
  }

  async onSubmit(): Promise<void> {
    this.submitErrorMessage.set(null);

    // Final client validations
    for (const ans of this.answers) {
      if (ans.category === 'wajib' && !ans.result) {
        this.submitErrorMessage.set('Semua item Wajib harus dinilai terlebih dahulu.');
        return;
      }
      if (ans.result === 'improvement') {
        if (!ans.finding?.photosBefore || ans.finding.photosBefore.length === 0) {
          this.submitErrorMessage.set('Temuan "Perlu Improvement" wajib menyertakan minimal 1 foto bukti.');
          return;
        }
        if (!ans.finding.picUid || !ans.finding.dueDate) {
          this.submitErrorMessage.set('Silakan lengkapi PIC dan Target Selesai pada temuan.');
          return;
        }
      }
    }

    const pos = this.geo.currentPosition() || { lat: -6.2088, lng: 106.8456, accuracyM: 10 };
    const projId = this.auth.activeProject()?.id || 'bbs-proj-1';
    const areaId = this.selectedAreaId || 'general-area';

    try {
      const payloadAnswers = this.answers
        .filter((a) => a.result !== null)
        .map((a) => ({
          projectItemId: a.projectItemId,
          itemId: a.itemId,
          category: a.category,
          standardVersion: a.standardVersion,
          result: a.result!,
          finding: a.result === 'improvement' ? a.finding : undefined,
        }));

      await this.observationService.submitObservation({
        projectId: projId,
        areaId,
        loc: {
          lat: pos.lat,
          lng: pos.lng,
          accuracyM: pos.accuracyM,
        },
        answers: payloadAnswers,
      });

      alert('✅ Observasi BBS berhasil dikirim dan diverifikasi!');
      this.router.navigate(['/observasi/riwayat']);
    } catch (err: unknown) {
      this.submitErrorMessage.set(err instanceof Error ? err.message : String(err));
    }
  }
}
