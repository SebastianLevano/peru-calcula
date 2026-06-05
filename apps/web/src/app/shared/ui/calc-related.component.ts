import { Component, Input, computed, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { calcPorSlug, calcsRelacionadas } from '../calculadoras';
import { guiaPorSlug } from '../guias';

/**
 * Bloque de enlazado interno al pie de cada calculadora (SEO):
 *  - Link a la guía relacionada ("¿Cómo se calcula? Ver guía completa →"), si existe.
 *  - "También puede interesarte": 2 calculadoras del mismo módulo.
 * Siempre visible (no depende del resultado) para que el crawler vea los enlaces.
 */
@Component({
  selector: 'app-calc-related',
  standalone: true,
  imports: [RouterModule],
  template: `
    <section class="mx-auto max-w-2xl px-4 pb-12" aria-label="Contenido relacionado">
      @if (guia()) {
        <a [routerLink]="['/guias', guia()!.slug]"
           class="group flex items-center justify-between gap-4 rounded-card border border-primary-100 bg-primary-50 p-4
                  hover:border-primary-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600">
          <span class="text-sm">
            <span class="block font-semibold text-primary-800">¿Cómo se calcula?</span>
            <span class="text-primary-700">{{ guia()!.titulo }}</span>
          </span>
          <span class="shrink-0 text-sm font-medium text-primary-700 group-hover:underline">Ver guía →</span>
        </a>
      }

      @if (otras().length) {
        <h2 class="mt-10 font-display text-lg font-semibold text-ink-900">También puede interesarte</h2>
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          @for (c of otras(); track c.slug) {
            <a [routerLink]="c.slug"
               class="group flex flex-col rounded-card border border-line bg-surface p-4 shadow-card
                      hover:border-primary-200 hover:shadow-pop transition-all
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600">
              <span class="font-semibold text-ink-900 group-hover:text-primary-700">{{ c.titulo }}</span>
              <span class="mt-1 line-clamp-2 text-sm text-ink-600">{{ c.descripcion }}</span>
            </a>
          }
        </div>
      }
    </section>
  `,
})
export class CalcRelatedComponent {
  private readonly _slug = signal('');
  /** Ruta canónica de la calculadora actual, p.ej. '/calculadora-cts'. */
  @Input({ required: true }) set slug(value: string) { this._slug.set(value); }

  readonly guia = computed(() => {
    const calc = calcPorSlug(this._slug());
    return calc?.guiaSlug ? guiaPorSlug(calc.guiaSlug) ?? null : null;
  });
  readonly otras = computed(() => calcsRelacionadas(this._slug(), 2));
}
