# ADR-0027: Migraciones EF en producción (expand/contract)

- **Estado:** Aceptada · **Fecha:** 2026-06-02

## Contexto
Aplicar migraciones automáticamente en el **startup** de la app es riesgoso: condiciones de carrera entre instancias, despliegues que rompen prod, y dificultad de rollback.

## Decisión
- **Sin auto-migrate en startup.**
- Estrategia **expand/contract**: cambios compatibles hacia atrás (primero expandir el esquema, desplegar código, luego contraer).
- Migraciones ejecutadas como **paso explícito y controlado** del pipeline CD (job dedicado), con plan de rollback.
- **Seed de parámetros como código** versionado (ADR-0030).

## Consecuencias
- ✅ Despliegues seguros y reversibles; sin carreras entre instancias.
- ✅ Compatible con despliegues blue/green o rolling.
- ⚠️ Requiere disciplina de diseño de migraciones (dos pasos para cambios incompatibles).
