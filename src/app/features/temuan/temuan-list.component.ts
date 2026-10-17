import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { FindingService } from '../../core/services/finding.service';
import { Finding } from '../../core/models/bbs.models';

@Component({
  selector: 'app-temuan-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28">
      
      <!-- Top Header -->
      <div class="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-navy-950">Daftar Temuan Lapangan</h1>
          <p class="text-xs text-slate-500">Kelola dan pantau seluruh siklus tindakan korektif perbaikan keselamatan.</p>
        </div>
        <div class="mt-4 sm:mt-0 flex gap-2">
          <button 
            (click)="onExportExcel()"
            class="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Export Excel / CSV
          </button>
        </div>
      </div>

      <!-- Filters Bar (Mockup 9) -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-6 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <!-- Search -->
        <div>
          <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Pencarian</label>
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            placeholder="Cari catatan / PIC..." 
            class="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-navy-600 focus:outline-none"
          />
        </div>

        <!-- Status Filter -->
        <div>
          <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
          <select 
            [(ngModel)]="filterStatus"
            class="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-navy-600 focus:outline-none bg-white"
          >
            <option value="all">Semua Status</option>
            <option value="open">Open</option>
            <option value="waiting_verification">Menunggu Verifikasi</option>
            <option value="closed">Closed</option>
            <option value="overdue">Overdue Saja</option>
          </select>
        </div>

        <!-- Risk Filter -->
        <div>
          <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tingkat Risiko</label>
          <select 
            [(ngModel)]="filterRisk"
            class="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-navy-600 focus:outline-none bg-white"
          >
            <option value="all">Semua Risiko</option>
            <option value="tinggi">Tinggi</option>
            <option value="sedang">Sedang</option>
            <option value="rendah">Rendah</option>
          </select>
        </div>

        <!-- Category Filter -->
        <div>
          <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Kategori Item</label>
          <select 
            [(ngModel)]="filterCategory"
            class="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-navy-600 focus:outline-none bg-white"
          >
            <option value="all">Semua Kategori</option>
            <option value="wajib">Wajib</option>
            <option value="medium">Medium</option>
          </select>
        </div>
      </div>

      <!-- Findings Table (Desktop & Mobile) -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        @if (findingService.isLoading()) {
          <div class="py-16 text-center text-slate-400">
            <span class="inline-block animate-spin text-3xl mb-2">⟳</span>
            <p class="text-xs">Memuat data temuan...</p>
          </div>
        } @else if (filteredFindings().length === 0) {
          <div class="py-16 text-center text-slate-400">
            <p class="text-sm font-bold text-slate-700">Tidak ada temuan yang cocok dengan filter.</p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead class="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th class="px-4 py-3">ID & Area</th>
                  <th class="px-4 py-3">Catatan Temuan</th>
                  <th class="px-4 py-3">Kategori & Risiko</th>
                  <th class="px-4 py-3">PIC</th>
                  <th class="px-4 py-3">Target Selesai</th>
                  <th class="px-4 py-3">Status</th>
                  <th class="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (f of filteredFindings(); track f.id) {
                  <tr class="hover:bg-slate-50/80 transition-colors">
                    <td class="px-4 py-3">
                      <span class="font-bold text-navy-950 block">{{ f.id.substring(0, 8) }}</span>
                      <span class="text-[10px] text-slate-400">{{ f.areaId }}</span>
                    </td>
                    <td class="px-4 py-3 max-w-xs truncate font-medium text-slate-800">
                      {{ f.note }}
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-1.5">
                        <span 
                          [ngClass]="f.category === 'wajib' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'"
                          class="text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase"
                        >
                          {{ f.category }}
                        </span>
                        <span class="text-[10px] text-slate-500 capitalize font-medium">
                          {{ f.risk }}
                        </span>
                      </div>
                    </td>
                    <td class="px-4 py-3 text-slate-700 font-medium">
                      {{ f.picUid }}
                    </td>
                    <td class="px-4 py-3">
                      <span class="block text-slate-800 font-semibold">{{ f.dueDate }}</span>
                      @if (f.isOverdue) {
                        <span class="text-[9px] text-red-600 font-black uppercase">Overdue</span>
                      }
                    </td>
                    <td class="px-4 py-3">
                      <span 
                        [ngClass]="{
                          'bg-amber-50 text-amber-800 border-amber-200': f.status === 'open',
                          'bg-blue-50 text-blue-800 border-blue-200': f.status === 'waiting_verification',
                          'bg-emerald-50 text-emerald-800 border-emerald-200': f.status === 'closed'
                        }"
                        class="border text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase"
                      >
                        {{ f.status.replace('_', ' ') }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-right">
                      <a 
                        [routerLink]="['/temuan', f.id]"
                        class="text-navy-800 font-bold hover:underline"
                      >
                        Detail →
                      </a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

    </div>
  `
})
export class TemuanListComponent implements OnInit {
  auth = inject(AuthService);
  findingService = inject(FindingService);

  searchQuery = '';
  filterStatus = 'all';
  filterRisk = 'all';
  filterCategory = 'all';

  async ngOnInit(): Promise<void> {
    const proj = this.auth.activeProject();
    if (proj) {
      await this.findingService.loadFindings(proj.id);
    }
  }

  filteredFindings = computed(() => {
    let list = this.findingService.findings();

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter((f) => 
        (f.note && f.note.toLowerCase().includes(q)) ||
        (f.picUid && f.picUid.toLowerCase().includes(q))
      );
    }

    if (this.filterStatus !== 'all') {
      if (this.filterStatus === 'overdue') {
        list = list.filter((f) => f.isOverdue);
      } else {
        list = list.filter((f) => f.status === this.filterStatus);
      }
    }

    if (this.filterRisk !== 'all') {
      list = list.filter((f) => f.risk === this.filterRisk);
    }

    if (this.filterCategory !== 'all') {
      list = list.filter((f) => f.category === this.filterCategory);
    }

    return list;
  });

  onExportExcel(): void {
    this.findingService.exportToCsv(this.filteredFindings());
  }
}
