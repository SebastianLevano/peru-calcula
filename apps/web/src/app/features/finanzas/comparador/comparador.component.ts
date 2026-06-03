import { Component, inject, signal, OnInit } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiClientService } from '../../../core/api-client.service';
import { SeoService } from '../../../core/seo.service';
import { UrlStateService } from '../../../core/url-state.service';
import { AnalyticsService } from '../../../core/analytics.service';
import { CalcInputComponent } from '../../../shared/ui/calc-input.component';
import { AlertComponent } from '../../../shared/components/alert.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state.component';
import { AdsSlotComponent } from '../../../shared/components/ads-slot.component';
import { CalcPageHeaderComponent } from '../../../shared/ui/calc-page-header.component';

interface ProductoComparado {
  productoId: number;
  banco: { id: number; nombre: string; slug: string; logoUrl: string | null; urlAfiliado: string | null; esPatrocinado: boolean; sitioUrl: string | null };
  producto: string; moneda: string; tea: number; tcea: number; tceaRef: boolean;
  cuota: number; comisionMensual: number; flujoMensual: number; totalPagado: number; totalIntereses: number; totalComisiones: number; fuente: string;
}
interface ComparadorRespuesta {
  tipo: string; monto: number; plazo: number;
  ranking: ProductoComparado[]; patrocinados: ProductoComparado[];
  divulgacion: string; fechaConsulta: string;
}

@Component({
  selector: 'app-comparador',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, CurrencyPipe, DecimalPipe, CalcInputComponent, AlertComponent, EmptyStateComponent, AdsSlotComponent, CalcPageHeaderComponent],
  template: `
    <app-calc-page-header
      titulo="Comparador de Préstamos"
      descripcion="Créditos del mercado peruano ordenados por TCEA (Tasa de Costo Efectivo Anual). Cuanto más baja la TCEA, más barato el crédito."
      modulo="finanzas"
      maxWidth="4xl" />

    <main class="mx-auto max-w-4xl px-4 py-8 space-y-8">

      <form [formGroup]="form" (ngSubmit)="comparar()" class="rounded-card border border-line bg-surface p-6 shadow-card space-y-5">
        <div>
          <label class="mb-2 block text-sm font-medium text-ink-700">Tipo de crédito</label>
          <div class="flex gap-3" role="radiogroup" aria-label="Tipo de crédito">
            @for (t of tipos; track t.value) {
              <label class="flex-1 cursor-pointer">
                <input type="radio" formControlName="tipo" [value]="t.value" class="sr-only" />
                <span class="block rounded-card border-2 px-3 py-2.5 text-center text-sm font-medium transition-colors"
                      [class]="form.get('tipo')?.value === t.value ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-line text-ink-600 hover:border-ink-500'">
                  {{ t.label }}
                </span>
              </label>
            }
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <app-calc-input label="Monto del préstamo" inputId="monto" prefix="S/" placeholder="10000" [required]="true" [min]="100" formControlName="monto" />
          <app-calc-input label="Plazo (meses)" inputId="plazo" placeholder="24" [min]="1" [max]="480" formControlName="plazo" />
        </div>
        <div class="flex gap-3">
          <button type="submit" [disabled]="form.invalid || buscando()"
            class="flex-1 rounded-input bg-primary-700 py-3 text-sm font-semibold text-white hover:bg-primary-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            @if (buscando()) { <span class="inline-flex items-center justify-center gap-2"><svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4z"/></svg>Buscando…</span>
          } @else { Comparar préstamos }
          </button>
          <button type="button" (click)="limpiar()"
            class="rounded-input border border-line bg-surface px-5 text-sm font-medium text-ink-600
                   hover:bg-paper hover:text-ink-900 transition-colors
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600">
            Limpiar
          </button>
        </div>
      </form>

      @if (error()) { <app-alert tone="error">{{ error() }}</app-alert> }
      @if (!resultado() && !buscando() && !error()) {
        <app-empty-state titulo="Ingresa el tipo de crédito, monto y plazo para comparar" mensaje="Verás el ranking de bancos ordenado por TCEA de menor a mayor." />
      }

      @if (resultado()) {
        <section>
          <h2 class="font-display text-xl font-semibold text-ink-900 mb-1">Ranking por TCEA</h2>
          <p class="mb-4 text-xs text-ink-500">
            Ordenados de menor a mayor TCEA para {{ resultado()!.monto | currency:'PEN':'symbol':'1.0-0':'es-PE' }} a {{ resultado()!.plazo }} meses.
            @if (hayTasasReferenciales()) { <span class="text-warn-600">(*) Tasas referenciales — pueden variar según perfil.</span> }
          </p>
          @if (resultado()!.ranking.length === 0) {
            <app-alert tone="warn">No hay productos disponibles para este tipo de crédito. Consulta directamente con los bancos.</app-alert>
          } @else {
            <div class="overflow-x-auto rounded-card border border-line bg-surface shadow-card">
              <table class="w-full text-sm" aria-label="Ranking de préstamos por TCEA">
                <thead class="bg-paper border-b border-line">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">#</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Banco / Producto</th>
                    <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-500">TEA</th>
                    <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-500">TCEA</th>
                    <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-500">Cuota/mes</th>
                    <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-500">Total</th>
                    <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-ink-500">Solicitar</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-line/70">
                  @for (p of resultado()!.ranking; track p.productoId; let i = $index) {
                    <tr [class]="i === 0 ? 'bg-ok-50' : 'hover:bg-paper'">
                      <td class="px-4 py-3 text-ink-500 font-medium">
                        <span [class]="i === 0 ? 'font-bold text-ok-600' : ''">{{ i + 1 }}°</span>
                      </td>
                      <td class="px-4 py-3">
                        <div class="font-medium text-ink-900">{{ p.banco.nombre }}</div>
                        <div class="text-xs text-ink-500">{{ p.producto }}</div>
                        @if (p.comisionMensual > 0) { <div class="text-xs text-warn-600">+ comisión S/ {{ p.comisionMensual | number:'1.2-2' }}/mes</div> }
                      </td>
                      <td class="monto px-4 py-3 text-right text-ink-600">{{ p.tea | number:'1.2-2' }}%</td>
                      <td class="monto px-4 py-3 text-right">
                        <span [class]="i === 0 ? 'font-bold text-ok-600' : 'font-semibold text-ink-900'">{{ p.tcea | number:'1.2-2' }}%</span>
                        @if (p.tceaRef) { <span class="text-xs text-ink-500">*</span> }
                      </td>
                      <td class="monto px-4 py-3 text-right font-medium text-ink-900">{{ p.flujoMensual | currency:'PEN':'symbol':'1.2-2':'es-PE' }}</td>
                      <td class="monto px-4 py-3 text-right text-ink-600">{{ p.totalPagado | currency:'PEN':'symbol':'1.2-2':'es-PE' }}</td>
                      <td class="px-4 py-3 text-center">
                        @if (p.banco.urlAfiliado) {
                          <a [href]="p.banco.urlAfiliado" target="_blank" rel="noopener sponsored"
                            class="inline-block rounded-input bg-primary-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-800 transition-colors">
                            Ver oferta
                          </a>
                        } @else if (p.banco.sitioUrl) {
                          <a [href]="p.banco.sitioUrl" target="_blank" rel="noopener"
                            class="inline-block rounded-input border border-line px-3 py-1.5 text-xs text-ink-600 hover:bg-paper transition-colors">
                            Ver web
                          </a>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </section>

        @if (resultado()!.patrocinados.length > 0) {
          <section aria-label="Productos patrocinados">
            <div class="mb-3 flex items-center gap-2">
              <h2 class="text-base font-semibold text-ink-700">Patrocinado</h2>
              <span class="rounded-pill border border-warn-600/25 bg-warn-50 px-2 py-0.5 text-xs font-medium text-warn-600">Publicidad</span>
            </div>
            <div class="overflow-x-auto rounded-card border border-warn-600/25 bg-warn-50">
              <table class="w-full text-sm" aria-label="Productos patrocinados">
                <tbody class="divide-y divide-warn-600/10">
                  @for (p of resultado()!.patrocinados; track p.productoId) {
                    <tr class="hover:bg-warn-50/80">
                      <td class="px-4 py-3">
                        <div class="font-medium text-ink-900">{{ p.banco.nombre }}</div>
                        <div class="text-xs text-ink-500">{{ p.producto }}</div>
                      </td>
                      <td class="monto px-4 py-3 text-right text-ink-700">TCEA {{ p.tcea | number:'1.2-2' }}%</td>
                      <td class="monto px-4 py-3 text-right text-ink-700">{{ p.flujoMensual | currency:'PEN':'symbol':'1.2-2':'es-PE' }}/mes</td>
                      <td class="px-4 py-3 text-center">
                        @if (p.banco.urlAfiliado) {
                          <a [href]="p.banco.urlAfiliado" target="_blank" rel="noopener sponsored"
                            class="inline-block rounded-input bg-accent-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-700 transition-colors">
                            Ver oferta
                          </a>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>
        }

        <aside class="rounded-card border border-line bg-paper p-4 text-xs text-ink-500">
          <p class="font-semibold text-ink-700">Aviso de afiliación y metodología</p>
          <p class="mt-1">{{ resultado()!.divulgacion }}</p>
          <p class="mt-1">Fecha de consulta: {{ resultado()!.fechaConsulta }}</p>
        </aside>

        <div class="text-center">
          <button type="button" (click)="compartir()"
            class="inline-flex items-center gap-2 rounded-input border border-line px-4 py-2 text-sm font-medium text-ink-700 hover:border-primary-200 hover:text-primary-700 transition-colors">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.7 13.3a4 4 0 0 0 6 .4l3-3a4 4 0 0 0-5.7-5.7l-1.7 1.7m-1.3 4.7a4 4 0 0 1-6-.4l-3-3a4 4 0 0 1 5.7-5.7L7.1 4"/></svg>
            {{ copiado() ? '¡Enlace copiado!' : 'Copiar enlace de esta comparación' }}
          </button>
        </div>

        <app-ads-slot size="banner" />
      }
    </main>
  `,
})
export class ComparadorComponent implements OnInit {
  private readonly api      = inject(ApiClientService);
  private readonly seo      = inject(SeoService);
  private readonly analytics = inject(AnalyticsService);
  private readonly urlState = inject(UrlStateService);
  private readonly fb       = inject(FormBuilder);

  readonly buscando  = signal(false);
  readonly resultado = signal<ComparadorRespuesta | null>(null);
  readonly error     = signal<string | null>(null);
  readonly copiado   = signal(false);

  readonly tipos = [
    { value: 'personal',    label: 'Personal' },
    { value: 'vehicular',   label: 'Vehicular' },
    { value: 'hipotecario', label: 'Hipotecario' },
  ] as const;

  private readonly tipoUrl  = this.urlState.bind('tipo', 'personal');
  private readonly montoUrl = this.urlState.bind<number | null>('monto', null);
  private readonly plazoUrl = this.urlState.bind('plazo', 24);

  readonly form = this.fb.group({
    tipo:  [this.tipoUrl(),  Validators.required],
    monto: [this.montoUrl(), [Validators.required, Validators.min(100)]],
    plazo: [this.plazoUrl(), [Validators.required, Validators.min(1), Validators.max(480)]],
  });

  ngOnInit() {
    this.seo.set({
      title: 'Comparador de Préstamos — Ranking por TCEA',
      description: 'Compara créditos personales, vehiculares e hipotecarios del mercado peruano por TCEA.',
      canonical: '/comparador-de-prestamos',
    });
    this.analytics.track({ tipoEvento: 'inicio', calculadoraSlug: 'comparador-prestamos', modulo: 'finanzas' });
    if (this.montoUrl() !== null) this.comparar();
  }

  limpiar() {
    this.form.reset({ tipo: 'personal', monto: null, plazo: 24 });
    this.resultado.set(null);
    this.error.set(null);
  }

  comparar() {
    if (this.form.invalid) return;
    const { tipo, monto, plazo } = this.form.value;
    this.urlState.sync({ tipo: tipo ?? null, monto: monto ?? null, plazo: plazo ?? null });
    this.buscando.set(true); this.error.set(null);
    this.api.get<ComparadorRespuesta>(`/finanzas/comparador?tipo=${tipo}&monto=${monto}&plazo=${plazo}`).subscribe({
      next: (res) => { this.resultado.set(res); this.buscando.set(false); this.analytics.track({ tipoEvento: 'completado', calculadoraSlug: 'comparador-prestamos', modulo: 'finanzas' }); },
      error: () => { this.error.set('No se pudo cargar la comparación. Intenta nuevamente.'); this.buscando.set(false); },
    });
  }

  hayTasasReferenciales(): boolean { return this.resultado()?.ranking.some(p => p.tceaRef) ?? false; }

  compartir() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(this.urlState.shareUrl()).then(() => {
        this.copiado.set(true);
        setTimeout(() => this.copiado.set(false), 2500);
      });
    }
  }
}
