import { Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MODULOS, porModulo } from '../calculadoras';
import { guiasDestacadas } from '../guias';
import { LogoComponent } from './logo.component';

/**
 * Shell de navegación del sitio: header sticky + footer-sitemap + skip-link.
 * Tono profesional-privado (publicación financiera seria), no gubernamental.
 */
@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterModule, LogoComponent],
  template: `
    <a href="#contenido"
       class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60]
              focus:rounded-md focus:bg-primary-700 focus:px-4 focus:py-2 focus:text-white focus:shadow-pop">
      Saltar al contenido
    </a>

    <header class="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div class="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <a routerLink="/" class="flex items-center gap-2.5 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
           aria-label="Perú Calcula — inicio">
          <app-logo class="block h-8 w-8" />
          <span class="font-display text-lg font-semibold text-ink-900">Perú&nbsp;Calcula</span>
        </a>

        <nav class="ml-auto hidden items-center gap-1 md:flex" aria-label="Principal">
          @for (m of modulos; track m.id) {
            <a [routerLink]="['/']" [fragment]="m.id"
               class="rounded-md px-3 py-2 text-sm font-medium text-ink-600 hover:bg-primary-50 hover:text-primary-700
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600">
              {{ m.label }}
            </a>
          }
          <a routerLink="/guias"
             class="rounded-md px-3 py-2 text-sm font-medium text-ink-600 hover:bg-primary-50 hover:text-primary-700
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600">Guías</a>
        </nav>

        <button type="button" (click)="toggle()"
          class="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-md text-ink-700 hover:bg-primary-50 md:hidden
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
          [attr.aria-expanded]="abierto()" aria-controls="menu-movil" aria-label="Abrir menú">
          @if (!abierto()) {
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" d="M4 7h16M4 12h16M4 17h16"/></svg>
          } @else {
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" d="M6 6l12 12M18 6L6 18"/></svg>
          }
        </button>
      </div>

      @if (abierto()) {
        <nav id="menu-movil" class="border-t border-line bg-surface px-4 py-4 md:hidden" aria-label="Menú móvil">
          @for (m of modulos; track m.id) {
            <p class="px-1 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-ink-500 first:pt-0">{{ m.label }}</p>
            @for (c of porModulo(m.id); track c.slug) {
              <a [routerLink]="c.slug" (click)="cerrar()"
                 class="block rounded-md px-1 py-2 text-sm text-ink-700 hover:text-primary-700">{{ c.nav }}</a>
            }
          }
          <a routerLink="/guias" (click)="cerrar()" class="mt-3 block rounded-md px-1 py-2 text-sm font-medium text-primary-700">Todas las guías →</a>
        </nav>
      }
    </header>

    <div id="contenido">
      <ng-content />
    </div>

    <footer class="mt-16 border-t border-line bg-surface">
      <div class="mx-auto max-w-6xl px-4 py-12">
        <div class="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <div class="flex items-center gap-2.5">
              <app-logo class="block h-7 w-7" />
              <span class="font-display text-base font-semibold text-ink-900">Perú Calcula</span>
            </div>
            <p class="mt-3 max-w-xs text-sm text-ink-600">
              Calculadoras laborales, tributarias y financieras según la normativa peruana vigente. Gratis y sin registro.
            </p>
            <h2 class="mt-6 font-sans text-xs font-semibold uppercase tracking-wide text-ink-500">Guías destacadas</h2>
            <ul class="mt-3 space-y-2">
              @for (g of guiasDestacadas; track g.slug) {
                <li><a [routerLink]="['/guias', g.slug]" class="text-sm text-ink-600 hover:text-primary-700">{{ g.titulo }}</a></li>
              }
              <li><a routerLink="/guias" class="text-sm font-medium text-primary-700 hover:text-primary-800">Todas las guías →</a></li>
            </ul>
          </div>
          @for (m of modulos; track m.id) {
            <div>
              <h2 class="font-sans text-xs font-semibold uppercase tracking-wide text-ink-500">{{ m.label }}</h2>
              <ul class="mt-3 space-y-2">
                @for (c of porModulo(m.id); track c.slug) {
                  <li><a [routerLink]="c.slug" class="text-sm text-ink-600 hover:text-primary-700">{{ c.nav }}</a></li>
                }
              </ul>
            </div>
          }
        </div>

        <div class="mt-10 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-xs text-ink-500">© {{ anio }} Perú Calcula · Cálculos referenciales; no constituyen asesoría legal o tributaria.</p>
          <ul class="flex gap-4 text-xs">
            <li><a routerLink="/guias" class="text-ink-600 hover:text-primary-700">Guías</a></li>
            <li><a routerLink="/acerca" class="text-ink-600 hover:text-primary-700">Acerca</a></li>
            <li><a routerLink="/privacidad" class="text-ink-600 hover:text-primary-700">Privacidad</a></li>
            <li><a routerLink="/terminos" class="text-ink-600 hover:text-primary-700">Términos</a></li>
          </ul>
        </div>
      </div>
    </footer>
  `,
})
export class LayoutComponent {
  readonly modulos = MODULOS;
  readonly porModulo = porModulo;
  readonly guiasDestacadas = guiasDestacadas();
  readonly anio = new Date().getFullYear();
  readonly abierto = signal(false);

  toggle() { this.abierto.update(v => !v); }
  cerrar() { this.abierto.set(false); }
}
