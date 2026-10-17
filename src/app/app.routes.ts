import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ObservasiBaruComponent } from './features/observasi/observasi-baru.component';
import { ObservasiRiwayatComponent } from './features/observasi/observasi-riwayat.component';
import { TemuanSayaComponent } from './features/temuan/temuan-saya.component';
import { AdminPanelComponent } from './features/admin/admin-panel.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'observasi/baru', component: ObservasiBaruComponent },
  { path: 'observasi/riwayat', component: ObservasiRiwayatComponent },
  { path: 'temuan-saya', component: TemuanSayaComponent },
  { path: 'admin', component: AdminPanelComponent },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' },
];
