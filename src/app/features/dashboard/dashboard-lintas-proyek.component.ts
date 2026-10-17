import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProjectService } from '../../core/services/project.service';

interface EnterpriseSummary {
  totalProjects: number;
  totalObservations: number;
  enterpriseCompliance: number;
  totalOpenFindings: number;
  totalOverdue: number;
}

interface ProjectRankingItem {
  id: string;
  name: string;
  code: string;
  riskLevel: string;
  totalObservations: number;
  percentPositive: number;
  openFindings: number;
  overdueFindings: number;
}

@Component({
  selector: 'app-dashboard-lintas-proyek',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28">
      
      <!-- Top Title -->
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
              SuperAdmin HSE Pusat
            </span>
          </div>
          <h1 class="text-2xl font-bold text-navy-950">Dashboard Lintas Proyek (Enterprise)</h1>
          <p class="text-xs text-slate-500">
            Perbandingan performa kepatuhan perilaku keselamatan di seluruh unit dan area proyek.
          </p>
        </div>
      </div>

      <!-- 4 Enterprise KPI Cards -->
      @if (summary(); as s) {
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Proyek Aktif</span>
            <div class="mt-2 text-3xl font-black text-navy-900">{{ s.totalProjects }} Proyek</div>
          </div>

          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Observasi Enterprise</span>
            <div class="mt-2 text-3xl font-black text-navy-900">{{ s.totalObservations }}</div>
          </div>

          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">% Kepatuhan Rata-Rata</span>
            <div class="mt-2 text-3xl font-black text-emerald-600">{{ s.enterpriseCompliance }}%</div>
          </div>

          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Overdue Seluruh Unit</span>
            <div 
              [ngClass]="s.totalOverdue > 0 ? 'text-red-600' : 'text-slate-800'"
              class="mt-2 text-3xl font-black"
            >
              {{ s.totalOverdue }}
            </div>
          </div>
        </div>
      }

      <!-- Project Comparison Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 class="text-sm font-bold text-navy-950 uppercase tracking-wider">Peringkat & Kepatuhan Proyek</h2>
          <span class="text-xs text-slate-400">Diurutkan berdasarkan % kepatuhan tertinggi</span>
        </div>

        @if (isLoading()) {
          <div class="py-16 text-center text-slate-400">
            <span class="inline-block animate-spin text-3xl mb-2">⟳</span>
            <p class="text-xs">Mengkalkulasi metrik lintas proyek...</p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead class="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th class="px-5 py-3">Peringkat</th>
                  <th class="px-5 py-3">Nama & Kode Proyek</th>
                  <th class="px-5 py-3">Tingkat Risiko</th>
                  <th class="px-5 py-3 text-right">Total Observasi</th>
                  <th class="px-5 py-3 text-right">% Kepatuhan</th>
                  <th class="px-5 py-3 text-right">Temuan Open</th>
                  <th class="px-5 py-3 text-right">Overdue</th>
                  <th class="px-5 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (p of projects(); track p.id; let idx = $index) {
                  <tr class="hover:bg-slate-50/80 transition-colors">
                    <td class="px-5 py-3.5 font-bold text-slate-400">
                      #{{ idx + 1 }}
                    </td>
                    <td class="px-5 py-3.5">
                      <span class="font-bold text-navy-950 block">{{ p.name }}</span>
                      <span class="text-[10px] text-slate-400 font-mono">{{ p.code }}</span>
                    </td>
                    <td class="px-5 py-3.5">
                      <span 
                        [ngClass]="p.riskLevel === 'tinggi' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'"
                        class="text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase"
                      >
                        {{ p.riskLevel }}
                      </span>
                    </td>
                    <td class="px-5 py-3.5 text-right font-semibold text-slate-800">
                      {{ p.totalObservations }}
                    </td>
                    <td class="px-5 py-3.5 text-right font-black">
                      <span [ngClass]="p.percentPositive >= 85 ? 'text-emerald-600' : 'text-amber-600'">
                        {{ p.percentPositive }}%
                      </span>
                    </td>
                    <td class="px-5 py-3.5 text-right font-semibold text-slate-800">
                      {{ p.openFindings }}
                    </td>
                    <td class="px-5 py-3.5 text-right font-bold">
                      @if (p.overdueFindings > 0) {
                        <span class="text-red-600">{{ p.overdueFindings }}</span>
                      } @else {
                        <span class="text-slate-400">0</span>
                      }
                    </td>
                    <td class="px-5 py-3.5 text-center">
                      <button 
                        (click)="switchToProject(p.id)"
                        class="text-xs font-bold text-navy-800 hover:text-navy-950 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Buka Dashboard →
                      </button>
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
export class DashboardLintasProyekComponent implements OnInit {
  auth = inject(AuthService);
  projectService = inject(ProjectService);
  router = inject(Router);

  summary = signal<EnterpriseSummary | null>(null);
  projects = signal<ProjectRankingItem[]>([]);
  isLoading = signal<boolean>(true);

  async ngOnInit(): Promise<void> {
    await this.loadCrossProjectStats();
  }

  async loadCrossProjectStats(): Promise<void> {
    this.isLoading.set(true);
    try {
      const token = await this.auth.getIdToken();
      const res = await fetch('/api/dashboard/cross-project', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Gagal memuat statistik lintas proyek');
      }

      const data = await res.json();
      this.summary.set(data.summary);
      this.projects.set(data.projects || []);
    } catch (err) {
      console.warn('Cross project error:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  async switchToProject(projectId: string): Promise<void> {
    const found = this.projectService.projects().find((p) => p.id === projectId);
    if (found) {
      this.auth.setActiveProject(found, 'admin');
      await this.projectService.loadProjectDetails(found.id);
    }
    this.router.navigate(['/dashboard']);
  }
}
