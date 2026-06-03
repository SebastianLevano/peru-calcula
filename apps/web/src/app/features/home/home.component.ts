import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SeoService } from '../../core/seo.service';
import { BadgeComponent } from '../../shared/components/badge.component';
import { MODULOS, CALCULADORAS, porModulo, MODULO_LABEL, type Modulo } from '../../shared/calculadoras';

const MODULO_TONE: Record<Modulo, 'laboral' | 'tributario' | 'finanzas'> = {
  laboral: 'laboral', tributario: 'tributario', finanzas: 'finanzas',
};

const FAQ = [
  { q: '¿Los cálculos son exactos?',             a: 'Sí, están basados en la normativa peruana vigente (D. Leg., Leyes y Resoluciones citadas). Son referenciales: para casos con particularidades legales te recomendamos consultar a un especialista.' },
  { q: '¿Necesito crear una cuenta?',             a: 'No. Todas las calculadoras son gratuitas y funcionan sin registro.' },
  { q: '¿Con qué frecuencia se actualizan?',      a: 'Cada vez que cambia la UIT, la RMV u otro parámetro normativo. La ficha de auditoría en cada resultado muestra la fecha de la norma vigente.' },
  { q: '¿Puedo compartir o guardar mi resultado?', a: 'Sí. El botón "Compartir" copia la URL con tus datos ya ingresados para que la puedas guardar o enviar. También puedes descargar el resultado en PDF.' },
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, BadgeComponent],
  template: `
    <main>
      <!-- Hero -->
      <section class="border-b border-line bg-surface py-16 px-4" aria-label="Presentación">
        <div class="mx-auto max-w-3xl space-y-6 text-center">
          <p class="text-sm font-semibold uppercase tracking-widest text-primary-600">Calculadoras peruanas</p>
          <h1 class="font-display text-4xl font-semibold leading-tight tracking-tight text-ink-900 sm:text-5xl">
            Calcula tus derechos<br class="hidden sm:block"> y obligaciones con precisión
          </h1>
          <p class="mx-auto max-w-xl text-lg text-ink-600">
            CTS, gratificaciones, honorarios, NRUS y créditos calculados según la normativa peruana vigente — con la fuente y la fecha de la norma a la vista.
          </p>
          <ul class="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-ink-600" role="list">
            <li class="flex items-center gap-1.5">
              <svg class="h-4 w-4 text-primary-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.7-9.3a1 1 0 0 0-1.4-1.4L9 10.6 7.7 9.3a1 1 0 0 0-1.4 1.4l2 2a1 1 0 0 0 1.4 0l4-4Z" clip-rule="evenodd"/></svg>
              Fuente normativa visible
            </li>
            <li class="flex items-center gap-1.5">
              <svg class="h-4 w-4 text-primary-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.7-9.3a1 1 0 0 0-1.4-1.4L9 10.6 7.7 9.3a1 1 0 0 0-1.4 1.4l2 2a1 1 0 0 0 1.4 0l4-4Z" clip-rule="evenodd"/></svg>
              Gratis, sin registro
            </li>
            <li class="flex items-center gap-1.5">
              <svg class="h-4 w-4 text-primary-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.7-9.3a1 1 0 0 0-1.4-1.4L9 10.6 7.7 9.3a1 1 0 0 0-1.4 1.4l2 2a1 1 0 0 0 1.4 0l4-4Z" clip-rule="evenodd"/></svg>
              Parámetros actualizados
            </li>
          </ul>
        </div>
      </section>

      <!-- Calculadoras por módulo -->
      <section class="mx-auto max-w-5xl px-4 py-14 space-y-12">
        @for (modulo of modulos; track modulo.id) {
          <div [id]="modulo.id">
            <h2 class="font-display text-xl font-semibold text-ink-900 mb-5">{{ modulo.label }}</h2>
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              @for (calc of porModulo(modulo.id); track calc.slug) {
                <a [routerLink]="calc.slug"
                   class="group relative flex flex-col rounded-card border border-line bg-surface p-5 shadow-card
                          hover:border-primary-200 hover:shadow-pop transition-all
                          focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2">
                  <div class="flex items-center justify-between">
                    <app-badge [tone]="modulo.id">{{ MODULO_LABEL[modulo.id] }}</app-badge>
                    @if (calc.esNueva) {
                      <app-badge tone="nuevo">Nuevo</app-badge>
                    }
                  </div>
                  <h3 class="mt-3 font-semibold text-ink-900 group-hover:text-primary-700 transition-colors">{{ calc.titulo }}</h3>
                  <p class="mt-1 line-clamp-2 text-sm text-ink-600">{{ calc.descripcion }}</p>
                  <span class="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary-600 group-hover:underline" aria-hidden="true">
                    Calcular ahora
                    <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
                  </span>
                </a>
              }
            </div>
          </div>
        }
      </section>

      <!-- FAQ -->
      <section class="border-t border-line bg-surface py-14 px-4">
        <div class="mx-auto max-w-3xl">
          <h2 class="font-display text-2xl font-semibold text-ink-900 mb-8">Preguntas frecuentes</h2>
          <dl class="divide-y divide-line">
            @for (item of faq; track item.q) {
              <div class="py-5">
                <dt class="font-semibold text-ink-900">{{ item.q }}</dt>
                <dd class="mt-2 text-sm text-ink-600">{{ item.a }}</dd>
              </div>
            }
          </dl>
          <p class="mt-8 text-center">
            <a routerLink="/guias" class="text-sm font-medium text-primary-700 underline underline-offset-2 hover:text-primary-800">
              Ver todas las guías sobre normativa peruana →
            </a>
          </p>
        </div>
      </section>
    </main>
  `,
})
export class HomeComponent implements OnInit {
  private readonly seo = inject(SeoService);

  readonly modulos    = MODULOS;
  readonly MODULO_LABEL = MODULO_LABEL;
  readonly porModulo  = porModulo;
  readonly faq        = FAQ;

  ngOnInit() {
    this.seo.set({
      title: 'Calculadoras Laborales, Tributarias y Financieras para Perú',
      description: 'CTS, gratificación, vacaciones, recibos por honorarios, NRUS, RER y créditos calculados según la normativa peruana vigente. Gratis y sin registro.',
      canonical: '/',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Perú Calcula',
          url: 'https://perucalcula.pe',
          description: 'Calculadoras laborales, tributarias y financieras según normativa peruana.',
        },
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: FAQ.map(f => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        },
        {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Calculadoras disponibles',
          itemListElement: CALCULADORAS.map((c, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: c.titulo,
            url: `https://perucalcula.pe${c.slug}`,
          })),
        },
      ],
    });
  }
}
