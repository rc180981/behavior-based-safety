import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { DashboardLintasProyekComponent } from './features/dashboard/dashboard-lintas-proyek.component';
import { ObservasiBaruComponent } from './features/observasi/observasi-baru.component';
import { ObservasiRiwayatComponent } from './features/observasi/observasi-riwayat.component';
import { TemuanSayaComponent } from './features/temuan/temuan-saya.component';
import { TemuanListComponent } from './features/temuan/temuan-list.component';
import { TemuanDetailComponent } from './features/temuan/temuan-detail.component';
import { AdminPanelComponent } from './features/admin/admin-panel.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'dashboard/lintas-proyek', component: DashboardLintasProyekComponent },
  { path: 'observasi/baru', component: ObservasiBaruComponent },
  { path: 'observasi/riwayat', component: ObservasiRiwayatComponent },
  { path: 'temuan-saya', component: TemuanSayaComponent },
  { path: 'temuan', component: TemuanListComponent },
  { path: 'temuan/:id', component: TemuanDetailComponent },
  { path: 'admin', component: AdminPanelComponent },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' },
];
