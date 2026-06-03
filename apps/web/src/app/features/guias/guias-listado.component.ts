import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiClientService } from '../../core/api-client.service';
import { SeoService } from '../../core/seo.service';
import { BadgeComponent } from '../../shared/components/badge.component';
import { SkeletonComponent } from '../../shared/components/skeleton.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';

interface Guia { slug: string; titulo: string; resumen: string; calculadoraRelacionada?: string; actualizadoEn: string; }

@Component({
  selector: 'app-guias-listado',
  standalone: true,
  imports: [RouterModule, FormsModule, DatePipe, BadgeComponent, SkeletonComponent, EmptyStateComponent],
  template: `
    <main class="mx-auto max-w-4xl px-4 py-10">
      <header class="mb-8 space-y-2">
        <p class="text-sm font-semibold uppercase tracking-widest text-primary-600">Recursos</p>
        <h1 class="font-display text-3xl font-semibold text-ink-900">Guías sobre normativa peruana</h1>
        <p class="text-ink-600">Explicaciones claras sobre conceptos laborales, tributarios y financieros, con fuentes oficiales.</p>
      </header>

      <div class="relative mb-8">
        <label class="sr-only" for="busqueda">Buscar guías</label>
        <svg class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path stroke-linecap="round" d="m21 21-4.3-4.3"/></svg>
        <input id="busqueda" type="search" [(ngModel)]="busqueda" (ngModelChange)="buscar($event)"
          placeholder="Buscar en las guías…"
          class="w-full rounded-input border border-line bg-surface py-2.5 pl-10 pr-4 text-sm text-ink-900 placeholder-ink-500
                 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
      </div>

      @if (cargando()) {
        <div class="grid gap-5 sm:grid-cols-2" aria-busy="true" aria-label="Cargando guías">
          @for (_ of [1,2,3,4]; track $index) {
            <div class="rounded-card border border-line bg-surface p-5 space-y-3">
              <app-skeleton class="block h-5 w-3/4"></app-skeleton>
              <app-skeleton [lines]="2"></app-skeleton>
            </div>
          }
        </div>
      } @else if (guias().length === 0) {
        <app-empty-state titulo="No se encontraron guías" mensaje="Intenta con otros términos o explora todas las calculadoras." />
      } @else {
        <div class="grid gap-5 sm:grid-cols-2">
          @for (guia of guias(); track guia.slug) {
            <a [routerLink]="['/guias', guia.slug]"
               class="group flex flex-col rounded-card border border-line bg-surface p-5 shadow-card
                      hover:border-primary-200 hover:shadow-pop transition-all
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2">
              @if (guia.calculadoraRelacionada) {
                <app-badge tone="laboral" class="self-start">{{ guia.calculadoraRelacionada }}</app-badge>
              }
              <h2 class="mt-3 font-semibold text-ink-900 group-hover:text-primary-700 transition-colors">{{ guia.titulo }}</h2>
              <p class="mt-1 line-clamp-2 text-sm text-ink-600">{{ guia.resumen }}</p>
              <p class="mt-4 text-xs text-ink-500">{{ guia.actualizadoEn | date: 'd MMM y' : '' : 'es' }}</p>
            </a>
          }
        </div>
      }
    </main>
  `,
})
export class GuiasListadoComponent implements OnInit {
  private readonly api = inject(ApiClientService);
  private readonly seo = inject(SeoService);
  readonly guias    = signal<Guia[]>([]);
  readonly cargando = signal(true);
  busqueda = '';

  ngOnInit() {
    this.seo.set({
      title: 'Guías sobre normativa peruana',
      description: 'Explicaciones claras sobre CTS, gratificaciones, honorarios, impuestos y créditos en Perú. Con fuentes oficiales.',
      canonical: '/guias',
    });
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
