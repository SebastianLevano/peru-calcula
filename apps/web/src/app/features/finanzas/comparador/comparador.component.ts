import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiClientService } from '../../../core/api-client.service';
import { SeoService } from '../../../core/seo.service';
import { UrlStateService } from '../../../core/url-state.service';
import { AnalyticsService } from '../../../core/analytics.service';
import { CalcInputComponent } from '../../../shared/ui/calc-input.component';

interface ProductoComparado {
  productoId: number;
  banco: { id: number; nombre: string; slug: string; logoUrl: string | null; urlAfiliado: string | null; esPatrocinado: boolean; sitioUrl: string | null };
  producto: string;
  moneda: string;
  tea: number;
  tcea: number;
  tceaRef: boolean;
  cuota: number;
  comisionMensual: number;
  flujoMensual: number;
  totalPagado: number;
  totalIntereses: number;
  totalComisiones: number;
  fuente: string;
}

interface ComparadorRespuesta {
  tipo: string;
  monto: number;
  plazo: number;
  ranking: ProductoComparado[];
  patrocinados: ProductoComparado[];
  divulgacion: string;
  fechaConsulta: string;
}

@Component({
  selector: 'app-comparador',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CalcInputComponent, CurrencyPipe, DecimalPipe],
  template: `
    <main class="max-w-4xl mx-auto py-10 px-4 space-y-8">
      <header>
        <h1 class="text-3xl font-bold text-gray-900">Comparador de Préstamos</h1>
        <p class="mt-2 text-gray-600 text-sm">
          Compara créditos del mercado peruano ordenados por TCEA (Tasa de Costo Efectivo Anual).
          La TCEA incluye tasa de interés y comisiones; cuanto más baja, más barato el crédito.
        </p>
      </header>

      <!-- Formulario -->
      <form [formGroup]="form" (ngSubmit)="comparar()" class="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
        <!-- Tipo de crédito -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de crédito</label>
          <div class="flex gap-3" role="radiogroup">
            @for (t of tipos; track t.value) {
              <label class="flex-1 cursor-pointer">
                <input type="radio" formControlName="tipo" [value]="t.value" class="sr-only" />
                <span [class]="form.get('tipo')?.value === t.value
                  ? 'block text-center py-2.5 px-3 rounded-lg border-2 border-blue-600 bg-blue-50 text-blue-700 font-medium text-sm'
                  : 'block text-center py-2.5 px-3 rounded-lg border-2 border-gray-200 text-gray-600 text-sm hover:border-gray-300'">
                  {{ t.label }}
                </span>
              </label>
            }
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <app-calc-input label="Monto del préstamo" inputId="monto" prefix="S/"
            placeholder="10000" [required]="true" [min]="100" formControlName="monto" />
          <app-calc-input label="Plazo" inputId="plazo" placeholder="24"
            hint="En meses" [min]="1" [max]="480" formControlName="plazo" />
        </div>

        <button type="submit" [disabled]="form.invalid || buscando()"
          class="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700
                 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {{ buscando() ? 'Buscando…' : 'Comparar préstamos' }}
        </button>
      </form>

      @if (error()) {
        <div class="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700" role="alert">{{ error() }}</div>
      }

      @if (resultado()) {
        <!-- Ranking -->
        <section>
          <h2 class="text-xl font-semibold text-gray-900 mb-3">Ranking por TCEA</h2>
          <p class="text-xs text-gray-500 mb-4">
            Ordenados de menor a mayor TCEA para {{ resultado()!.monto | currency:'PEN':'symbol':'1.0-0' }}
            a {{ resultado()!.plazo }} meses.
            @if (hayTasasReferenciales()) {
              <span class="text-amber-600"> (*) Tasas referenciales — pueden variar según perfil crediticio.</span>
            }
          </p>

          @if (resultado()!.ranking.length === 0) {
            <div class="rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800">
              No hay productos disponibles para este tipo de crédito. Consulta directamente con los bancos.
            </div>
          } @else {
            <div class="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
              <table class="w-full text-sm" aria-label="Ranking de préstamos por TCEA">
                <thead class="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Banco / Producto</th>
                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">TEA</th>
                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">TCEA</th>
                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cuota/mes</th>
                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Solicitar</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  @for (p of resultado()!.ranking; track p.productoId; let i = $index) {
                    <tr [class]="i === 0 ? 'bg-green-50' : 'hover:bg-gray-50'">
                      <td class="px-4 py-3 text-gray-500 font-medium">
                        <span [class]="i === 0 ? 'text-green-700 font-bold' : ''">{{ i + 1 }}°</span>
                      </td>
                      <td class="px-4 py-3">
                        <div class="font-medium text-gray-900">{{ p.banco.nombre }}</div>
                        <div class="text-xs text-gray-500">{{ p.producto }}</div>
                        @if (p.comisionMensual > 0) {
                          <div class="text-xs text-amber-600">+ comisión S/ {{ p.comisionMensual | number:'1.2-2' }}/mes</div>
                        }
                      </td>
                      <td class="px-4 py-3 text-right text-gray-600">{{ p.tea | number:'1.2-2' }}%</td>
                      <td class="px-4 py-3 text-right">
                        <span [class]="i === 0 ? 'font-bold text-green-700' : 'font-semibold text-gray-800'">
                          {{ p.tcea | number:'1.2-2' }}%
                        </span>
                        @if (p.tceaRef) { <span class="text-gray-400 text-xs">*</span> }
                      </td>
                      <td class="px-4 py-3 text-right font-medium">
                        {{ p.flujoMensual | currency:'PEN':'symbol':'1.2-2' }}
                      </td>
                      <td class="px-4 py-3 text-right text-gray-600">
                        {{ p.totalPagado | currency:'PEN':'symbol':'1.2-2' }}
                      </td>
                      <td class="px-4 py-3 text-center">
                        @if (p.banco.urlAfiliado) {
                          <a [href]="p.banco.urlAfiliado" target="_blank" rel="noopener sponsored"
                            class="inline-block px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors">
                            Ver oferta
                          </a>
                        } @else if (p.banco.sitioUrl) {
                          <a [href]="p.banco.sitioUrl" target="_blank" rel="noopener"
                            class="inline-block px-3 py-1.5 border border-gray-300 text-gray-600 text-xs rounded-lg hover:bg-gray-50 transition-colors">
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

        <!-- Patrocinados (ADR-17: sección separada con etiqueta explícita) -->
        @if (resultado()!.patrocinados.length > 0) {
          <section aria-label="Productos patrocinados">
            <div class="flex items-center gap-2 mb-3">
              <h2 class="text-base font-semibold text-gray-700">Patrocinado</h2>
              <span class="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                Publicidad
              </span>
            </div>
            <div class="overflow-x-auto rounded-xl border border-amber-200 bg-amber-50">
              <table class="w-full text-sm" aria-label="Productos patrocinados">
                <tbody class="divide-y divide-amber-100">
                  @for (p of resultado()!.patrocinados; track p.productoId) {
                    <tr class="hover:bg-amber-100/50">
                      <td class="px-4 py-3">
                        <div class="font-medium text-gray-900">{{ p.banco.nombre }}</div>
                        <div class="text-xs text-gray-500">{{ p.producto }}</div>
                      </td>
                      <td class="px-4 py-3 text-right text-gray-700">
                        TCEA {{ p.tcea | number:'1.2-2' }}%
                      </td>
                      <td class="px-4 py-3 text-right text-gray-700">
                        {{ p.flujoMensual | currency:'PEN':'symbol':'1.2-2' }}/mes
                      </td>
                      <td class="px-4 py-3 text-center">
                        @if (p.banco.urlAfiliado) {
                          <a [href]="p.banco.urlAfiliado" target="_blank" rel="noopener sponsored"
                            class="inline-block px-3 py-1.5 bg-amber-500 text-white text-xs font-medium rounded-lg hover:bg-amber-600 transition-colors">
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

        <!-- Divulgación (ADR-17) -->
        <aside class="rounded-lg bg-gray-50 border border-gray-200 p-4 text-xs text-gray-500 space-y-1">
          <p class="font-medium text-gray-600">Aviso de afiliación y metodología</p>
          <p>{{ resultado()!.divulgacion }}</p>
          <p>Fecha de consulta: {{ resultado()!.fechaConsulta }}.</p>
        </aside>

        <!-- Compartir (ADR-14) -->
        <div class="text-center">
          <button type="button" (click)="compartir()"
            class="inline-flex items-center gap-2 px-4 py-2 text-sm text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
            </svg>
            Copiar enlace de esta comparación
          </button>
          @if (copiado()) {
            <span class="ml-2 text-sm text-green-600">¡Enlace copiado!</span>
          }
        </div>
      }
    </main>
  `,
})
export class ComparadorComponent implements OnInit {
  private readonly api       = inject(ApiClientService);
  private readonly seo       = inject(SeoService);
  private readonly analytics = inject(AnalyticsService);
  private readonly urlState  = inject(UrlStateService);
  private readonly fb        = inject(FormBuilder);

  readonly buscando  = signal(false);
  readonly resultado = signal<ComparadorRespuesta | null>(null);
  readonly error     = signal<string | null>(null);
  readonly copiado   = signal(false);

  readonly tipos = [
    { value: 'personal',    label: 'Personal' },
    { value: 'vehicular',   label: 'Vehicular' },
    { value: 'hipotecario', label: 'Hipotecario' },
  ] as const;

  // Signals enlazados a query string (ADR-14)
  private readonly tipoUrl  = this.urlState.bind('tipo',  'personal');
  private readonly montoUrl = this.urlState.bind<number | null>('monto', null);
  private readonly plazoUrl = this.urlState.bind('plazo', 24);

  readonly form = this.fb.group({
    tipo:  [this.tipoUrl(),  Validators.required],
    monto: [this.montoUrl(), [Validators.required, Validators.min(100)]],
    plazo: [this.plazoUrl(), [Validators.required, Validators.min(1), Validators.max(480)]],
  });

  ngOnInit() {
    this.seo.set({
      title: 'Comparador de Préstamos en Perú — Ranking por TCEA',
      description: 'Compara créditos personales, vehiculares e hipotecarios del mercado peruano ordenados por TCEA. Gratuito, sin registro.',
    });
    this.analytics.track({ tipoEvento: 'inicio', calculadoraSlug: 'comparador-prestamos', modulo: 'finanzas' });

    // Auto-comparar si hay parámetros en la URL
    if (this.montoUrl() !== null) this.comparar();
  }

  comparar() {
    if (this.form.invalid) return;
    const { tipo, monto, plazo } = this.form.value;

    this.urlState.sync({ tipo: tipo ?? null, monto: monto ?? null, plazo: plazo ?? null });
    this.buscando.set(true);
    this.error.set(null);

    this.api.get<ComparadorRespuesta>(
      `/finanzas/comparador?tipo=${tipo}&monto=${monto}&plazo=${plazo}`
    ).subscribe({
      next: (res) => {
        this.resultado.set(res);
        this.buscando.set(false);
        this.analytics.track({ tipoEvento: 'completado', calculadoraSlug: 'comparador-prestamos', modulo: 'finanzas' });
      },
      error: () => {
        this.error.set('No se pudo cargar la comparación. Intenta nuevamente.');
        this.buscando.set(false);
      },
    });
  }

  hayTasasReferenciales(): boolean {
    return this.resultado()?.ranking.some(p => p.tceaRef) ?? false;
  }

  compartir() {
    navigator.clipboard.writeText(this.urlState.shareUrl()).then(() => {
      this.copiado.set(true);
      setTimeout(() => this.copiado.set(false), 2500);
    });
  }
}
