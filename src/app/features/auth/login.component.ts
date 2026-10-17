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
              <div>
                <span class="font-bold block">Gagal Masuk</span>
                <span>{{ errorMessage() }}</span>
              </div>
            </div>
          }

          <!-- Form Login -->
          <form class="space-y-4" (ngSubmit)="onLoginEmail()">
            <div>
              <label for="email" class="block text-xs font-bold text-slate-700">
                Email Pengguna / ID Akun
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
              <div class="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  required
                  [(ngModel)]="password"
                  placeholder="••••••••"
                  class="block w-full appearance-none rounded-xl border border-slate-300 pl-3.5 pr-10 py-2.5 placeholder-slate-400 shadow-sm focus:border-navy-600 focus:outline-none focus:ring-1 focus:ring-navy-600 text-xs sm:text-sm"
                />
                <button
                  type="button"
                  (click)="showPassword.set(!showPassword())"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs"
                >
                  {{ showPassword() ? 'Sembunyikan' : 'Lihat' }}
                </button>
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

          <!-- Quick Test Accounts (Auto-fill) -->
          <div class="mt-6 pt-5 border-t border-slate-200/80">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Pilih Cepat Akun Demo (Klik untuk Isi Otomatis):
            </span>
            <div class="space-y-1.5 text-xs">
              <button
                type="button"
                (click)="fillCredentials('rc180981@gmail.com', 'Password123!')"
                class="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-navy-600 hover:bg-slate-50 transition-all flex items-center justify-between"
              >
                <div>
                  <span class="font-bold text-navy-900">⚙️ Admin HSE</span>
                  <span class="text-slate-500 block text-[11px]">rc180981&#64;gmail.com</span>
                </div>
                <span class="text-[10px] font-bold bg-navy-100 text-navy-800 px-2 py-0.5 rounded-md">Isi Form</span>
              </button>

              <button
                type="button"
                (click)="fillCredentials('budi.supervisor@perusahaan.com', 'Password123!')"
                class="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-navy-600 hover:bg-slate-50 transition-all flex items-center justify-between"
              >
                <div>
                  <span class="font-bold text-navy-900">🔍 Supervisor (Verifikator)</span>
                  <span class="text-slate-500 block text-[11px]">budi.supervisor&#64;perusahaan.com</span>
                </div>
                <span class="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">Isi Form</span>
              </button>

              <button
                type="button"
                (click)="fillCredentials('agus.safety@perusahaan.com', 'Password123!')"
                class="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-navy-600 hover:bg-slate-50 transition-all flex items-center justify-between"
              >
                <div>
                  <span class="font-bold text-navy-900">👷 Petugas Lapangan (Genba)</span>
                  <span class="text-slate-500 block text-[11px]">agus.safety&#64;perusahaan.com</span>
                </div>
                <span class="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">Isi Form</span>
              </button>
            </div>
            <div class="mt-2 text-[10px] text-slate-400 text-center">
              Kata sandi standar seluruh akun: <strong class="text-slate-600 font-mono">Password123!</strong>
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
  showPassword = signal<boolean>(false);
  errorMessage = signal<string>('');
  isLoading = this.auth.isLoading;

  fillCredentials(email: string, pass: string): void {
    this.email = email;
    this.password = pass;
    this.errorMessage.set('');
  }

  async onLoginEmail(): Promise<void> {
    this.errorMessage.set('');

    const cleanEmail = this.email.trim();
    const cleanPass = this.password.trim();

    if (!cleanEmail || !cleanPass) {
      this.errorMessage.set('Silakan isi email/username akun dan kata sandi.');
      return;
    }

    try {
      await this.auth.loginWithEmail(cleanEmail, cleanPass);
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
      return 'Email akun atau kata sandi tidak cocok. Pastikan menggunakan sandi Password123! (huruf P kapital dan tanda seru).';
    }
    if (errorStr.includes('invalid-email')) {
      return 'Format email tidak valid. Gunakan format seperti nama@perusahaan.com.';
    }
    if (errorStr.includes('network-request-failed')) {
      return 'Gagal terhubung ke server Firebase. Periksa koneksi internet Anda.';
    }

    return 'Gagal masuk. Periksa kembali akun dan kata sandi Anda.';
  }
}
