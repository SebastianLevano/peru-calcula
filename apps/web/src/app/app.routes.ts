import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },

  // Laboral
  { path: 'calculadora-cts',           loadComponent: () => import('./features/laboral/cts/cts.component').then(m => m.CtsComponent) },
  { path: 'calculadora-gratificacion', loadComponent: () => import('./features/laboral/gratificacion/gratificacion.component').then(m => m.GratificacionComponent) },
  { path: 'calculadora-vacaciones',    loadComponent: () => import('./features/laboral/vacaciones/vacaciones.component').then(m => m.VacacionesComponent) },

  // Tributario
  { path: 'calculadora-rus',                    loadComponent: () => import('./features/tributario/nrus/nrus.component').then(m => m.NrusComponent) },
  { path: 'calculadora-rer',                    loadComponent: () => import('./features/tributario/rer/rer.component').then(m => m.RerComponent) },
  { path: 'calculadora-mype',                   loadComponent: () => import('./features/tributario/mype/mype.component').then(m => m.MypeComponent) },
  { path: 'calculadora-recibos-por-honorarios', loadComponent: () => import('./features/tributario/recibos-honorarios/recibos-honorarios.component').then(m => m.RecibosHonorariosComponent) },

  // Finanzas
  { path: 'simulador-credito-personal',    loadComponent: () => import('./features/finanzas/credito-personal/credito-personal.component').then(m => m.CreditoPersonalComponent) },
  { path: 'calculadora-credito-vehicular', loadComponent: () => import('./features/finanzas/credito-vehicular/credito-vehicular.component').then(m => m.CreditoVehicularComponent) },
  { path: 'calculadora-hipotecaria',       loadComponent: () => import('./features/finanzas/credito-hipotecario/credito-hipotecario.component').then(m => m.CreditoHipotecarioComponent) },
  { path: 'comparador-de-prestamos',       loadComponent: () => import('./features/finanzas/comparador/comparador.component').then(m => m.ComparadorComponent) },

  // Guías
  { path: 'guias',       loadComponent: () => import('./features/guias/guias-listado.component').then(m => m.GuiasListadoComponent) },
  { path: 'guias/:slug', loadComponent: () => import('./features/guias/guia-detalle.component').then(m => m.GuiaDetalleComponent) },

  { path: '**', redirectTo: '' },
];
