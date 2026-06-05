# Perú Calcula

Plataforma web pública y gratuita de **calculadoras financieras, laborales y tributarias** según la normativa peruana vigente, orientada a alto tráfico orgánico (SEO), confiabilidad y escalabilidad. Sin login de usuario final; cada resultado muestra su fuente legal y la fecha de la norma aplicada.

> **Estado actual:** aplicación **implementada y funcional en local** (Fases 0–4 + rediseño + SEO técnico). El despliegue a producción está **preparado pero en pausa**: por ahora el proyecto se ejecuta en `localhost`. Ver [Despliegue](#despliegue).

## Stack

- **Frontend:** Angular 21 (Standalone, Signals, Tailwind v4, Prerender/SSG + SSR)
- **Backend:** ASP.NET Core (.NET 10) — monolito modular, Clean Architecture pragmática (4 proyectos)
- **Datos:** PostgreSQL + EF Core
- **Infra:** Docker / Docker Compose · CI/CD con GitHub Actions · cloud-agnóstico

## Estructura del monorepo

```
peru-calcula/
├── apps/
│   ├── web/        # Angular 21 (prerender/SSG + SSR, Tailwind)
│   └── api/        # Solución .NET (PeruCalcula.slnx, 4 proyectos + tests)
│       ├── PeruCalcula.Api/            # Host: endpoints, middleware, DI, BackgroundServices
│       ├── PeruCalcula.Domain/         # Calculadoras puras + entidades, por contexto
│       ├── PeruCalcula.Infrastructure/ # EF Core, DbContext, migraciones, repos, caché
│       ├── PeruCalcula.Shared/         # Money, Result<T>, contratos inter-módulo, IClock
│       └── PeruCalcula.Tests/          # Unit + Golden + NetArchTest + Integration
├── docs/           # ARCHITECTURE.md · adr/ (38 ADRs) · normativa/
├── docker/         # Dockerfiles, nginx, scripts
└── docker-compose.yml · docker-compose.prod.yml
```

## Módulos y calculadoras

- **Laboral:** CTS · Gratificación · Vacaciones
- **Tributario:** NRUS · RER · Régimen MYPE Tributario · Recibos por Honorarios
- **Finanzas:** Crédito personal · Crédito vehicular · Crédito hipotecario · Comparador de préstamos (ranking por TCEA)

Además: guías normativas (markdown sanitizado + búsqueda FTS), panel admin para tasas/parámetros y analítica in-house anónima.

## Ejecutar en local

Requisitos: **.NET 10 SDK**, **Node.js 20+**, **PostgreSQL** (local o vía Docker).

### Opción A — Docker Compose (todo el stack)

```bash
docker-compose up -d        # PostgreSQL + API + Web
```

### Opción B — Servicios por separado (desarrollo)

**Backend** (`apps/api/`):

```bash
dotnet build PeruCalcula.slnx

# Migraciones (NUNCA auto-migrate en startup)
dotnet ef database update --project PeruCalcula.Infrastructure --startup-project PeruCalcula.Api

dotnet run --project PeruCalcula.Api        # API en http://localhost:5117
```

**Frontend** (`apps/web/`):

```bash
npm install
npm start                   # dev server en http://localhost:4200
npm run build               # build con prerender/SSG (HTML estático por ruta)
npm run serve:ssr:web       # sirve el build SSR (node) tras `npm run build`
```

## Tests

```bash
# Backend (apps/api/)
dotnet test --filter "Category!=Integration"   # unit + golden + NetArchTest
dotnet test --filter "Category=Integration"    # Testcontainers (requiere Docker)

# Frontend (apps/web/)
npm test            # Vitest
npm run e2e         # Playwright (requiere API + web levantados)
```

## SEO técnico

- **Canonical absoluto** (`https://perucalcula.pe`), Open Graph y `og:locale=es_PE` por ruta.
- **JSON-LD** inyectado en el HTML prerenderizado: `WebSite` + `WebApplication` + `FAQPage` (home), `SoftwareApplication` + `HowTo` + `BreadcrumbList` (calculadoras), `Article` + `BreadcrumbList` (guías).
- **Sitemap dinámico** con prioridades por tipo y `robots.txt`.
- **Enlazado interno**: cada calculadora enlaza su guía y calculadoras relacionadas; cada guía enlaza su calculadora (CTA) y guías relacionadas; footer-sitemap por módulo + guías destacadas.
- **Core Web Vitals**: fuentes self-hosted con `@font-face` + `preload` y `font-display: swap`; slots de anuncios con altura fija (CLS-safe).

## Despliegue

> **En pausa.** El proyecto **no se despliega por ahora**; solo se ejecuta en `localhost`.

La infraestructura de producción ya está codificada (`docker-compose.prod.yml`, nginx con SSL/HSTS y redirección www→apex, `cd.yml` con migraciones EF como paso explícito, `docker/setup-server.sh`). Antes de retomar el despliegue quedan pasos manuales: contratar VPS + DNS, configurar secrets en GitHub Actions, reemplazar placeholders (GA4, AdSense), exportar `og-image.svg` → `og-image.png` (1200×630) y crear el admin tras la primera migración.

## Documentación

- 📄 [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — documento técnico completo.
- 🧭 [`docs/adr/`](./docs/adr/README.md) — 38 Architecture Decision Records.
- ⚖️ [`docs/normativa/`](./docs/normativa/README.md) — fuentes legales por calculadora (base de los golden tests).

## Licencia

Proyecto privado. Los cálculos son referenciales y no constituyen asesoría legal o tributaria.
