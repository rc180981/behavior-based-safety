import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProjectService } from '../../core/services/project.service';
import { Project, ProjectMember, ProjectRole } from '../../core/models/bbs.models';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28">
      
      <!-- Top Title & Navigation Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-navy-100 text-navy-800 border border-navy-200">
              Modul Keamanan & Akun
            </span>
          </div>
          <h1 class="text-2xl font-black text-navy-950 flex items-center gap-2">
            <span>👥</span>
            <span>Manajemen Pengguna & Hak Akses (RBAC)</span>
          </h1>
          <p class="text-xs text-slate-500 mt-1">
            Pendaftaran akun terpusat oleh Admin HSE, penetapan peran (Petugas, Supervisor, Admin), dan penugasan akses proyek.
          </p>
        </div>

        <!-- Shortcut back to Admin Panel -->
        <div class="flex items-center gap-2">
          <a
            routerLink="/admin"
            class="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-xs font-bold rounded-xl text-slate-700 bg-white hover:bg-slate-50 shadow-xs transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            <span>Kembali ke Panel HSE</span>
          </a>
        </div>
      </div>

      <!-- Project Filter Bar & Summary Stats -->
      <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs mb-6">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div class="flex flex-col sm:flex-row sm:items-center gap-3">
            <label class="text-xs font-bold text-slate-700 flex items-center gap-1.5 whitespace-nowrap">
              <span>Filter Proyek:</span>
            </label>
            <div class="relative min-w-[260px] sm:w-80">
              <select 
                [ngModel]="selectedProjectId()"
                (ngModelChange)="onProjectFilterChange($event)"
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
          <div class="flex flex-wrap items-center gap-2">
            <div class="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs">
              <span class="text-slate-500">Total Pengguna:</span>
              <span class="font-extrabold text-navy-900">{{ members().length }}</span>
            </div>
            <div class="bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs text-indigo-700">
              <span>Admin:</span>
              <span class="font-extrabold">{{ countRole('admin') }}</span>
            </div>
            <div class="bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs text-blue-700">
              <span>Supervisor:</span>
              <span class="font-extrabold">{{ countRole('supervisor') }}</span>
            </div>
            <div class="bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs text-emerald-700">
              <span>Petugas:</span>
              <span class="font-extrabold">{{ countRole('petugas') }}</span>
            </div>
          </div>

        </div>
      </div>

      <!-- Main Layout: 1 Col Form + 2 Cols List -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- ============================================== -->
        <!-- FORM 1: DAFTARKAN & TUGASKAN PENGGUNA BARU     -->
        <!-- ============================================== -->
        <div class="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs h-fit">
          <div class="border-b border-slate-100 pb-3 mb-4">
            <h3 class="text-sm font-bold text-navy-950 flex items-center gap-1.5">
              <span>➕</span>
              <span>Daftarkan Pengguna Baru</span>
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">
              Akun akan otomatis didaftarkan ke sistem dan diberikan akses proyek.
            </p>
          </div>

          <form (ngSubmit)="createUserAndAssign()" class="space-y-3.5">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap (Account Name) <span class="text-rose-500">*</span>
              </label>
              <input 
                type="text" 
                [(ngModel)]="newName" 
                name="userName"
                placeholder="Misal: Budi Santoso, S.T."
                class="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-navy-600 focus:outline-none"
                required
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Email Pengguna (ID Akun) <span class="text-rose-500">*</span>
              </label>
              <input 
                type="email" 
                [(ngModel)]="newEmail" 
                name="userEmail"
                placeholder="budi.safety@perusahaan.com"
                class="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-navy-600 focus:outline-none"
                required
              />
              <p class="text-[10px] text-slate-400 mt-0.5">Format email mandiri perusahaan, tidak butuh verifikasi Gmail.</p>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Departemen / Divisi
              </label>
              <select 
                [(ngModel)]="newDepartment" 
                name="userDept"
                class="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold focus:border-navy-600 focus:outline-none bg-white"
              >
                <option value="HSE Operations">HSE Operations (K3L)</option>
                <option value="Operasional Lapangan">Operasional Lapangan</option>
                <option value="Konstruksi & Sipil">Konstruksi & Sipil</option>
                <option value="Mekanikal & Elektrikal">Mekanikal & Elektrikal</option>
                <option value="Logistik & Warehouse">Logistik & Gudang</option>
                <option value="Manajemen Proyek">Manajemen Proyek</option>
              </select>
            </div>

            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-xs font-semibold text-slate-700">
                  Kata Sandi Awal
                </label>
                <button
                  type="button"
                  (click)="showPassword.set(!showPassword())"
                  class="text-[11px] text-navy-700 hover:underline font-bold"
                >
                  {{ showPassword() ? 'Sembunyikan' : 'Lihat' }}
                </button>
              </div>
              <input 
                [type]="showPassword() ? 'text' : 'password'"
                [(ngModel)]="newPassword" 
                name="userPassword"
                placeholder="Default: Password123!"
                class="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-navy-600 focus:outline-none font-mono"
              />
              <p class="text-[10px] text-slate-400 mt-0.5">
                Kosongkan bila ingin memakai kata sandi default: <strong class="text-navy-900 font-mono">Password123!</strong>
              </p>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Peran yang Diberikan (Role) <span class="text-rose-500">*</span>
              </label>
              <select 
                [(ngModel)]="newRole" 
                name="userRole"
                class="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold focus:border-navy-600 focus:outline-none bg-white"
              >
                <option value="petugas">👷 Petugas (Pengisi Observasi Genba)</option>
                <option value="supervisor">🔍 Supervisor (Verifikator Temuan)</option>
                <option value="admin">⚙️ Admin Proyek (Full Kontrol Proyek)</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Penugasan Proyek
              </label>
              <select 
                [(ngModel)]="assignProjectId" 
                name="assignProj"
                class="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold focus:border-navy-600 focus:outline-none bg-white"
              >
                @for (p of projectService.projects(); track p.id) {
                  <option [value]="p.id">{{ p.name }} [{{ p.code }}]</option>
                }
              </select>
            </div>

            <button 
              type="submit"
              [disabled]="!newEmail.trim() || isSubmitting()"
              class="w-full bg-navy-800 text-white text-xs font-bold py-3.5 rounded-xl hover:bg-navy-900 disabled:opacity-50 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 mt-2"
            >
              @if (isSubmitting()) {
                <span class="inline-block animate-spin mr-1">⟳</span>
                <span>Mendaftarkan Akun...</span>
              } @else {
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                <span>Daftarkan & Berikan Akses</span>
              }
            </button>
          </form>
        </div>

        <!-- ============================================== -->
        <!-- LIST 2: DAFTAR PENGGUNA TERDAFTAR              -->
        <!-- ============================================== -->
        <div class="lg:col-span-2 space-y-4">
          
          <!-- Search & Filter Controls -->
          <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div class="relative w-full sm:w-72">
              <input 
                type="text"
                [(ngModel)]="searchQuery"
                placeholder="Cari nama, email, departemen..."
                class="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs focus:border-navy-600 focus:outline-none"
              />
              <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>

            <!-- Role Filter Pills -->
            <div class="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar">
              <button 
                (click)="roleFilter = 'all'"
                [ngClass]="roleFilter === 'all' ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                class="text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
              >
                Semua ({{ members().length }})
              </button>
              <button 
                (click)="roleFilter = 'admin'"
                [ngClass]="roleFilter === 'admin' ? 'bg-indigo-700 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'"
                class="text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
              >
                Admin ({{ countRole('admin') }})
              </button>
              <button 
                (click)="roleFilter = 'supervisor'"
                [ngClass]="roleFilter === 'supervisor' ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'"
                class="text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
              >
                Supervisor ({{ countRole('supervisor') }})
              </button>
              <button 
                (click)="roleFilter = 'petugas'"
                [ngClass]="roleFilter === 'petugas' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'"
                class="text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
              >
                Petugas ({{ countRole('petugas') }})
              </button>
            </div>
          </div>

          <!-- Empty State -->
          @if (filteredMembers().length === 0) {
            <div class="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
              <span class="text-4xl block mb-2">👥</span>
              <h4 class="text-sm font-bold text-slate-800">Tidak ada pengguna yang sesuai</h4>
              <p class="text-xs text-slate-400 mt-1">Gunakan formulir di samping untuk mendaftarkan akun baru.</p>
            </div>
          }

          <!-- Member Cards -->
          <div class="space-y-3">
            @for (m of filteredMembers(); track m.uid) {
              <div class="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors">
                
                <div class="flex items-center gap-3">
                  <!-- Avatar Initial -->
                  <div 
                    [ngClass]="{
                      'bg-indigo-100 text-indigo-800 border-indigo-200': m.role === 'admin',
                      'bg-blue-100 text-blue-800 border-blue-200': m.role === 'supervisor',
                      'bg-emerald-100 text-emerald-800 border-emerald-200': m.role === 'petugas'
                    }"
                    class="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm uppercase flex-shrink-0 border shadow-xs"
                  >
                    {{ (m.name || m.email || 'U')[0] }}
                  </div>

                  <div>
                    <div class="flex items-center gap-2">
                      <h4 class="text-xs sm:text-sm font-bold text-slate-900">
                        {{ m.name || m.email?.split('@')?.[0] || m.uid }}
                      </h4>
                      <span 
                        [ngClass]="{
                          'bg-indigo-50 text-indigo-700 border-indigo-200': m.role === 'admin',
                          'bg-blue-50 text-blue-700 border-blue-200': m.role === 'supervisor',
                          'bg-emerald-50 text-emerald-700 border-emerald-200': m.role === 'petugas'
                        }"
                        class="text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider border"
                      >
                        {{ m.role }}
                      </span>
                    </div>

                    <div class="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                      <span class="font-mono text-slate-600">{{ m.email || '-' }}</span>
                      <span class="text-slate-300">•</span>
                      <span>{{ m.department || 'HSE Operations' }}</span>
                    </div>
                  </div>
                </div>

                <!-- Role Selector & Actions -->
                <div class="flex items-center gap-2.5 self-end sm:self-center">
                  <div class="flex flex-col items-end">
                    <label class="text-[10px] text-slate-400 font-semibold mb-0.5">Ubah Peran:</label>
                    <select 
                      [ngModel]="m.role"
                      (ngModelChange)="updateMemberRole(m, $event)"
                      class="rounded-xl border border-slate-300 py-1.5 px-3 text-xs font-bold focus:border-navy-600 focus:outline-none bg-slate-50 cursor-pointer shadow-xs"
                    >
                      <option value="petugas">👷 Petugas Lapangan</option>
                      <option value="supervisor">🔍 Supervisor</option>
                      <option value="admin">⚙️ Admin Proyek</option>
                    </select>
                  </div>

                  <button 
                    (click)="confirmRemoveMember(m)"
                    class="mt-3.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 p-2.5 rounded-xl border border-rose-100 hover:border-rose-200 transition-colors shadow-xs"
                    title="Cabut Akses Pengguna dari Proyek ini"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>

              </div>
            }
          </div>

        </div>

      </div>

      <!-- Toast Feedback Notification -->
      @if (toastMessage()) {
        <div 
          class="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-200"
          [ngClass]="toastType() === 'success' ? 'bg-emerald-900 text-white border-emerald-700' : 'bg-rose-900 text-white border-rose-700'"
        >
          <span>{{ toastMessage() }}</span>
        </div>
      }

    </div>
  `
})
export class UserManagementComponent implements OnInit {
  auth = inject(AuthService);
  projectService = inject(ProjectService);

  selectedProjectId = signal<string>('');
  members = signal<ProjectMember[]>([]);

  // Form State
  newName = '';
  newEmail = '';
  newDepartment = 'HSE Operations';
  newPassword = '';
  newRole: ProjectRole = 'petugas';
  assignProjectId = '';
  showPassword = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);

  // Search & Filter State
  searchQuery = '';
  roleFilter: 'all' | 'admin' | 'supervisor' | 'petugas' = 'all';

  // Toast
  toastMessage = signal<string>('');
  toastType = signal<'success' | 'error'>('success');
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  filteredMembers = computed(() => {
    let list = this.members();

    // 1. Role filter
    if (this.roleFilter !== 'all') {
      list = list.filter((m) => m.role === this.roleFilter);
    }

    // 2. Search query filter
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((m) => 
        (m.name || '').toLowerCase().includes(q) ||
        (m.email || '').toLowerCase().includes(q) ||
        (m.department || '').toLowerCase().includes(q)
      );
    }

    return list;
  });

  async ngOnInit(): Promise<void> {
    const active = this.auth.activeProject();
    if (active) {
      this.selectedProjectId.set(active.id);
      this.assignProjectId = active.id;
      await this.loadMembers(active.id);
    } else {
      const projects = await this.projectService.loadProjects();
      if (projects.length > 0) {
        this.selectedProjectId.set(projects[0]!.id);
        this.assignProjectId = projects[0]!.id;
        await this.loadMembers(projects[0]!.id);
      }
    }
  }

  async onProjectFilterChange(projectId: string): Promise<void> {
    this.selectedProjectId.set(projectId);
    this.assignProjectId = projectId;
    await this.loadMembers(projectId);
  }

  async loadMembers(projectId: string): Promise<void> {
    if (!projectId) return;
    const token = await this.auth.getIdToken();
    try {
      const res = await fetch(`/api/admin/members?projectId=${projectId}`, {
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

  countRole(role: ProjectRole): number {
    return this.members().filter((m) => m.role === role).length;
  }

  async createUserAndAssign(): Promise<void> {
    const projId = this.assignProjectId || this.selectedProjectId();
    if (!projId || !this.newEmail.trim()) {
      this.showToast('Mohon pilih proyek dan isi email pengguna', 'error');
      return;
    }

    this.isSubmitting.set(true);
    const token = await this.auth.getIdToken();
    try {
      const targetEmail = this.newEmail.trim();
      const targetName = this.newName.trim();
      const targetPassword = this.newPassword.trim() || 'Password123!';
      const targetDept = this.newDepartment.trim();
      const targetRole = this.newRole;

      const res = await fetch('/api/admin/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: projId,
          targetEmail: targetEmail,
          name: targetName,
          password: targetPassword,
          department: targetDept,
          role: targetRole,
        }),
      });

      if (res.ok) {
        this.newEmail = '';
        this.newName = '';
        this.newPassword = '';
        await this.loadMembers(projId);
        this.showToast(`✅ Akun "${targetEmail}" berhasil didaftarkan sebagai ${targetRole.toUpperCase()}! Sandi: ${targetPassword}`, 'success');
      } else {
        const err = await res.json();
        this.showToast(err.error || 'Gagal mendaftarkan akun pengguna', 'error');
      }
    } catch {
      this.showToast('Gagal menghubungi server', 'error');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async updateMemberRole(m: ProjectMember, newRole: ProjectRole): Promise<void> {
    const projId = this.selectedProjectId();
    if (!projId) return;

    const token = await this.auth.getIdToken();
    try {
      const res = await fetch('/api/admin/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: projId,
          targetUid: m.uid,
          targetEmail: m.email,
          role: newRole,
        }),
      });

      if (res.ok) {
        m.role = newRole;
        this.showToast(`✅ Peran ${m.name || m.email} diubah menjadi ${newRole.toUpperCase()}`, 'success');
      } else {
        const err = await res.json();
        this.showToast(err.error || 'Gagal mengubah peran', 'error');
      }
    } catch {
      this.showToast('Gagal menghubungi server', 'error');
    }
  }

  async confirmRemoveMember(m: ProjectMember): Promise<void> {
    if (!confirm(`Cabut akses ${m.name || m.email} dari proyek ini?`)) {
      return;
    }

    const projId = this.selectedProjectId();
    if (!projId) return;

    const token = await this.auth.getIdToken();
    try {
      const res = await fetch(`/api/admin/members?projectId=${projId}&uid=${m.uid}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        await this.loadMembers(projId);
        this.showToast(`✅ Akses pengguna berhasil dicabut dari proyek`, 'success');
      } else {
        const err = await res.json();
        this.showToast(err.error || 'Gagal mencabut akses', 'error');
      }
    } catch {
      this.showToast('Gagal menghubungi server', 'error');
    }
  }

  showToast(message: string, type: 'success' | 'error' = 'success'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastMessage.set('');
    }, 4000);
  }
}
