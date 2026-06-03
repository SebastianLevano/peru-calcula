# ADR-0036: Feature Flags config-based

- **Estado:** Aceptada · **Fecha:** 2026-06-02

## Contexto
Se necesita activar/desactivar fases, monetización y prerender **sin redeploy**, pero un SaaS de flags (LaunchDarkly) es excesivo y costoso para esta escala.

## Decisión
**Feature flags basados en configuración** (appsettings + override por entorno/DB), expuestos al front vía `FeatureFlagService`. **Sin LaunchDarkly** ni proveedores externos.

## Consecuencias
- ✅ Activación gradual de funcionalidad y monetización sin redeploy.
- ✅ Cero costo y dependencia externa.
- ⚠️ Sin segmentación avanzada/targeting; suficiente para las necesidades actuales.
