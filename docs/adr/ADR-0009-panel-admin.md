# ADR-0009: Panel Admin web

- **Estado:** Aceptada · **Fecha:** 2026-06-02

## Contexto
Las tasas y parámetros normativos cambian con frecuencia. El negocio necesita **autonomía** para actualizarlos sin depender de un desarrollador ni de un redeploy.

## Decisión
Construir un **panel admin web** protegido (auth de ADR-0008) para CRUD de parámetros, tasas, bancos, productos y guías. La edición de parámetros **invalida la caché** (ADR-0024) y respeta optimistic concurrency (ADR-0004).

## Consecuencias
- ✅ Actualización de normativa/tasas en minutos, sin código.
- ✅ Cambios auditados (`audit_log`, ADR-0033).
- ⚠️ Mayor trabajo inicial vs. seeds/JSON, justificado por la autonomía operativa.
