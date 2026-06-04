import { HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';

/**
 * En SSR (Node.js), las URLs relativas de la API no funcionan.
 * Este interceptor las hace absolutas usando la variable de entorno API_URL.
 * En el browser no hace nada — el nginx proxea /api/ al backend.
 */
export function ssrUrlInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  if (!isPlatformServer(inject(PLATFORM_ID))) return next(req);

  // Solo afecta URLs que empiezan por /api/ (relativas)
  if (!req.url.startsWith('/api/')) return next(req);

  const apiUrl = (typeof process !== 'undefined' && process.env['API_URL'])
    || 'http://localhost:5117';

  return next(req.clone({ url: `${apiUrl}${req.url}` }));
}
