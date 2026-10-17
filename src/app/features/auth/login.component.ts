import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <!-- Logo / Icon BBS -->
        <div class="mx-auto w-16 h-16 bg-navy-800 text-white rounded-2xl flex items-center justify-center shadow-lg">
          <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h2 class="mt-4 text-center text-2xl font-bold tracking-tight text-navy-950 sm:text-3xl">
          BBS Genba Lapangan
        </h2>
        <p class="mt-2 text-center text-xs text-slate-600">
          Aplikasi Observasi Perilaku Keselamatan Kerja (Safety BBS)
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div class="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-100">
          
          <!-- Tab Mode: Masuk vs Daftar Akun -->
          <div class="flex p-1 bg-slate-100 rounded-xl mb-6">
            <button
              type="button"
              (click)="setMode('login')"
              [ngClass]="activeTab() === 'login' ? 'bg-white text-navy-950 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-900 font-medium'"
              class="flex-1 py-2 text-xs rounded-lg transition-all text-center"
            >
              Masuk Akun
            </button>
            <button
              type="button"
              (click)="setMode('register')"
              [ngClass]="activeTab() === 'register' ? 'bg-white text-navy-950 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-900 font-medium'"
              class="flex-1 py-2 text-xs rounded-lg transition-all text-center"
            >
              Daftar Akun Baru
            </button>
          </div>

          <!-- Alert Pesan Error -->
          @if (errorMessage()) {
            <div class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2">
              <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
              <span>{{ errorMessage() }}</span>
            </div>
          }

          <!-- Alert Pesan Sukses -->
          @if (successMessage()) {
            <div class="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-start gap-2">
              <svg class="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span>{{ successMessage() }}</span>
            </div>
          }

          <!-- ============================================== -->
          <!-- FORM 1: MASUK (LOGIN)                         -->
          <!-- ============================================== -->
          @if (activeTab() === 'login') {
            <form class="space-y-4" (ngSubmit)="onLoginEmail()">
              <div>
                <label for="email" class="block text-xs font-bold text-slate-700">
                  Akun Email / Username
                </label>
                <div class="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    [(ngModel)]="email"
                    placeholder="nama@perusahaan.com atau user@bbs.local"
                    class="block w-full appearance-none rounded-xl border border-slate-300 px-3.5 py-2.5 placeholder-slate-400 shadow-sm focus:border-navy-600 focus:outline-none focus:ring-1 focus:ring-navy-600 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label for="password" class="block text-xs font-bold text-slate-700">
                  Kata Sandi
                </label>
                <div class="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    [(ngModel)]="password"
                    placeholder="••••••••"
                    class="block w-full appearance-none rounded-xl border border-slate-300 px-3.5 py-2.5 placeholder-slate-400 shadow-sm focus:border-navy-600 focus:outline-none focus:ring-1 focus:ring-navy-600 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div class="pt-2">
                <button
                  type="submit"
                  [disabled]="isLoading()"
                  class="flex w-full justify-center items-center rounded-xl bg-navy-800 py-3 px-4 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-600 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                >
                  @if (isLoading()) {
                    <span class="inline-block animate-spin mr-2">⟳</span>
                  }
                  Masuk ke Aplikasi
                </button>
              </div>

              <!-- Note Informasi Manual Login -->
              <div class="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px] text-slate-500 leading-relaxed">
                ℹ️ <strong>Akun Mandiri:</strong> Gunakan akun email yang telah didaftarkan. Tidak memerlukan integrasi atau email aktif dari Google/Gmail.
              </div>
            </form>
          }

          <!-- ============================================== -->
          <!-- FORM 2: DAFTAR AKUN BARU (REGISTER)           -->
          <!-- ============================================== -->
          @if (activeTab() === 'register') {
            <form class="space-y-3.5" (ngSubmit)="onRegister()">
              <div>
                <label for="regName" class="block text-xs font-bold text-slate-700">
                  Nama Lengkap (Account Name)
                </label>
                <div class="mt-1">
                  <input
                    id="regName"
                    name="regName"
                    type="text"
                    required
                    [(ngModel)]="regName"
                    placeholder="Misal: Agus Setiawan"
                    class="block w-full appearance-none rounded-xl border border-slate-300 px-3.5 py-2 placeholder-slate-400 shadow-sm focus:border-navy-600 focus:outline-none focus:ring-1 focus:ring-navy-600 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label for="regEmail" class="block text-xs font-bold text-slate-700">
                  Alamat Email Akun
                </label>
                <div class="mt-1">
                  <input
                    id="regEmail"
                    name="regEmail"
                    type="email"
                    required
                    [(ngModel)]="regEmail"
                    placeholder="nama@perusahaan.com atau user@bbs.local"
                    class="block w-full appearance-none rounded-xl border border-slate-300 px-3.5 py-2 placeholder-slate-400 shadow-sm focus:border-navy-600 focus:outline-none focus:ring-1 focus:ring-navy-600 text-xs sm:text-sm"
                  />
                </div>
                <p class="mt-1 text-[10px] text-slate-400">
                  Dapat menggunakan format email perusahaan / username apa saja.
                </p>
              </div>

              <div>
                <label for="regDept" class="block text-xs font-bold text-slate-700">
                  Departemen / Divisi
                </label>
                <div class="mt-1">
                  <select
                    id="regDept"
                    name="regDept"
                    [(ngModel)]="regDepartment"
                    class="block w-full appearance-none rounded-xl border border-slate-300 px-3.5 py-2 text-xs sm:text-sm bg-white focus:border-navy-600 focus:outline-none"
                  >
                    <option value="HSE Operations">HSE Operations (K3L)</option>
                    <option value="Operasional Lapangan">Operasional Lapangan</option>
                    <option value="Konstruksi & Sipil">Konstruksi & Sipil</option>
                    <option value="Mekanikal & Elektrikal">Mekanikal & Elektrikal</option>
                    <option value="Logistik & Warehouse">Logistik & Gudang</option>
                    <option value="Manajemen Proyek">Manajemen Proyek</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label for="regPassword" class="block text-xs font-bold text-slate-700">
                    Kata Sandi
                  </label>
                  <div class="mt-1">
                    <input
                      id="regPassword"
                      name="regPassword"
                      type="password"
                      required
                      [(ngModel)]="regPassword"
                      placeholder="Min. 6 karakter"
                      class="block w-full appearance-none rounded-xl border border-slate-300 px-3 py-2 placeholder-slate-400 shadow-sm focus:border-navy-600 focus:outline-none focus:ring-1 focus:ring-navy-600 text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label for="regConfirmPassword" class="block text-xs font-bold text-slate-700">
                    Ulangi Sandi
                  </label>
                  <div class="mt-1">
                    <input
                      id="regConfirmPassword"
                      name="regConfirmPassword"
                      type="password"
                      required
                      [(ngModel)]="regConfirmPassword"
                      placeholder="••••••••"
                      class="block w-full appearance-none rounded-xl border border-slate-300 px-3 py-2 placeholder-slate-400 shadow-sm focus:border-navy-600 focus:outline-none focus:ring-1 focus:ring-navy-600 text-xs sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              <div class="pt-2">
                <button
                  type="submit"
                  [disabled]="isLoading()"
                  class="flex w-full justify-center items-center rounded-xl bg-emerald-700 py-3 px-4 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                >
                  @if (isLoading()) {
                    <span class="inline-block animate-spin mr-2">⟳</span>
                  }
                  Daftarkan Akun
                </button>
              </div>
            </form>
          }

          <div class="mt-6 text-center text-[11px] text-slate-400">
            BBS Genba Lapangan · MCS-01 Digital HSE System
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  activeTab = signal<'login' | 'register'>('login');
  
  // Login form
  email = '';
  password = '';

  // Register form
  regName = '';
  regEmail = '';
  regDepartment = 'HSE Operations';
  regPassword = '';
  regConfirmPassword = '';

  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  isLoading = this.auth.isLoading;

  setMode(mode: 'login' | 'register'): void {
    this.activeTab.set(mode);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  async onLoginEmail(): Promise<void> {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.email || !this.password) {
      this.errorMessage.set('Silakan isi email/username dan kata sandi.');
      return;
    }

    try {
      await this.auth.loginWithEmail(this.email.trim(), this.password);
      this.router.navigate(['/dashboard']);
    } catch (err: unknown) {
      this.errorMessage.set(this.formatAuthError(err, 'login'));
    }
  }

  async onRegister(): Promise<void> {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.regName.trim()) {
      this.errorMessage.set('Mohon masukkan Nama Lengkap akun.');
      return;
    }

    if (!this.regEmail.trim()) {
      this.errorMessage.set('Mohon masukkan Email akun.');
      return;
    }

    if (!this.regPassword || this.regPassword.length < 6) {
      this.errorMessage.set('Kata sandi minimal harus 6 karakter.');
      return;
    }

    if (this.regPassword !== this.regConfirmPassword) {
      this.errorMessage.set('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    try {
      await this.auth.registerWithEmail(
        this.regEmail.trim(),
        this.regPassword,
        this.regName.trim(),
        this.regDepartment
      );
      this.successMessage.set('Akun berhasil didaftarkan! Mengalihkan ke dashboard...');
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 1000);
    } catch (err: unknown) {
      this.errorMessage.set(this.formatAuthError(err, 'register'));
    }
  }

  private formatAuthError(err: unknown, action: 'login' | 'register'): string {
    const errorStr = (err instanceof Error ? err.message : String(err)).toLowerCase();

    if (errorStr.includes('user-not-found') || errorStr.includes('wrong-password') || errorStr.includes('invalid-credential')) {
      return 'Email akun atau kata sandi tidak cocok. Silakan periksa kembali.';
    }
    if (errorStr.includes('email-already-in-use')) {
      return 'Email akun ini sudah terdaftar. Silakan langsung masuk di tab Masuk Akun.';
    }
    if (errorStr.includes('invalid-email')) {
      return 'Format email tidak valid. Gunakan format seperti nama@perusahaan.com.';
    }
    if (errorStr.includes('weak-password')) {
      return 'Kata sandi terlalu lemah. Gunakan minimal 6 karakter.';
    }
    if (errorStr.includes('network-request-failed')) {
      return 'Gagal terhubung ke server. Periksa koneksi internet Anda.';
    }

    return action === 'login' 
      ? 'Gagal masuk. Periksa kembali akun dan kata sandi Anda.' 
      : 'Gagal mendaftarkan akun. Silakan coba kembali.';
  }
}
