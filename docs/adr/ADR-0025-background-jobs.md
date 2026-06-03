# ADR-0025: Background Jobs — Channel + BackgroundService

- **Estado:** Aceptada · **Fecha:** 2026-06-02

## Contexto
Insertar cada evento de analytics de forma **síncrona** en el path del request añade latencia y acopla el cálculo a la escritura. Un orquestador externo (Hangfire/Quartz) es excesivo para el MVP.

## Decisión
**Cola in-process** con `System.Threading.Channels` + un `BackgroundService` worker que hace **batch insert**. El endpoint **encola fire-and-forget**. El mismo mecanismo sirve para **PDF no bloqueante** (ADR-0015) y **rollups** (ADR-0033). **Sin Hangfire/Quartz** por ahora.

## Consecuencias
- ✅ Saca la escritura de analytics del path del request; throughput alto.
- ✅ Sin dependencias externas; simple de operar.
- ⚠️ Cola in-memory: eventos en vuelo se pierden si el proceso cae (aceptable para analítica no crítica; no se usa para datos transaccionales).
