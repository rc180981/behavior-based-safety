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
          Masuk BBS Genba
        </h2>
        <p class="mt-2 text-center text-xs text-slate-600">
          Aplikasi Observasi Perilaku Keselamatan Kerja (Safety BBS)
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div class="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-100">
          
          <!-- Alert Pesan Error -->
          @if (errorMessage()) {
            <div class="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2.5">
              <svg class="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
              <span>{{ errorMessage() }}</span>
            </div>
          }

          <!-- Form Login -->
          <form class="space-y-4" (ngSubmit)="onLoginEmail()">
            <div>
              <label for="email" class="block text-xs font-bold text-slate-700">
                Email Pengguna / Akun
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
              <div class="flex items-center justify-between">
                <label for="password" class="block text-xs font-bold text-slate-700">
                  Kata Sandi
                </label>
              </div>
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
                class="flex w-full justify-center items-center rounded-xl bg-navy-800 py-3.5 px-4 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-600 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                @if (isLoading()) {
                  <span class="inline-block animate-spin mr-2">⟳</span>
                }
                Masuk ke Aplikasi
              </button>
            </div>
          </form>

          <!-- Informasi Pendaftaran Terpusat oleh Admin -->
          <div class="mt-6 p-4 bg-slate-50 border border-slate-200/90 rounded-2xl">
            <div class="flex items-start gap-2.5">
              <span class="text-base flex-shrink-0">🏢</span>
              <div class="text-[11px] text-slate-600 leading-relaxed">
                <p class="font-bold text-navy-950 mb-0.5">Pendaftaran Akun Terpusat</p>
                <p>
                  Akun pengguna dan peran (<strong>Petugas</strong>, <strong>Supervisor</strong>, atau <strong>Admin</strong>) didaftarkan langsung oleh <strong>Tim Admin HSE</strong>.
                </p>
                <p class="mt-1 text-slate-500">
                  Belum memiliki akses? Silakan hubungi Safety Officer / Administrator HSE proyek Anda.
                </p>
              </div>
            </div>
          </div>

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

  email = '';
  password = '';
  errorMessage = signal<string>('');
  isLoading = this.auth.isLoading;

  async onLoginEmail(): Promise<void> {
    this.errorMessage.set('');

    if (!this.email || !this.password) {
      this.errorMessage.set('Silakan isi email/username akun dan kata sandi.');
      return;
    }

    try {
      await this.auth.loginWithEmail(this.email.trim(), this.password);
      this.router.navigate(['/dashboard']);
    } catch (err: unknown) {
      this.errorMessage.set(this.formatAuthError(err));
    }
  }

  private formatAuthError(err: unknown): string {
    const errorStr = (err instanceof Error ? err.message : String(err)).toLowerCase();

    if (
      errorStr.includes('user-not-found') || 
      errorStr.includes('wrong-password') || 
      errorStr.includes('invalid-credential')
    ) {
      return 'Email akun atau kata sandi tidak cocok. Silakan periksa kembali atau hubungi Admin HSE.';
    }
    if (errorStr.includes('invalid-email')) {
      return 'Format email tidak valid. Gunakan format seperti nama@perusahaan.com.';
    }
    if (errorStr.includes('network-request-failed')) {
      return 'Gagal terhubung ke server. Periksa koneksi internet Anda.';
    }

    return 'Gagal masuk. Periksa kembali akun dan kata sandi Anda.';
  }
}
