import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Admin: client-side only (no prerenderizar, no indexar)
  { path: 'admin',    renderMode: RenderMode.Client },
  { path: 'admin/**', renderMode: RenderMode.Client },

  // Guías individuales: SSR por petición para indexar contenido dinámico
  { path: 'guias/:slug', renderMode: RenderMode.Server },

  // Rutas estáticas conocidas: prerenderizadas en build (más rápidas, CDN-friendly)
  { path: '',                                renderMode: RenderMode.Prerender },
  { path: 'calculadora-cts',                 renderMode: RenderMode.Prerender },
  { path: 'calculadora-gratificacion',       renderMode: RenderMode.Prerender },
  { path: 'calculadora-vacaciones',          renderMode: RenderMode.Prerender },
  { path: 'calculadora-rus',                 renderMode: RenderMode.Prerender },
  { path: 'calculadora-rer',                 renderMode: RenderMode.Prerender },
  { path: 'calculadora-mype',                renderMode: RenderMode.Prerender },
  { path: 'calculadora-recibos-por-honorarios', renderMode: RenderMode.Prerender },
  { path: 'simulador-credito-personal',      renderMode: RenderMode.Prerender },
  { path: 'calculadora-credito-vehicular',   renderMode: RenderMode.Prerender },
  { path: 'calculadora-hipotecaria',         renderMode: RenderMode.Prerender },
  { path: 'comparador-de-prestamos',         renderMode: RenderMode.Prerender },
  { path: 'guias',                           renderMode: RenderMode.Prerender },
  { path: 'privacidad',                      renderMode: RenderMode.Prerender },
  { path: 'terminos',                        renderMode: RenderMode.Prerender },
  { path: 'acerca',                          renderMode: RenderMode.Prerender },

  // Cualquier ruta desconocida: SSR con status 404
  { path: '**', renderMode: RenderMode.Server, status: 404 },
];
