import { Routes } from '@angular/router';
import { adminAuthGuard } from './admin-auth.guard';

export const adminRoutes: Routes = [
  // Login primero — sin guard, sin layout, sin ambigüedad
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(m => m.AdminLoginComponent),
  },
  // Área protegida: guard en el layout, aplica a todos los hijos
  {
    path: '',
    canActivate: [adminAuthGuard],
    loadComponent: () => import('./admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: '',          redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard.component').then(m => m.AdminDashboardComponent)   },
      { path: 'parametros',loadComponent: () => import('./parametros/parametros.component').then(m => m.AdminParametrosComponent) },
      { path: 'tasas',     loadComponent: () => import('./tasas/tasas.component').then(m => m.AdminTasasComponent)               },
      { path: 'bancos',    loadComponent: () => import('./bancos/bancos.component').then(m => m.AdminBancosComponent)            },
      { path: 'guias',     loadComponent: () => import('./guias/guias-admin.component').then(m => m.AdminGuiasComponent)        },
    ],
  },
];
