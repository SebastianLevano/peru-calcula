import { Routes } from '@angular/router';
import { adminAuthGuard } from './admin-auth.guard';

export const adminRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: '',          redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard.component').then(m => m.AdminDashboardComponent),  canActivate: [adminAuthGuard] },
      { path: 'parametros',loadComponent: () => import('./parametros/parametros.component').then(m => m.AdminParametrosComponent),canActivate: [adminAuthGuard] },
      { path: 'tasas',     loadComponent: () => import('./tasas/tasas.component').then(m => m.AdminTasasComponent),              canActivate: [adminAuthGuard] },
      { path: 'bancos',    loadComponent: () => import('./bancos/bancos.component').then(m => m.AdminBancosComponent),           canActivate: [adminAuthGuard] },
      { path: 'guias',     loadComponent: () => import('./guias/guias-admin.component').then(m => m.AdminGuiasComponent),       canActivate: [adminAuthGuard] },
    ],
  },
  { path: 'login', loadComponent: () => import('./login/login.component').then(m => m.AdminLoginComponent) },
];
