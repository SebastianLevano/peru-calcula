import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * Archivos estáticos del bundle Angular (js, css, fuentes, imágenes, robots.txt…)
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Sitemap dinámico: proxeado desde el API backend para incluir guías publicadas.
 * En producción el nginx también puede hacer este proxy directamente.
 */
app.get('/sitemap.xml', async (req, res) => {
  try {
    const apiUrl = process.env['API_URL'] || 'http://localhost:5117';
    const response = await fetch(`${apiUrl}/sitemap.xml`, {
      headers: { 'X-Forwarded-Host': req.headers.host ?? '' },
    });
    const body = await response.text();
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hora
    res.send(body);
  } catch {
    res.status(503).send('<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>');
  }
});

/**
 * Todas las demás rutas: Angular SSR
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => {
      if (!response) return next();
      // Angular devuelve 200 para rutas 404 — lo corregimos inspeccionando el status
      writeResponseToNodeResponse(response, res);
    })
    .catch(next);
});

/**
 * Arrancar el servidor si se ejecuta directamente o via PM2.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
