import { Component, inject, signal, computed, OnInit, Input, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiClientService } from '../../core/api-client.service';
import { SeoService } from '../../core/seo.service';
import { BadgeComponent } from '../../shared/components/badge.component';
import { SkeletonComponent } from '../../shared/components/skeleton.component';
import { calcPorGuia } from '../../shared/calculadoras';
import { guiasRelacionadas, type GuiaRef } from '../../shared/guias';

interface GuiaDetalle {
  slug: string; titulo: string; resumen: string; cuerpoMarkdown: string;
  calculadoraRelacionada?: string; metaTitle?: string; metaDescription?: string;
  actualizadoEn: string;
}

@Component({
  selector: 'app-guia-detalle',
  standalone: true,
  imports: [RouterModule, DatePipe, BadgeComponent, SkeletonComponent],
  template: `
    <main class="mx-auto max-w-3xl px-4 py-10">
      @if (cargando()) {
        <div class="space-y-4 py-8" aria-busy="true" aria-label="Cargando guía">
          <app-skeleton class="block h-8 w-2/3"></app-skeleton>
          <app-skeleton [lines]="4"></app-skeleton>
        </div>
      } @else if (!guia()) {
        <div class="py-16 text-center">
          <p class="text-ink-600">Guía no encontrada.</p>
          <a routerLink="/guias"
             class="mt-4 inline-block text-sm font-medium text-primary-700 underline underline-offset-2 hover:text-primary-800">
            ← Ver todas las guías
          </a>
        </div>
      } @else {
        <article>
          <nav aria-label="Navegación de contenido" class="mb-6 flex items-center gap-2 text-sm text-ink-500">
            <a routerLink="/" class="hover:text-primary-700">Inicio</a>
            <span aria-hidden="true">/</span>
            <a routerLink="/guias" class="hover:text-primary-700">Guías</a>
            <span aria-hidden="true">/</span>
            <span class="text-ink-700" aria-current="page">{{ guia()!.titulo }}</span>
          </nav>

          <header class="space-y-3 border-b border-line pb-6">
            @if (guia()!.calculadoraRelacionada) {
              <app-badge tone="laboral">{{ guia()!.calculadoraRelacionada }}</app-badge>
            }
            <h1 class="font-display text-3xl font-semibold text-ink-900 sm:text-4xl">{{ guia()!.titulo }}</h1>
            <p class="text-ink-600">{{ guia()!.resumen }}</p>
            <p class="text-xs text-ink-500">
              Actualizado el {{ guia()!.actualizadoEn | date: 'd \\'de\\' MMMM \\'de\\' y' : '' : 'es' }}
            </p>
          </header>

          <!-- CTA a la calculadora relacionada (enlazado interno prominente) -->
          @if (calc()) {
            <a [routerLink]="calc()!.slug"
               class="group mt-6 flex items-center justify-between gap-4 rounded-card border border-primary-200 bg-primary-50 p-5
                      hover:border-primary-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600">
              <span class="text-sm">
                <span class="block font-semibold text-primary-800">{{ calc()!.titulo }}</span>
                <span class="text-primary-700">Hazlo automáticamente con la calculadora.</span>
              </span>
              <span class="shrink-0 rounded-input bg-primary-700 px-4 py-2 text-sm font-semibold text-white group-hover:bg-primary-800">
                Calcula ahora →
              </span>
            </a>
          }

          <!-- Contenido renderizado: SSR entrega HTML al crawler; browser lo sanitiza con DOMPurify -->
          <div class="prose prose-stone mt-8 max-w-none
                      prose-headings:font-display prose-headings:text-ink-900
                      prose-a:text-primary-700 prose-a:no-underline hover:prose-a:underline
                      prose-strong:text-ink-900 prose-code:text-ink-700"
               [innerHTML]="htmlSanitizado()">
          </div>

          <!-- Guías relacionadas al pie -->
          @if (relacionadas().length) {
            <footer class="mt-12 border-t border-line pt-6">
              <h2 class="font-display text-lg font-semibold text-ink-900">Guías relacionadas</h2>
              <ul class="mt-4 grid gap-3 sm:grid-cols-2">
                @for (g of relacionadas(); track g.slug) {
                  <li>
                    <a [routerLink]="['/guias', g.slug]"
                       class="block rounded-card border border-line bg-surface p-4 text-sm font-medium text-ink-800 shadow-card
                              hover:border-primary-200 hover:text-primary-700
                              focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600">
                      {{ g.titulo }} →
                    </a>
                  </li>
                }
              </ul>
            </footer>
          }
        </article>
      }
    </main>
  `,
})
export class GuiaDetalleComponent implements OnInit {
  @Input() slug!: string;
  private readonly api      = inject(ApiClientService);
  private readonly seo      = inject(SeoService);
  private readonly platform = inject(PLATFORM_ID);

  readonly guia            = signal<GuiaDetalle | null>(null);
  readonly cargando        = signal(true);
  readonly htmlSanitizado  = signal('');

  // Enlazado interno (estático, siempre presente para el crawler)
  readonly calc         = computed(() => { const g = this.guia(); return g ? calcPorGuia(g.slug) ?? null : null; });
  readonly relacionadas = computed<GuiaRef[]>(() => { const g = this.guia(); return g ? guiasRelacionadas(g.slug, 2) : []; });

  ngOnInit() {
    this.api.get<GuiaDetalle>(`/guias/${this.slug}`).subscribe({
      next: async (data) => {
        this.guia.set(data);
        this.cargando.set(false);
        this.seo.set({
          title: data.metaTitle ?? data.titulo,
          description: data.metaDescription ?? data.resumen,
          canonical: `/guias/${data.slug}`,
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: data.titulo,
            description: data.resumen,
            dateModified: data.actualizadoEn,
            publisher: { '@type': 'Organization', name: 'Perú Calcula', url: 'https://perucalcula.pe' },
          },
        });
        // Renderizar siempre (SSR + browser) para que el crawler reciba HTML con contenido
        this.htmlSanitizado.set(await this.renderMarkdown(data.cuerpoMarkdown));
      },
      error: () => { this.guia.set(null); this.cargando.set(false); },
    });
  }

  private async renderMarkdown(md: string): Promise<string> {
    // `marked` funciona en Node.js y en el browser (lazy, no contamina bundle de calculadoras)
    const { marked } = await import('marked');
    const html = await marked.parse(md);

    // DOMPurify solo existe en el browser (necesita DOM); en SSR el contenido
    // viene del admin que lo almacena saneado, así que se puede usar directamente.
    if (!isPlatformBrowser(this.platform)) {
      return html;
    }

    const DOMPurify = (await import('dompurify')).default;
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'h1','h2','h3','h4','h5','h6','p','ul','ol','li',
        'strong','em','blockquote','code','pre','a','br','hr',
        'table','thead','tbody','tr','th','td',
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
      FORCE_BODY: false,
    });
  }
}
