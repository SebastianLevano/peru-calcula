# ADR-0023: Protección de API pública y postura ante scraping

- **Estado:** Aceptada · **Fecha:** 2026-06-02

## Contexto
El comparador (`GET /finanzas/comparador`) es **público**: un competidor podría **scrapear el catálogo de tasas** vía la propia API. Bloquearlo con CAPTCHA degradaría la UX pública y el SEO.

## Decisión
Mitigar **abuso**, no scraping de bajo volumen: **rate limiting por IP** + **límite de payload** + **detección de patrones de bulk**. **Sin CAPTCHA en endpoints públicos** (solo en login admin). Se asume **conscientemente** que los datos del comparador son **semi-públicos por naturaleza** (las tasas también se publican en los bancos).

## Consecuencias
- ✅ UX/SEO públicos intactos; se frena el abuso real.
- ✅ Decisión explícita y defendible sobre el riesgo de scraping.
- ⚠️ Scraping de bajo volumen es posible y aceptado; los datos son referenciales y con disclaimer.
