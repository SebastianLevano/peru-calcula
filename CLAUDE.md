# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Estado del proyecto

El diseño técnico está **completo y aprobado** (README, `docs/ARCHITECTURE.md`, 38 ADRs). El código **aún no existe**. El siguiente paso es **Fase 0 — scaffolding**: monorepo, solución .NET 4 proyectos, Angular 21 prerender/SSG, Docker Compose, CI y plataforma de calidad. Ver hoja de ruta en `docs/ARCHITECTURE.md §12`.

## Stack (inamovible)

- **Frontend:** Angular 21 (Standalone, Signals, Tailwind, Prerender/SSG)
- **Backend:** ASP.NET Core — monolito modular, Clean Architecture pragmática, 4 proyectos
- **Datos:** PostgreSQL + EF Core
- **Infra:** Docker / Docker Compose · GitHub Actions · cloud-agnóstico (sin microservicios)

No rediscutir: sin microservicios, sin CQRS/ES, sin Nx, sin SSR en F0/F1, monolingüe español (i18n fuera de roadmap).

## Estructura del monorepo (objetivo)

```
peru-calcula/
├── apps/web/       # Angular 21 prerender/SSG
├── apps/api/       # Solución .NET (4 proyectos)
│   ├── PeruCalcula.Api/            # Host, endpoints, middleware, DI, BackgroundServices
│   ├── PeruCalcula.Domain/         # Calculadoras puras + entidades, por contexto:
│   │                               #   Laboral/ Tributario/ Finanzas/ Catalogo/ Contenido/ Analytics/ Admin/
│   ├── PeruCalcula.Infrastructure/ # EF Core, DbContext, migraciones, repos, caché
│   └── PeruCalcula.Shared/         # Money, Result<T>, contratos inter-módulo, IClock, IParametroService
├── docs/
│   ├── ARCHITECTURE.md
│   ├── adr/        # ADR-0001…ADR-0038
│   └── normativa/  # Fuentes legales por calculadora (base de golden tests)
├── docker/
├── docker-compose.yml
└── .github/workflows/  # ci.yml · cd.yml
```

## Comandos de desarrollo

### Backend (.NET)
```bash
# Desde apps/api/
dotnet build
dotnet test
dotnet test --filter "Category=Unit"          # solo unit tests
dotnet test --filter "Category=Golden"        # golden tests normativos

# Migraciones (NUNCA auto-migrate en startup)
dotnet ef migrations add <Nombre> --project PeruCalcula.Infrastructure --startup-project PeruCalcula.Api
dotnet ef database update --project PeruCalcula.Infrastructure --startup-project PeruCalcula.Api
```

### Frontend (Angular)
```bash
# Desde apps/web/
npm install
npm run build          # build con prerender/SSG (genera HTML estático por ruta)
npm run build:prod
npm run start          # dev server (sin prerender)
npm test               # Karma/Jasmine
npm run lint           # ESLint
npm run axe            # axe-core accessibility check
```

### Docker
```bash
docker-compose up -d                  # levanta PostgreSQL + API + Web (dev)
docker-compose -f docker-compose.prod.yml up -d
```

## Arquitectura backend

**Regla de dependencia:** `Api → Domain ← Infrastructure ← Api; Shared ← todos`. Los módulos son **carpetas/namespaces** dentro de `Domain`, **no** proyectos separados. La comunicación inter-módulo ocurre **solo vía contratos en `Shared`** (DTOs, interfaces). Las referencias cruzadas directas entre carpetas de módulo están **prohibidas y validadas por NetArchTest en CI** (ADR-0031).

**Calculadoras:** funciones puras en `Domain`. Inputs validados (FluentValidation) + snapshot de parámetros vigentes → resultado con desglose + metadatos de confianza (`parametrosVersion`, `fechaCalculo`, `fuente`, `fechaActualizacionNormativa`, `disclaimer`). Nunca `DateTime.Now` directo: usar `IClock` inyectado.

**`Money`:** todos los montos monetarios usan el tipo `Money` del `Shared`. El redondeo es centralizado con estrategias nombradas por concepto (la norma peruana redondea distinto por cálculo). Cero redondeo ad-hoc fuera de `Money` (ADR-0029).

**`ParametroService` + caché (ADR-0024):** cache-aside con `IMemoryCache`. Los parámetros normativos (UIT, RMV, topes, etc.) se leen de la tabla `parametros` con vigencia temporal, se cachean y se **invalidan explícitamente** cuando el admin edita un valor. Nunca golpear PostgreSQL en cada cálculo.

**Analytics async (ADR-0025):** `POST /analytics/evento` encola fire-and-forget en un `Channel`; un `BackgroundService` hace batch insert. Sin Hangfire/Quartz en F0/F1.

**Errores de negocio:** `Result<T>`. Errores de request: `ProblemDetails` + FluentValidation.

## Arquitectura frontend

**Prerender/SSG (ADR-0013):** todas las rutas de calculadora y guías se prerenderizan a HTML estático en build (`ng build` con prerender nativo de Angular 21) y se sirven indexables desde CDN. No SPA-pura, no SSR dinámico en F0/F1.

**Estado en URL (ADR-0014):** `UrlStateService` sincroniza `signal()` de inputs ↔ query string. Cargar `/calculadora-cts?basico=2000&hijos=1` reconstruye el formulario y el resultado. Botón "Compartir" copia la URL completa.

**Consent (ADR-0026):** GA4 y ads bloqueados por defecto hasta opt-in (Ley 29733). La analítica in-house anónima funciona sin PII ni consentimiento. `dispositivo` se almacena como categoría derivada (`mobile|desktop|tablet`), nunca el user-agent crudo.

**Guías:** solo markdown sanitizado con allowlist, nunca HTML crudo administrable (riesgo XSS, ADR-0010).

## Modelo de datos (resumen)

| Tabla | Notas clave |
|---|---|
| `parametros` | `clave, valor, vigencia_desde, vigencia_hasta, fuente, xmin`. Cacheado; seed como código. `xmin` para optimistic concurrency. |
| `tasas_historicas` | Histórico no destructivo. `xmin` para optimistic concurrency en edición admin. |
| `guias` | `cuerpo_markdown` sanitizado; búsqueda con PostgreSQL FTS (ADR-0037). |
| `analytics_eventos` | Insert async en batch. `dispositivo` como categoría, sin PII/IP cruda. TTL configurado. |
| `analytics_rollups_diarios` | Fuente de los dashboards de producto. |
| `admin_refresh_tokens` | `token_hash` (nunca el token en claro). Rotación en cada uso; revocación en logout y al cambiar password. |

La DB guarda parámetros, catálogo/tasas, guías, analítica y admin. **Nunca PII del usuario final.**

## Testing (ADR-0028)

- **Unit puro:** calculadora vs casos en `docs/normativa/` (funciones puras, sin DB).
- **Golden/snapshot:** un cambio de UIT/RMV no debe alterar el recálculo de periodos pasados con los parámetros de esa época.
- **Integración:** Testcontainers (PostgreSQL real, no mocks de DB).
- **NetArchTest:** valida reglas inter-módulo en CI.
- **e2e:** Playwright (mínimo en F1; ampliado en F2).
- **Accesibilidad:** axe-core en CI sin violaciones críticas.

## CI/CD

- **CI (`ci.yml`):** build → test (unit + golden + integración) → NetArchTest → axe-core → Dependabot/dependency scan.
- **CD (`cd.yml`):** migraciones EF como **paso explícito controlado** (job dedicado antes del deploy), **no** auto-migrate en startup. Estrategia expand/contract. Staging como gate antes de prod.

## ADRs críticos

Cada decisión de arquitectura tiene su ADR en `docs/adr/`. Las más relevantes al escribir código:

| ADR | Implicación práctica |
|---|---|
| ADR-0003 | Calculadoras = funciones puras; `IClock` inyectado |
| ADR-0004 | Parámetros con vigencia temporal + `xmin` (optimistic concurrency) |
| ADR-0008 | Auth admin: JWT corto + refresh revocable; nunca token en claro en DB |
| ADR-0013 | Prerender/SSG, no SSR; sitemap en build/backend |
| ADR-0014 | Estado del formulario en query string |
| ADR-0023 | Rate limiting por IP en API pública; CAPTCHA solo en login admin |
| ADR-0024 | Cache-aside IMemoryCache; invalidación explícita desde admin |
| ADR-0025 | Analytics fire-and-forget via Channel + BackgroundService |
| ADR-0026 | GA4/ads bloqueados hasta opt-in; `dispositivo` = categoría derivada |
| ADR-0027 | Migraciones en CD, nunca auto-migrate en startup |
| ADR-0028 | Golden tests por versión normativa; Testcontainers; NetArchTest |
| ADR-0029 | Todo redondeo monetario pasa por `Money`; cero redondeo ad-hoc |
| ADR-0031 | Comunicación inter-módulo solo vía contratos en `Shared`; enforced por NetArchTest |
| ADR-0037 | Búsqueda de guías con PostgreSQL FTS; no Elasticsearch |
