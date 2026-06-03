# ADR-0021: North Star Metric — "Cálculos completados"

- **Estado:** Aceptada · **Fecha:** 2026-06-02

## Contexto
Se necesita una métrica única que capture el **valor entregado** al usuario y guíe las decisiones de producto, sin almacenar PII.

## Decisión
North Star = **"Cálculos completados"**. Se mide el embudo: **inicio de cálculo → cálculo completado → exportación PDF → click de afiliado (futuro)**. Eventos anónimos en `analytics_eventos` (ADR-0006), encolados async (ADR-0025), agregados en rollups (ADR-0033).

## Consecuencias
- ✅ Foco claro de producto; mide adopción real de cada calculadora.
- ✅ La tasa de completado (completados/inicios) detecta fricción en formularios.
- ⚠️ Requiere instrumentar el front consistentemente en cada calculadora.
