import { Component, inject, signal, OnInit } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiClientService } from '../../../core/api-client.service';
import { SeoService } from '../../../core/seo.service';
import { AnalyticsService } from '../../../core/analytics.service';
import { ResultCardComponent, ResultadoConfianza, DesgloseLine } from '../../../shared/components/result-card.component';
import { CalcInputComponent } from '../../../shared/ui/calc-input.component';
import { AlertComponent } from '../../../shared/components/alert.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state.component';
import { AdsSlotComponent } from '../../../shared/components/ads-slot.component';
import { CalcPageHeaderComponent } from '../../../shared/ui/calc-page-header.component';
import { CalcRelatedComponent } from '../../../shared/ui/calc-related.component';

interface CuotaCronograma { mes: number; cuota: number; interes: number; amortizacion: number; saldo: number; }
interface CreditoRespuesta { resultado: { cuota: number; tem: number; totalPagado: number; totalIntereses: number; moneda: string }; desglose: { concepto: string; valor: number }[]; cronograma: CuotaCronograma[]; confianza: ResultadoConfianza; }

@Component({
  selector: 'app-credito-hipotecario',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, CurrencyPipe, DecimalPipe, ResultCardComponent, CalcInputComponent, AlertComponent, EmptyStateComponent, AdsSlotComponent, CalcPageHeaderComponent, CalcRelatedComponent],
  template: `
    <app-calc-page-header
      titulo="Simulador de Crédito Hipotecario"
      descripcion="Compatible con Mivivienda, Techo Propio y crédito libre disposición. Ingresa la TEA de tu banco."
      modulo="finanzas" />

    <main class="mx-auto max-w-2xl px-4 py-8 space-y-8">
      <form [formGroup]="form" (ngSubmit)="calcular()" class="rounded-card border border-line bg-surface p-6 shadow-card space-y-5">
        <app-calc-input label="Monto del préstamo" inputId="monto" prefix="S/" placeholder="200000" [required]="true" [min]="5000" formControlName="monto" />
        <div class="grid grid-cols-2 gap-4">
          <app-calc-input label="Plazo (meses)" inputId="plazo" placeholder="240" hint="Máx. 360 meses (30 años)" [min]="12" [max]="360" formControlName="plazoMeses" />
          <app-calc-input label="TEA (%)" inputId="tea" placeholder="9.5" hint="Tasa Efectiva Anual" [min]="0" [max]="100" [step]="0.01" formControlName="tea" />
        </div>
        <p class="rounded-input border border-primary-100 bg-primary-50 px-3 py-2 text-xs text-primary-700">
          Plazos comunes: 120 (10 años) · 180 (15) · 240 (20) · 300 (25). Este simulador no incluye seguro de desgravamen.
        </p>
        <div class="flex gap-3">
          <button type="submit" [disabled]="form.invalid || calculando()"
            class="flex-1 rounded-input bg-primary-700 py-3 text-sm font-semibold text-white hover:bg-primary-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            @if (calculando()) { <span class="inline-flex items-center justify-center gap-2"><svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4z"/></svg>Calculando…</span>
          } @else { Simular crédito hipotecario }
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
      @if (!resultado() && !calculando() && !error()) { <app-empty-state titulo="Ingresa el monto, plazo y TEA para simular tu hipoteca" /> }
      @if (resultado()) {
        <app-result-card titulo="Cuota mensual" [montoFinal]="resultado()!.resultado.cuota" [desglose]="toDesglose(resultado()!.desglose)" [confianza]="resultado()!.confianza" calculadoraSlug="credito-hipotecario" modulo="finanzas" />
        <div class="grid grid-cols-3 gap-4">
          <div class="rounded-card border border-line bg-surface p-4 text-center shadow-card">
            <p class="text-xs text-ink-500">Total a pagar</p>
            <p class="monto mt-1 font-display text-base font-semibold text-ink-900">{{ resultado()!.resultado.totalPagado | currency:'PEN':'symbol':'1.0-0':'es-PE' }}</p>
          </div>
          <div class="rounded-card border border-line bg-surface p-4 text-center shadow-card">
            <p class="text-xs text-ink-500">Total en intereses</p>
            <p class="monto mt-1 font-display text-base font-semibold text-error-600">{{ resultado()!.resultado.totalIntereses | currency:'PEN':'symbol':'1.0-0':'es-PE' }}</p>
          </div>
          <div class="rounded-card border border-line bg-surface p-4 text-center shadow-card">
            <p class="text-xs text-ink-500">TEM</p>
            <p class="monto mt-1 font-display text-base font-semibold text-ink-900">{{ resultado()!.resultado.tem | number:'1.4-4' }}%</p>
          </div>
        </div>
        <div class="overflow-hidden rounded-card border border-line bg-surface shadow-card">
          <h2 class="border-b border-line px-5 py-3.5 font-semibold text-ink-900">Cronograma de pagos ({{ resultado()!.cronograma.length }} cuotas)</h2>
          <div class="max-h-96 overflow-y-auto overflow-x-auto">
            <table class="w-full text-sm" aria-label="Cronograma de amortización hipotecario">
              <thead class="sticky top-0 bg-paper"><tr>
                <th class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Mes</th>
                <th class="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-ink-500">Cuota</th>
                <th class="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-ink-500">Interés</th>
                <th class="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-ink-500">Amort.</th>
                <th class="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-ink-500">Saldo</th>
              </tr></thead>
              <tbody class="divide-y divide-line/70">
                @for (row of resultado()!.cronograma; track row.mes) {
                  <tr class="hover:bg-paper">
                    <td class="px-4 py-2 text-ink-600">{{ row.mes }}</td>
                    <td class="monto px-4 py-2 text-right text-ink-900">{{ row.cuota | currency:'PEN':'symbol':'1.2-2':'es-PE' }}</td>
                    <td class="monto px-4 py-2 text-right text-error-600">{{ row.interes | currency:'PEN':'symbol':'1.2-2':'es-PE' }}</td>
                    <td class="monto px-4 py-2 text-right text-ok-600">{{ row.amortizacion | currency:'PEN':'symbol':'1.2-2':'es-PE' }}</td>
                    <td class="monto px-4 py-2 text-right font-medium text-ink-900">{{ row.saldo | currency:'PEN':'symbol':'1.2-2':'es-PE' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
        <app-ads-slot size="banner" />
      }
    </main>

    <app-calc-related slug="/calculadora-hipotecaria" />
  `,
})
export class CreditoHipotecarioComponent implements OnInit {
  private readonly api = inject(ApiClientService); private readonly seo = inject(SeoService);
  private readonly analytics = inject(AnalyticsService); private readonly fb = inject(FormBuilder);
  readonly calculando = signal(false); readonly resultado = signal<CreditoRespuesta | null>(null); readonly error = signal<string | null>(null);
  readonly form = this.fb.group({ monto: [null as number | null, [Validators.required, Validators.min(5000)]], plazoMeses: [240, [Validators.required, Validators.min(12), Validators.max(360)]], tea: [9.5, [Validators.required, Validators.min(0), Validators.max(100)]] });
  ngOnInit() {
    this.seo.set({ title: 'Calculadora Crédito Hipotecario Perú 2026', description: 'Simula tu crédito hipotecario: cuota, interés total y cronograma completo. En soles o dólares.', canonical: '/calculadora-hipotecaria' });
    this.analytics.track({ tipoEvento: 'inicio', calculadoraSlug: 'credito-hipotecario', modulo: 'finanzas' });
  }
  limpiar() {
    this.form.reset({ monto: null, plazoMeses: 240, tea: 9.5 });
    this.resultado.set(null);
    this.error.set(null);
  }

  calcular() {
    if (this.form.invalid) return;
    this.calculando.set(true); this.error.set(null);
    this.api.post<CreditoRespuesta>('/finanzas/credito-hipotecario', this.form.value).subscribe({
      next: (res) => { this.resultado.set(res); this.calculando.set(false); this.analytics.track({ tipoEvento: 'completado', calculadoraSlug: 'credito-hipotecario', modulo: 'finanzas' }); },
      error: () => { this.error.set('Ocurrió un error al calcular. Intenta nuevamente.'); this.calculando.set(false); },
    });
  }
  toDesglose(raw: { concepto: string; valor: number }[]): DesgloseLine[] { return raw.map(r => ({ concepto: r.concepto, valor: r.valor })); }
}
