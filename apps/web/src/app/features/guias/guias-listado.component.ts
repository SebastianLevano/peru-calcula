import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiClientService } from '../../core/api-client.service';
import { SeoService } from '../../core/seo.service';

interface Guia { slug: string; titulo: string; resumen: string; calculadoraRelacionada?: string; actualizadoEn: string; }

@Component({
  selector: 'app-guias-listado',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <main class="max-w-4xl mx-auto py-10 px-4 space-y-8">
      <header>
        <h1 class="text-3xl font-bold text-gray-900">Guías Financieras y Tributarias</h1>
        <p class="mt-2 text-gray-600">Explora nuestras guías sobre normativa peruana, calculadoras y conceptos clave.</p>
      </header>

      <div class="relative">
        <input [(ngModel)]="busqueda" (ngModelChange)="buscar($event)" type="search"
          placeholder="Buscar guías…" aria-label="Buscar guías"
          class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      @if (cargando()) {
        <div class="text-center text-gray-500 py-8">Cargando guías…</div>
      } @else if (guias().length === 0) {
        <div class="text-center text-gray-500 py-8">No se encontraron guías.</div>
      } @else {
        <div class="grid sm:grid-cols-2 gap-5">
          @for (guia of guias(); track guia.slug) {
            <a [routerLink]="['/guias', guia.slug]"
               class="group bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-blue-400 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500">
              @if (guia.calculadoraRelacionada) {
                <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 mb-2 inline-block">
                  {{ guia.calculadoraRelacionada }}
                </span>
              }
              <h2 class="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{{ guia.titulo }}</h2>
              <p class="mt-1 text-sm text-gray-500 line-clamp-2">{{ guia.resumen }}</p>
              <p class="mt-3 text-xs text-gray-400">{{ guia.actualizadoEn | date:'dd/MM/yyyy' }}</p>
            </a>
          }
        </div>
      }
    </main>`,
})
export class GuiasListadoComponent implements OnInit {
  private readonly api = inject(ApiClientService);
  private readonly seo = inject(SeoService);
  readonly guias   = signal<Guia[]>([]);
  readonly cargando = signal(true);
  busqueda = '';

  ngOnInit() {
    this.seo.set({ title: 'Guías Financieras y Tributarias', description: 'Guías sobre normativa peruana, calculadoras laborales, tributarias y financieras. Explicaciones claras con fuentes oficiales.' });
    this.cargarGuias();
  }

  cargarGuias() {
    this.cargando.set(true);
    this.api.get<Guia[]>('/guias').subscribe({
      next: (data) => { this.guias.set(data); this.cargando.set(false); },
      error: () => { this.cargando.set(false); },
    });
  }

  buscar(query: string) {
    if (query.length < 2) { this.cargarGuias(); return; }
    this.api.get<Guia[]>(`/guias/buscar?q=${encodeURIComponent(query)}`).subscribe({
      next: (data) => this.guias.set(data),
      error: () => {},
    });
  }
}
