import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Rutas dinámicas: SSG imposible sin datos; se sirven como SPA en edge/CDN
  { path: 'guias/:slug', renderMode: RenderMode.Client },

  // Todas las demás rutas se prerenderizan a HTML estático en build (ADR-13)
  { path: '**', renderMode: RenderMode.Prerender },
];
