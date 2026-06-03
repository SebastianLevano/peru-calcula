# ADR-0034: Accesibilidad WCAG 2.2 AA

- **Estado:** Aceptada · **Fecha:** 2026-06-02

## Contexto
El portal es de uso masivo y mayoritariamente móvil. La accesibilidad es un requisito de inclusión, de SEO y un diferencial de calidad (ADR-0022). "Accesible" sin medición es aspiracional.

## Decisión
Target explícito **WCAG 2.2 AA**: labels asociados, foco visible, contraste suficiente, navegación por teclado, roles ARIA donde aplique. **axe-core integrado en CI** (falla ante violaciones críticas).

## Consecuencias
- ✅ Accesibilidad verificable y sostenida (no se degrada entre PRs).
- ✅ Beneficio SEO y de marca.
- ⚠️ Algún costo de desarrollo por componente: parte del estándar de calidad.
