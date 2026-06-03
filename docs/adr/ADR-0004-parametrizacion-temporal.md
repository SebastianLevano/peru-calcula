# ADR-0004: Parametrización temporal + optimistic concurrency

- **Estado:** Aceptada · **Fecha:** 2026-06-02

## Contexto
Valores normativos (UIT, RMV, asignación familiar, topes, tasas) **cambian en el tiempo** y no pueden hardcodearse ni requerir redeploy. Además, el recálculo de periodos pasados debe usar el valor **vigente en esa fecha**.

## Decisión
Tabla `parametros` con `clave`, `valor`, `fuente` y **vigencia** (`vigencia_desde`/`vigencia_hasta`). La resolución es por fecha. Edición desde el panel admin (ADR-0009) con **optimistic concurrency** vía `xmin`/rowversion en `parametros` y `tasas_historicas`.

## Consecuencias
- ✅ Actualizar normativa sin tocar código; recálculo histórico correcto.
- ✅ `xmin` evita que dos ediciones admin se pisen; incluido desde F1 para no migrar después.
- ⚠️ En MVP de un solo admin el riesgo de conflicto es bajo, pero el campo ya está presente.
