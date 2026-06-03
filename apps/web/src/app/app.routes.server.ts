import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Admin: client-side only (requiere auth, no debe prerenderizarse)
  { path: 'admin',       renderMode: RenderMode.Client },
  { path: 'admin/**',    renderMode: RenderMode.Client },

  // Guías: SSR por petición — el HTML incluye el contenido para que Google lo indexe
  { path: 'guias/:slug', renderMode: RenderMode.Server },

  // Todas las demás rutas se prerenderizan a HTML estático en build (ADR-13)
  { path: '**', renderMode: RenderMode.Prerender },
];
