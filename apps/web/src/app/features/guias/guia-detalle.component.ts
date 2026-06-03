import { Component, inject, signal, OnInit, Input, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiClientService } from '../../core/api-client.service';
import { SeoService } from '../../core/seo.service';

interface GuiaDetalle { slug: string; titulo: string; resumen: string; cuerpoMarkdown: string; calculadoraRelacionada?: string; metaTitle?: string; metaDescription?: string; actualizadoEn: string; }

@Component({
  selector: 'app-guia-detalle',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <main class="max-w-3xl mx-auto py-10 px-4">
      @if (cargando()) {
        <div class="text-center text-gray-500 py-16">Cargando…</div>
      } @else if (!guia()) {
        <div class="text-center py-16">
          <p class="text-gray-500">Guía no encontrada.</p>
          <a routerLink="/guias" class="mt-4 inline-block text-blue-600 underline">Ver todas las guías</a>
        </div>
      } @else {
        <article class="space-y-6">
          <header class="space-y-3">
            <a routerLink="/guias" class="text-sm text-blue-600 hover:underline">← Todas las guías</a>
            @if (guia()!.calculadoraRelacionada) {
              <span class="ml-3 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {{ guia()!.calculadoraRelacionada }}
              </span>
            }
            <h1 class="text-3xl font-bold text-gray-900">{{ guia()!.titulo }}</h1>
            <p class="text-gray-600">{{ guia()!.resumen }}</p>
            <p class="text-xs text-gray-400">Actualizado: {{ guia()!.actualizadoEn | date:'dd/MM/yyyy' }}</p>
          </header>

          <!-- El contenido se renderiza como texto plano por seguridad (el HTML sanitizado se haría en F3) -->
          <div class="prose prose-gray max-w-none">
            <pre class="whitespace-pre-wrap font-sans text-gray-700 text-sm leading-relaxed">{{ guia()!.cuerpoMarkdown }}</pre>
          </div>
        </article>
      }
    </main>`,
})
export class GuiaDetalleComponent implements OnInit {
  @Input() slug!: string;
  private readonly api = inject(ApiClientService);
  private readonly seo = inject(SeoService);
  readonly guia     = signal<GuiaDetalle | null>(null);
  readonly cargando = signal(true);

  ngOnInit() {
    this.api.get<GuiaDetalle>(`/guias/${this.slug}`).subscribe({
      next: (data) => {
        this.guia.set(data);
        this.cargando.set(false);
        this.seo.set({ title: data.metaTitle ?? data.titulo, description: data.metaDescription ?? data.resumen });
      },
      error: () => { this.guia.set(null); this.cargando.set(false); },
    });
  }
}
