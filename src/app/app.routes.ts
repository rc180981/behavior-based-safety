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
import { authGuard } from './core/guards/auth.guard';
import { adminGuard, superAdminGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { 
    path: 'dashboard', 
    component: DashboardComponent, 
    canActivate: [authGuard] 
  },
  { 
    path: 'dashboard/lintas-proyek', 
    component: DashboardLintasProyekComponent, 
    canActivate: [authGuard, superAdminGuard] 
  },
  { 
    path: 'observasi/baru', 
    component: ObservasiBaruComponent, 
    canActivate: [authGuard] 
  },
  { 
    path: 'observasi/riwayat', 
    component: ObservasiRiwayatComponent, 
    canActivate: [authGuard] 
  },
  { 
    path: 'temuan-saya', 
    component: TemuanSayaComponent, 
    canActivate: [authGuard] 
  },
  { 
    path: 'temuan', 
    component: TemuanListComponent, 
    canActivate: [authGuard] 
  },
  { 
    path: 'temuan/:id', 
    component: TemuanDetailComponent, 
    canActivate: [authGuard] 
  },
  { 
    path: 'admin', 
    component: AdminPanelComponent, 
    canActivate: [authGuard, adminGuard] 
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' },
];
