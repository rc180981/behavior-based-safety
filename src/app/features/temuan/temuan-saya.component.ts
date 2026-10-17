import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { FindingService } from '../../core/services/finding.service';
import { StorageService } from '../../core/services/storage.service';
import { Finding } from '../../core/models/bbs.models';

@Component({
  selector: 'app-temuan-saya',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-6 pb-28">
      
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-xl font-bold text-navy-950">Temuan Saya (PIC)</h2>
          <p class="text-xs text-slate-500">Tindak lanjuti temuan yang ditugaskan kepada Anda dan unggah bukti perbaikan.</p>
        </div>
        <span class="bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">
          {{ openCount() }} Open
        </span>
      </div>

      <!-- Filter Tabs -->
      <div class="flex border-b border-slate-200 mb-6 gap-6 text-xs font-bold">
        <button 
          (click)="selectedTab = 'open'"
          [ngClass]="selectedTab === 'open' ? 'border-b-2 border-navy-900 text-navy-950 pb-3' : 'text-slate-500 hover:text-slate-800 pb-3'"
        >
          Open ({{ openCount() }})
        </button>
        <button 
          (click)="selectedTab = 'waiting_verification'"
          [ngClass]="selectedTab === 'waiting_verification' ? 'border-b-2 border-navy-900 text-navy-950 pb-3' : 'text-slate-500 hover:text-slate-800 pb-3'"
        >
          Menunggu Verifikasi ({{ waitingCount() }})
        </button>
        <button 
          (click)="selectedTab = 'closed'"
          [ngClass]="selectedTab === 'closed' ? 'border-b-2 border-navy-900 text-navy-950 pb-3' : 'text-slate-500 hover:text-slate-800 pb-3'"
        >
          Selesai / Closed ({{ closedCount() }})
        </button>
      </div>

      <!-- Loading State -->
      @if (findingService.isLoading()) {
        <div class="py-12 text-center text-slate-400">
          <span class="inline-block animate-spin text-2xl mb-2">⟳</span>
          <p class="text-xs">Memuat daftar temuan...</p>
        </div>
      } @else if (filteredFindings().length === 0) {
        <div class="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
          <div class="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
          </div>
          <h3 class="text-sm font-bold text-slate-800 mb-1">Tidak Ada Temuan di Kategori Ini</h3>
          <p class="text-xs text-slate-500">Semua tugas tindak lanjut dalam kondisi bersih.</p>
        </div>
      } @else {
        <!-- Findings Cards List -->
        <div class="space-y-4">
          @for (f of filteredFindings(); track f.id) {
            <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 transition-all">
              
              <!-- Badges Header -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  @if (f.isOverdue) {
                    <span class="bg-red-100 text-red-700 border border-red-200 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
                      Overdue
                    </span>
                  } @else if (f.status === 'open') {
                    <span class="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Sisa {{ f.remainingDays }} Hari
                    </span>
                  } @else if (f.status === 'waiting_verification') {
                    <span class="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      Menunggu Verifikasi
                    </span>
                  } @else {
                    <span class="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      Closed
                    </span>
                  }

                  <span 
                    [ngClass]="f.risk === 'tinggi' ? 'bg-red-50 text-red-700' : (f.risk === 'sedang' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-700')"
                    class="text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase"
                  >
                    Risiko {{ f.risk }}
                  </span>
                </div>

                <span class="text-xs text-slate-400 font-medium">
                  Target: {{ f.dueDate }}
                </span>
              </div>

              <!-- Finding Description -->
              <div>
                <h3 class="font-bold text-slate-900 text-sm leading-snug">
                  {{ f.note }}
                </h3>
                <p class="text-xs text-slate-500 mt-1">
                  Kategori: <strong class="text-slate-700">{{ f.category }}</strong> · Area: <strong class="text-slate-700">{{ f.areaId }}</strong>
                </p>
              </div>

              <!-- Evidence Before Photos Thumbnail -->
              @if (f.photosBefore && f.photosBefore.length > 0) {
                <div>
                  <span class="text-[11px] font-bold text-slate-600 block mb-1.5">Foto Bukti Temuan (Sebelum):</span>
                  <div class="flex gap-2 overflow-x-auto pb-1">
                    @for (photo of f.photosBefore; track photo) {
                      <img [src]="photo" alt="Bukti Sebelum" class="w-16 h-16 rounded-xl object-cover border border-slate-200 flex-shrink-0" />
                    }
                  </div>
                </div>
              }

              <!-- Evidence After Photos (If already submitted) -->
              @if (f.photosAfter && f.photosAfter.length > 0) {
                <div>
                  <span class="text-[11px] font-bold text-emerald-700 block mb-1.5">Foto Bukti Perbaikan (Sesudah):</span>
                  <div class="flex gap-2 overflow-x-auto pb-1">
                    @for (photo of f.photosAfter; track photo) {
                      <img [src]="photo" alt="Bukti Sesudah" class="w-16 h-16 rounded-xl object-cover border border-emerald-200 flex-shrink-0" />
                    }
                  </div>
                </div>
              }

              <!-- Action Buttons -->
              <div class="pt-2 flex items-center justify-between border-t border-slate-100">
                <a [routerLink]="['/temuan', f.id]" class="text-xs text-navy-800 font-bold hover:underline">
                  Lihat Detail & Riwayat →
                </a>

                @if (f.status === 'open') {
                  <button 
                    (click)="openFollowUpModal(f)"
                    class="bg-navy-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-navy-900 shadow-xs"
                  >
                    Tindak Lanjut & Unggah Bukti
                  </button>
                }
              </div>

            </div>
          }
        </div>
      }

      <!-- Follow-Up Modal -->
      @if (activeFollowUpFinding()) {
        <div class="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 class="text-base font-bold text-navy-950 mb-1">Tindak Lanjut Perbaikan</h3>
            <p class="text-xs text-slate-500 mb-4">Unggah bukti foto kondisi sesudah perbaikan dan catatan tindakan korektif.</p>

            <!-- Photo Upload Sesudah -->
            <div class="mb-4">
              <label class="block text-xs font-semibold text-slate-700 mb-2">Foto Bukti Sesudah Perbaikan</label>
              <div class="grid grid-cols-3 gap-2">
                @for (photo of followUpPhotos(); track photo; let idx = $index) {
                  <div class="relative h-24 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                    <img [src]="photo" alt="Bukti Sesudah" class="w-full h-full object-cover" />
                    <button 
                      (click)="removeFollowUpPhoto(idx)"
                      class="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold"
                    >
                      ×
                    </button>
                  </div>
                }

                @if (followUpPhotos().length < 5) {
                  <label class="h-24 rounded-xl border-2 border-dashed border-slate-300 hover:border-navy-600 bg-white flex flex-col items-center justify-center text-slate-500 cursor-pointer">
                    @if (isUploadingPhoto()) {
                      <span class="animate-spin text-sm">⟳</span>
                    } @else {
                      <span class="text-xs font-bold">+ Foto</span>
                    }
                    <input type="file" accept="image/*" (change)="onFollowUpPhotoSelected($event)" class="hidden" [disabled]="isUploadingPhoto()" />
                  </label>
                }
              </div>
            </div>

            <!-- Notes -->
            <div class="mb-6">
              <label class="block text-xs font-semibold text-slate-700 mb-1">Catatan Tindakan Korektif</label>
              <textarea 
                [(ngModel)]="followUpNote"
                rows="3"
                placeholder="Jelaskan tindakan perbaikan yang telah dilakukan..."
                class="w-full rounded-xl border border-slate-300 p-3 text-xs focus:border-navy-600 focus:outline-none"
              ></textarea>
            </div>

            <div class="flex justify-end gap-2">
              <button 
                (click)="activeFollowUpFinding.set(null)"
                class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button 
                (click)="submitFollowUp()"
                [disabled]="isSubmitting() || followUpPhotos().length === 0 || !followUpNote.trim()"
                class="px-5 py-2.5 text-xs font-bold text-white bg-navy-800 hover:bg-navy-900 rounded-xl disabled:opacity-50"
              >
                @if (isSubmitting()) {
                  <span>Mengirim...</span>
                } @else {
                  <span>Kirim Tindak Lanjut</span>
                }
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `
})
export class TemuanSayaComponent implements OnInit {
  auth = inject(AuthService);
  findingService = inject(FindingService);
  storageService = inject(StorageService);

  selectedTab: 'open' | 'waiting_verification' | 'closed' = 'open';
  activeFollowUpFinding = signal<Finding | null>(null);
  followUpPhotos = signal<string[]>([]);
  followUpNote = '';
  isUploadingPhoto = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);

  async ngOnInit(): Promise<void> {
    const proj = this.auth.activeProject();
    if (proj) {
      await this.findingService.loadFindings(proj.id);
    }
  }

  filteredFindings(): Finding[] {
    const list = this.findingService.findings();
    return list.filter((f) => f.status === this.selectedTab);
  }

  openCount(): number {
    return this.findingService.findings().filter((f) => f.status === 'open').length;
  }

  waitingCount(): number {
    return this.findingService.findings().filter((f) => f.status === 'waiting_verification').length;
  }

  closedCount(): number {
    return this.findingService.findings().filter((f) => f.status === 'closed').length;
  }

  openFollowUpModal(f: Finding): void {
    this.activeFollowUpFinding.set(f);
    this.followUpPhotos.set([]);
    this.followUpNote = '';
  }

  async onFollowUpPhotoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0]!;
    const finding = this.activeFollowUpFinding();
    if (!finding) return;

    this.isUploadingPhoto.set(true);
    try {
      const url = await this.storageService.uploadFindingPhoto(finding.projectId, finding.id, file);
      this.followUpPhotos.update((arr) => [...arr, url]);
    } catch (err: unknown) {
      alert('Gagal mengunggah foto: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      this.isUploadingPhoto.set(false);
      input.value = '';
    }
  }

  removeFollowUpPhoto(idx: number): void {
    this.followUpPhotos.update((arr) => arr.filter((_, i) => i !== idx));
  }

  async submitFollowUp(): Promise<void> {
    const finding = this.activeFollowUpFinding();
    if (!finding) return;

    this.isSubmitting.set(true);
    try {
      await this.findingService.submitFollowUp(finding.id, this.followUpPhotos(), this.followUpNote.trim());
      alert('✅ Bukti tindak lanjut berhasil dikirim!');
      this.activeFollowUpFinding.set(null);
      await this.findingService.loadFindings(finding.projectId);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
