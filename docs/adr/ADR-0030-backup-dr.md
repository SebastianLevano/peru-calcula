# ADR-0030: Backup & DR

- **Estado:** Aceptada · **Fecha:** 2026-06-02

## Contexto
La pérdida de parámetros normativos, tasas y contenido sería crítica. Un backup que **nunca se ha restaurado** no es un backup confiable.

## Decisión
- **PITR (Point-In-Time Recovery)** de PostgreSQL; objetivos **RPO/RTO** definidos.
- **Seed de parámetros como código** versionado (recuperable sin DB).
- **Prueba de restore mínima adelantada a F1/F2** (no dejarla para F4): restaurar sobre instancia limpia y verificar integridad de parámetros/tasas.
- **DR completo ejercitado en F4.**

## Consecuencias
- ✅ Recuperación verificada, no solo configurada.
- ✅ Parámetros recuperables desde código aunque falle la DB.
- ⚠️ La prueba de restore consume tiempo en F1/F2: se asume por su valor.
