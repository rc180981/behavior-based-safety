import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

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
            <div class="w-9 h-9 bg-navy-700 rounded-xl flex items-center justify-center font-bold text-amber-400">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <span class="font-bold text-lg tracking-tight block leading-tight">BBS Genba</span>
              <span class="text-xs text-navy-300 block">Behavior Based Safety</span>
            </div>
          </div>

          <!-- Active Project Pill & Role -->
          <div class="flex items-center gap-3">
            @if (auth.activeProject(); as project) {
              <div class="bg-navy-800 border border-navy-700 px-3 py-1 rounded-full text-xs flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span class="font-medium text-slate-200">{{ project.name }}</span>
              </div>
            } @else {
              <div class="bg-navy-800 border border-navy-700 px-3 py-1 rounded-full text-xs text-amber-300">
                Pilih Proyek
              </div>
            }

            <!-- Desktop Nav Links -->
            <nav class="hidden md:flex items-center gap-2 text-sm font-medium">
              <a routerLink="/observasi/baru" routerLinkActive="bg-navy-800 text-white" class="px-3 py-2 rounded-lg text-slate-300 hover:text-white transition-colors">
                Observasi Baru
              </a>
              <a routerLink="/observasi/riwayat" routerLinkActive="bg-navy-800 text-white" class="px-3 py-2 rounded-lg text-slate-300 hover:text-white transition-colors">
                Riwayat
              </a>
              <a routerLink="/temuan-saya" routerLinkActive="bg-navy-800 text-white" class="px-3 py-2 rounded-lg text-slate-300 hover:text-white transition-colors">
                Temuan Saya
              </a>
              <a routerLink="/dashboard" routerLinkActive="bg-navy-800 text-white" class="px-3 py-2 rounded-lg text-slate-300 hover:text-white transition-colors">
                Dashboard
              </a>
              <a routerLink="/admin" routerLinkActive="bg-navy-800 text-white" class="px-3 py-2 rounded-lg text-slate-300 hover:text-white transition-colors">
                Admin
              </a>
            </nav>

            <!-- User Menu & Logout -->
            <button
              (click)="auth.logout()"
              title="Keluar"
              class="p-2 rounded-lg bg-navy-800 text-slate-300 hover:text-white hover:bg-navy-700 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>

        </div>
      </div>
    </header>

    <!-- Bottom Navigation Bar for Mobile -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 px-2 py-1 shadow-lg">
      <div class="grid grid-cols-4 gap-1 text-center">
        <a 
          routerLink="/observasi/baru" 
          routerLinkActive="text-navy-900 font-bold" 
          class="flex flex-col items-center justify-center py-2 text-slate-500 hover:text-navy-800 transition-colors"
        >
          <svg class="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-[10px]">Observasi</span>
        </a>

        <a 
          routerLink="/temuan-saya" 
          routerLinkActive="text-navy-900 font-bold" 
          class="flex flex-col items-center justify-center py-2 text-slate-500 hover:text-navy-800 transition-colors"
        >
          <svg class="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <span class="text-[10px]">Temuan</span>
        </a>

        <a 
          routerLink="/dashboard" 
          routerLinkActive="text-navy-900 font-bold" 
          class="flex flex-col items-center justify-center py-2 text-slate-500 hover:text-navy-800 transition-colors"
        >
          <svg class="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span class="text-[10px]">Dashboard</span>
        </a>

        <a 
          routerLink="/admin" 
          routerLinkActive="text-navy-900 font-bold" 
          class="flex flex-col items-center justify-center py-2 text-slate-500 hover:text-navy-800 transition-colors"
        >
          <svg class="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span class="text-[10px]">Admin</span>
        </a>
      </div>
    </nav>
  `
})
export class NavbarComponent {
  auth = inject(AuthService);
}
