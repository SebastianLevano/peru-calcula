# ADR-0022: Estrategia de portafolio profesional

- **Estado:** Aceptada · **Fecha:** 2026-06-02

## Contexto
Además de ser un producto real, Perú Calcula debe **demostrar capacidades Full Stack de nivel profesional**. Esto es un criterio de decisión legítimo cuando hay empate técnico.

## Decisión
El proyecto debe demostrar:
- **Frontend:** Angular 21, Signals, Tailwind, SEO (prerender/SSG), accesibilidad (WCAG 2.2 AA).
- **Backend:** ASP.NET Core, Clean Architecture pragmática, EF Core, PostgreSQL.
- **DevOps:** Docker, GitHub Actions, CI/CD, entornos dev/staging/prod.
- **Producto:** analytics, SEO, contenido, monetización preparada, cumplimiento.

Las decisiones futuras se evalúan también bajo este objetivo.

## Consecuencias
- ✅ Coherencia y calidad demostrable end-to-end.
- ⚠️ No debe llevar a sobreingeniería: prevalece "valor sobre complejidad" (los ADRs negativos lo acotan).
