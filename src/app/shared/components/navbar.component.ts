import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { OfflineSyncService } from '../../core/services/offline-sync.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Top Navy Header (Mobile First & Desktop) -->
    <header class="bg-navy-900 text-white shadow-md sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          
          <!-- Logo & Brand -->
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-navy-700 rounded-xl flex items-center justify-center font-bold text-amber-400 flex-shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <span class="font-bold text-base sm:text-lg tracking-tight block leading-tight">BBS Genba</span>
              <span class="text-[10px] sm:text-xs text-navy-300 block">Behavior Based Safety</span>
            </div>
          </div>

          <!-- Active Project & Role Badge (Desktop & Mobile) -->
          <div class="hidden sm:flex items-center gap-2">
            @if (auth.activeProject(); as project) {
              <div class="bg-navy-800 border border-navy-700/80 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span class="font-bold text-slate-200">{{ project.code || project.name }}</span>
              </div>
            }

            <!-- Role Badge -->
            <div 
              class="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border shadow-xs"
              [ngClass]="{
                'bg-emerald-500/20 text-emerald-300 border-emerald-500/40': auth.isSuperAdmin(),
                'bg-indigo-500/20 text-indigo-300 border-indigo-500/40': !auth.isSuperAdmin() && auth.currentRole() === 'admin',
                'bg-amber-500/20 text-amber-300 border-amber-500/40': auth.currentRole() === 'supervisor',
                'bg-sky-500/20 text-sky-300 border-sky-500/40': auth.currentRole() === 'petugas'
              }"
            >
              @if (auth.isSuperAdmin()) {
                <span>★ SuperAdmin</span>
              } @else if (auth.currentRole() === 'admin') {
                <span>Admin Proyek</span>
              } @else if (auth.currentRole() === 'supervisor') {
                <span>Supervisor</span>
              } @else {
                <span>Petugas</span>
              }
            </div>
          </div>

          <!-- Navigation Links & User Menu -->
          <div class="flex items-center gap-2 sm:gap-3">
            
            <!-- Desktop Nav Links (RBAC Filtered) -->
            <nav class="hidden lg:flex items-center gap-1 text-xs font-bold">
              <a routerLink="/observasi/baru" routerLinkActive="bg-navy-800 text-white" class="px-3 py-2 rounded-xl text-slate-300 hover:text-white transition-colors">
                Observasi Baru
              </a>
              <a routerLink="/observasi/riwayat" routerLinkActive="bg-navy-800 text-white" class="px-3 py-2 rounded-xl text-slate-300 hover:text-white transition-colors">
                Riwayat
              </a>
              <a routerLink="/temuan-saya" routerLinkActive="bg-navy-800 text-white" class="px-3 py-2 rounded-xl text-slate-300 hover:text-white transition-colors">
                Temuan Saya
              </a>
              
              <!-- Supervisor, Admin, SuperAdmin can view all project findings -->
              @if (auth.isSupervisor()) {
                <a routerLink="/temuan" routerLinkActive="bg-navy-800 text-white" class="px-3 py-2 rounded-xl text-slate-300 hover:text-white transition-colors">
                  Daftar Temuan
                </a>
              }

              <a routerLink="/dashboard" routerLinkActive="bg-navy-800 text-white" class="px-3 py-2 rounded-xl text-slate-300 hover:text-white transition-colors">
                Dashboard
              </a>

              <!-- SuperAdmin only -->
              @if (auth.isSuperAdmin()) {
                <a routerLink="/dashboard/lintas-proyek" routerLinkActive="bg-navy-800 text-white" class="px-3 py-2 rounded-xl text-amber-300 hover:text-white transition-colors">
                  Lintas Proyek
                </a>
              }

              <!-- Admin & SuperAdmin only -->
              @if (auth.isAdmin()) {
                <a routerLink="/admin" routerLinkActive="bg-navy-800 text-white" class="px-3 py-2 rounded-xl text-slate-300 hover:text-white transition-colors">
                  Admin
                </a>
              }
            </nav>

            @if (!offlineSync.isOnline()) {
              <div class="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                OFFLINE
              </div>
            }

            <!-- User Initial & Logout Button -->
            <div class="flex items-center gap-2 pl-2 border-l border-navy-800">
              <div 
                [title]="auth.currentUser()?.email || 'User'"
                class="w-8 h-8 rounded-xl bg-navy-800 border border-navy-700 text-white flex items-center justify-center font-extrabold text-xs uppercase"
              >
                {{ (auth.userProfile()?.name || auth.currentUser()?.email || 'U')[0] }}
              </div>

              <!-- Logout Button -->
              <button
                (click)="onLogout()"
                [disabled]="isLoggingOut()"
                title="Keluar dari Akun"
                class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 transition-all text-xs font-bold active:scale-95 disabled:opacity-50"
              >
                @if (isLoggingOut()) {
                  <span class="animate-spin text-xs">⟳</span>
                  <span class="hidden sm:inline">Keluar...</span>
                } @else {
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span class="hidden sm:inline">Keluar</span>
                }
              </button>
            </div>

          </div>

        </div>
      </div>
    </header>

    <!-- Bottom Navigation Bar for Mobile (RBAC Filtered) -->
    <nav class="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 px-2 py-1 shadow-lg">
      <div class="grid grid-cols-4 gap-1 text-center">
        
        <!-- Observasi Baru -->
        <a 
          routerLink="/observasi/baru" 
          routerLinkActive="text-navy-950 font-bold" 
          class="flex flex-col items-center justify-center py-2 text-slate-500 hover:text-navy-800 transition-colors"
        >
          <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-[10px]">Observasi</span>
        </a>

        <!-- Temuan Saya -->
        <a 
          routerLink="/temuan-saya" 
          routerLinkActive="text-navy-950 font-bold" 
          class="flex flex-col items-center justify-center py-2 text-slate-500 hover:text-navy-800 transition-colors"
        >
          <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <span class="text-[10px]">Temuan</span>
        </a>

        <!-- Dashboard -->
        <a 
          routerLink="/dashboard" 
          routerLinkActive="text-navy-950 font-bold" 
          class="flex flex-col items-center justify-center py-2 text-slate-500 hover:text-navy-800 transition-colors"
        >
          <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span class="text-[10px]">Dashboard</span>
        </a>

        <!-- 4th Mobile Tab: Role Based -->
        @if (auth.isAdmin()) {
          <a 
            routerLink="/admin" 
            routerLinkActive="text-navy-950 font-bold" 
            class="flex flex-col items-center justify-center py-2 text-slate-500 hover:text-navy-800 transition-colors"
          >
            <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span class="text-[10px]">Admin</span>
          </a>
        } @else if (auth.isSupervisor()) {
          <a 
            routerLink="/temuan" 
            routerLinkActive="text-navy-950 font-bold" 
            class="flex flex-col items-center justify-center py-2 text-slate-500 hover:text-navy-800 transition-colors"
          >
            <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span class="text-[10px]">Monitoring</span>
          </a>
        } @else {
          <a 
            routerLink="/observasi/riwayat" 
            routerLinkActive="text-navy-950 font-bold" 
            class="flex flex-col items-center justify-center py-2 text-slate-500 hover:text-navy-800 transition-colors"
          >
            <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="text-[10px]">Riwayat</span>
          </a>
        }

      </div>
    </nav>
  `
})
export class NavbarComponent {
  auth = inject(AuthService);
  offlineSync = inject(OfflineSyncService);
  router = inject(Router);

  isLoggingOut = signal<boolean>(false);

  async onLogout(): Promise<void> {
    if (!confirm('Apakah Anda yakin ingin keluar dari akun?')) {
      return;
    }

    this.isLoggingOut.set(true);
    try {
      await this.auth.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      this.isLoggingOut.set(false);
    }
  }
}
