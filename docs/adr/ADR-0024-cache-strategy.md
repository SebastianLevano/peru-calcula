# ADR-0024: Cache Strategy — cache-aside con IMemoryCache

- **Estado:** Aceptada · **Fecha:** 2026-06-02

## Contexto
Cada cálculo necesita los **parámetros vigentes** (UIT, RMV, topes, tasas). Consultarlos a PostgreSQL en **cada request** es innecesario: cambian con baja frecuencia y el portal es de alto tráfico.

## Decisión
**Cache-aside** con `IMemoryCache` de los parámetros vigentes en `ParametroService`. La caché se **invalida explícitamente** cuando el admin edita parámetros (ADR-0009). Sin Redis en el MVP (un solo nodo o pocos; se evaluará caché distribuida si se escala horizontalmente con fuerte coherencia).

## Consecuencias
- ✅ Elimina lecturas repetidas a DB en el path de cálculo; baja latencia.
- ✅ Invalidación coordinada con la edición admin → datos frescos sin reinicio.
- ⚠️ Con múltiples instancias, la invalidación in-memory es local: mitigable con TTL corto o caché distribuida cuando se escale.
