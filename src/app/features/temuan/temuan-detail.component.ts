import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { FindingService } from '../../core/services/finding.service';
import { Finding } from '../../core/models/bbs.models';

@Component({
  selector: 'app-temuan-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-6 pb-28">
      
      <!-- Back Header -->
      <div class="mb-6 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <a routerLink="/temuan" class="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
            ←
          </a>
          <div>
            <h1 class="text-xl font-bold text-navy-950">Detail Temuan</h1>
            <span class="text-xs text-slate-400">ID: {{ finding()?.id }}</span>
          </div>
        </div>

        @if (finding(); as f) {
          <div class="flex items-center gap-2">
            @if (f.isOverdue) {
              <span class="bg-red-100 text-red-700 text-xs font-black px-3 py-1 rounded-full uppercase">
                Overdue
              </span>
            }
            <span 
              [ngClass]="{
                'bg-amber-100 text-amber-800': f.status === 'open',
                'bg-blue-100 text-blue-800': f.status === 'waiting_verification',
                'bg-emerald-100 text-emerald-800': f.status === 'closed'
              }"
              class="text-xs font-extrabold px-3 py-1 rounded-full uppercase"
            >
              {{ f.status.replace('_', ' ') }}
            </span>
          </div>
        }
      </div>

      @if (isLoading()) {
        <div class="py-16 text-center text-slate-400">
          <span class="inline-block animate-spin text-3xl mb-2">⟳</span>
          <p class="text-xs">Memuat data temuan...</p>
        </div>
      } @else {
        @if (finding(); as f) {
          <div class="space-y-6">
          
          <!-- Before & After Photos Card (Mockup 13) -->
          <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 class="text-sm font-bold text-navy-950 mb-4 uppercase tracking-wider">Komparasi Foto Evidence</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Before Section -->
              <div class="space-y-2">
                <span class="text-xs font-bold text-red-700 flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-red-600"></span>
                  Sebelum Perbaikan (Evidence Temuan)
                </span>
                <div class="grid grid-cols-2 gap-2">
                  @for (photo of f.photosBefore; track photo) {
                    <img [src]="photo" alt="Sebelum" class="h-36 w-full object-cover rounded-xl border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity" (click)="zoomedPhoto.set(photo)" />
                  }
                  @if (f.photosBefore.length === 0) {
                    <div class="h-36 col-span-2 rounded-xl bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                      Tidak ada foto
                    </div>
                  }
                </div>
              </div>

              <!-- After Section -->
              <div class="space-y-2">
                <span class="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-emerald-600"></span>
                  Sesudah Perbaikan (Bukti PIC)
                </span>
                <div class="grid grid-cols-2 gap-2">
                  @for (photo of f.photosAfter; track photo) {
                    <img [src]="photo" alt="Sesudah" class="h-36 w-full object-cover rounded-xl border border-emerald-200 cursor-pointer hover:opacity-90 transition-opacity" (click)="zoomedPhoto.set(photo)" />
                  }
                  @if (f.photosAfter.length === 0) {
                    <div class="h-36 col-span-2 rounded-xl bg-slate-100 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-xs text-slate-400 p-4 text-center">
                      <span>Belum ada foto perbaikan yang diunggah oleh PIC.</span>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>

          <!-- Metadata & Description Card -->
          <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 class="text-sm font-bold text-navy-950 mb-4 uppercase tracking-wider">Informasi Temuan</h2>
            
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div class="bg-slate-50 p-3 rounded-xl">
                <span class="text-[10px] text-slate-400 font-semibold uppercase block">Kategori</span>
                <span class="text-xs font-bold text-slate-800">{{ f.category }}</span>
              </div>
              <div class="bg-slate-50 p-3 rounded-xl">
                <span class="text-[10px] text-slate-400 font-semibold uppercase block">Tingkat Risiko</span>
                <span class="text-xs font-bold capitalize text-slate-800">{{ f.risk }}</span>
              </div>
              <div class="bg-slate-50 p-3 rounded-xl">
                <span class="text-[10px] text-slate-400 font-semibold uppercase block">PIC Ditugaskan</span>
                <span class="text-xs font-bold text-slate-800">{{ f.picUid }}</span>
              </div>
              <div class="bg-slate-50 p-3 rounded-xl">
                <span class="text-[10px] text-slate-400 font-semibold uppercase block">Target Selesai</span>
                <span class="text-xs font-bold text-slate-800">{{ f.dueDate }}</span>
              </div>
            </div>

            <div>
              <span class="text-xs font-bold text-slate-700 block mb-1">Deskripsi Kondisi / Catatan Petugas:</span>
              <p class="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl leading-relaxed">
                {{ f.note }}
              </p>
            </div>
          </div>

          <!-- Status Timeline History -->
          <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 class="text-sm font-bold text-navy-950 mb-4 uppercase tracking-wider">Riwayat & Timeline Status</h2>
            
            <div class="relative border-l-2 border-slate-200 ml-3 space-y-6">
              @for (h of f.history; track h.at) {
                <div class="relative pl-6">
                  <div class="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-navy-800 border-2 border-white shadow-xs"></div>
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-slate-900 capitalize">{{ h.action.replace('_', ' ') }}</span>
                    <span class="text-[10px] text-slate-400">{{ formatDateTime(h.at) }}</span>
                  </div>
                  <p class="text-xs text-slate-600 mt-1">{{ h.note }}</p>
                </div>
              }
            </div>
          </div>

          <!-- Supervisor / Admin Verification Actions -->
          @if (canVerify() && f.status === 'waiting_verification') {
            <div class="bg-navy-900 text-white rounded-2xl p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 class="text-sm font-bold mb-1">Aksi Verifikasi Supervisor</h3>
                <p class="text-xs text-navy-200">Periksa bukti foto sesudah perbaikan di atas sebelum menutup temuan ini.</p>
              </div>

              <div class="flex items-center gap-3">
                <button 
                  (click)="showRejectModal.set(true)"
                  class="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs"
                >
                  Tolak / Kembalikan ke PIC
                </button>
                <button 
                  (click)="approveFinding()"
                  class="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs"
                >
                  ✓ Verifikasi & Tutup Temuan
                </button>
              </div>
            </div>
          }

        </div>
        }
      }

      <!-- Reject Reason Modal -->
      @if (showRejectModal()) {
        <div class="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 class="text-sm font-bold text-navy-950 mb-1">Tolak Tindak Lanjut & Kembalikan ke PIC</h3>
            <p class="text-xs text-slate-500 mb-3">Tuliskan instruksi atau alasan penolakan agar PIC dapat melakukan perbaikan ulang.</p>
            <textarea 
              [(ngModel)]="rejectReason"
              rows="3"
              placeholder="Misal: Bukti foto belum jelas, rompi belum terpasang dengan benar..."
              class="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-navy-600 focus:outline-none mb-4"
            ></textarea>
            <div class="flex justify-end gap-2">
              <button 
                (click)="showRejectModal.set(false)"
                class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button 
                (click)="rejectFinding()"
                [disabled]="!rejectReason.trim()"
                class="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-50"
              >
                Konfirmasi Tolak
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Zoom Photo Modal -->
      @if (zoomedPhoto()) {
        <div 
          (click)="zoomedPhoto.set(null)"
          class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <img [src]="zoomedPhoto()" alt="Zoomed" class="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl" />
        </div>
      }

    </div>
  `
})
export class TemuanDetailComponent implements OnInit {
  route = inject(ActivatedRoute);
  router = inject(Router);
  auth = inject(AuthService);
  findingService = inject(FindingService);

  finding = signal<Finding | null>(null);
  isLoading = signal<boolean>(true);
  zoomedPhoto = signal<string | null>(null);
  showRejectModal = signal<boolean>(false);
  rejectReason = '';

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.loadDetail(id);
    }
  }

  async loadDetail(id: string): Promise<void> {
    this.isLoading.set(true);
    try {
      const data = await this.findingService.getFindingById(id);
      this.finding.set(data);
    } catch {
      alert('Gagal memuat detail temuan');
    } finally {
      this.isLoading.set(false);
    }
  }

  canVerify(): boolean {
    const role = this.auth.currentRole();
    return role === 'supervisor' || role === 'admin' || this.auth.isSuperAdmin();
  }

  formatDateTime(isoStr: string): string {
    const d = new Date(isoStr);
    return isNaN(d.getTime()) ? isoStr : d.toLocaleString('id-ID');
  }

  async approveFinding(): Promise<void> {
    const f = this.finding();
    if (!f) return;

    if (!confirm('Apakah Anda yakin verifikasi foto sudah sesuai dan temuan dapat ditutup?')) return;

    try {
      await this.findingService.verifyFinding(f.id, 'approve');
      alert('✅ Temuan berhasil diverifikasi dan ditutup!');
      await this.loadDetail(f.id);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  async rejectFinding(): Promise<void> {
    const f = this.finding();
    if (!f || !this.rejectReason.trim()) return;

    try {
      await this.findingService.verifyFinding(f.id, 'reject', this.rejectReason.trim());
      alert('Temuan dikembalikan ke PIC.');
      this.showRejectModal.set(false);
      this.rejectReason = '';
      await this.loadDetail(f.id);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    }
  }
}
