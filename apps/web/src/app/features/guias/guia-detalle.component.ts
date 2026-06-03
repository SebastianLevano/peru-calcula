import { Component, inject, signal, OnInit, Input, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiClientService } from '../../core/api-client.service';
import { SeoService } from '../../core/seo.service';
import { BadgeComponent } from '../../shared/components/badge.component';
import { SkeletonComponent } from '../../shared/components/skeleton.component';

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

          <!-- Markdown sanitizado renderizado como HTML — allowlist + DOMPurify (ADR-0010) -->
          <div class="prose prose-stone mt-8 max-w-none
                      prose-headings:font-display prose-headings:text-ink-900
                      prose-a:text-primary-700 prose-a:no-underline hover:prose-a:underline
                      prose-strong:text-ink-900 prose-code:text-ink-700"
               [innerHTML]="htmlSanitizado()">
          </div>
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

  readonly guia        = signal<GuiaDetalle | null>(null);
  readonly cargando    = signal(true);
  readonly htmlSanitizado = signal('');

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
        if (isPlatformBrowser(this.platform)) {
          this.htmlSanitizado.set(await this.renderMarkdown(data.cuerpoMarkdown));
        }
      },
      error: () => { this.guia.set(null); this.cargando.set(false); },
    });
  }

  private async renderMarkdown(md: string): Promise<string> {
    // Lazy: marked + DOMPurify solo en rutas de guías (no contamina bundle de calculadoras)
    const [{ marked }, DOMPurify] = await Promise.all([
      import('marked'),
      import('dompurify'),
    ]);

    const html = await marked.parse(md);
    return DOMPurify.default.sanitize(html, {
      ALLOWED_TAGS: [
        'h1','h2','h3','h4','h5','h6','p','ul','ol','li',
        'strong','em','blockquote','code','pre','a','br','hr','table','thead','tbody','tr','th','td',
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
      FORCE_BODY: false,
    });
  }
}
