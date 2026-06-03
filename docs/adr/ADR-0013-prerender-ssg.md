# ADR-0013: Prerender/SSG estático (reemplaza ADR-0005 y la SPA-pura)

- **Estado:** Aceptada · **Fecha:** 2026-06-02 · **Reemplaza:** ADR-0005

## Contexto
SEO es requisito de primera clase, pero el **SSR dinámico es caro** de operar para un equipo pequeño. Un enfoque "SPA pura + SSR diferido" descartaba erróneamente también el **prerender/SSG**, que es barato y suficiente para páginas cuyo contenido base es conocido en build.

## Decisión
Usar **prerender/SSG nativo de Angular 21**: todas las rutas de calculadora y guías se generan como **HTML estático indexable** en build y se sirven desde CDN; la página hidrata a SPA interactiva. El **sitemap se genera en build/backend** (no desde la SPA). El **SSR dinámico** queda diferido a **F3** y solo si la indexación lo exige.

## Consecuencias
- ✅ HTML indexable sin costo operativo de SSR; CDN absorbe el tráfico de lectura.
- ✅ Excelentes Core Web Vitals.
- ⚠️ Contenido muy dinámico por-request no se prerenderiza; se cubre con hidratación o, si hiciera falta, SSR en F3.
