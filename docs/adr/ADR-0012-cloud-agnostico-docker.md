# ADR-0012: Cloud-agnóstico vía Docker

- **Estado:** Aceptada · **Fecha:** 2026-06-02

## Contexto
El producto debe poder desplegarse en **AWS o Azure** sin lock-in prematuro, y correr idéntico en local.

## Decisión
**Dockerizar** web y api; orquestar en local con Docker Compose. Configuración por **variables de entorno**; secretos en **Secrets Manager (AWS)** o **Key Vault (Azure)**. Sin servicios propietarios en el MVP.

## Consecuencias
- ✅ Portabilidad entre nubes; paridad dev/prod.
- ✅ Migración de nube de bajo costo.
- ⚠️ Algunas optimizaciones específicas de nube se posponen (aceptable).
