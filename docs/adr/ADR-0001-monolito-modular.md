# ADR-0001: Monolito modular (no microservicios)

- **Estado:** Aceptada · **Fecha:** 2026-06-02

## Contexto
Perú Calcula es un dominio de **cómputo intensivo con escritura mínima** (cálculos stateless, catálogo y parámetros de baja escritura). Los microservicios añadirían latencia de red, complejidad operativa y de despliegue sin un beneficio claro a esta escala.

## Decisión
Construir un **monolito modular** desplegado como un único backend ASP.NET Core, con fronteras de módulo **lógicas** (carpetas/namespaces, ver ADR-0011) y enforced por NetArchTest (ADR-0031).

## Consecuencias
- ✅ Un solo deploy, menos operación, latencia interna nula.
- ✅ Si un módulo lo justifica a futuro, puede extraerse a servicio independiente con bajo costo (las fronteras ya existen).
- ⚠️ Disciplina necesaria para no acoplar módulos (mitigado por ADR-0031).
