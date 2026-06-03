# ADR-0029: Política de redondeo monetario en `Money`

- **Estado:** Aceptada · **Fecha:** 2026-06-02

## Contexto
La normativa peruana **redondea distinto según el cálculo** (CTS, gratificación, retenciones, cuotas). Un redondeo ad-hoc disperso por el código produce inconsistencias y errores difíciles de auditar.

## Decisión
Tipo **`Money`** (decimal + moneda) que **centraliza la política de redondeo** con **estrategias nombradas por concepto**. Ningún redondeo ad-hoc fuera de `Money`. Las calculadoras (ADR-0003) usan `Money` para todas las operaciones monetarias.

## Consecuencias
- ✅ Redondeo correcto, consistente y auditable por concepto.
- ✅ Cambios de política en un solo lugar.
- ⚠️ Disciplina: prohibido operar montos con `decimal` crudo en dominio (enforced por revisión).
