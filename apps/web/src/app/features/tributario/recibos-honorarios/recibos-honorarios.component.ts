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

interface RecibosRespuesta {
  resultado: { montoRecibo: number; aplicaRetencion: boolean; montoRetencion: number; montoNeto: number; moneda: string };
  desglose: { concepto: string; valor: number }[];
  suspension: { calificaSuspension: boolean; proyeccionAnual: number; limiteExencion: number; mensaje: string };
  confianza: ResultadoConfianza;
}

@Component({
  selector: 'app-recibos-honorarios',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, CurrencyPipe, DecimalPipe, ResultCardComponent, CalcInputComponent, AlertComponent, EmptyStateComponent, AdsSlotComponent, CalcPageHeaderComponent],
  template: `
    <app-calc-page-header
      titulo="Recibos por Honorarios"
      descripcion="Retención de 4.ª categoría y verificación de suspensión ante SUNAT (art. 74 TUO LIR)."
      modulo="tributario" />

    <main class="mx-auto max-w-2xl px-4 py-8 space-y-8">

      <form [formGroup]="form" (ngSubmit)="calcular()" class="rounded-card border border-line bg-surface p-6 shadow-card space-y-5">
        <app-calc-input label="Monto del recibo" inputId="monto" prefix="S/" placeholder="2000" [required]="true" [min]="1" formControlName="montoRecibo" />
        <div class="flex gap-3">
          <button type="submit" [disabled]="form.invalid || calculando()"
            class="flex-1 rounded-input bg-primary-700 py-3 text-sm font-semibold text-white hover:bg-primary-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            @if (calculando()) { <span class="inline-flex items-center justify-center gap-2"><svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4z"/></svg>Calculando…</span>
          } @else { Calcular }
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
      @if (!resultado() && !calculando() && !error()) {
        <app-empty-state titulo="Ingresa el monto del recibo para calcular" mensaje="Obtendrás el monto de retención, tu neto y si calificas para suspensión." />
      }
      @if (resultado()) {
        <app-result-card [titulo]="resultado()!.resultado.aplicaRetencion ? 'Monto neto (con retención del 8%)' : 'Monto neto (sin retención)'"
          [montoFinal]="resultado()!.resultado.montoNeto" [desglose]="toDesglose(resultado()!.desglose)" [confianza]="resultado()!.confianza" calculadoraSlug="recibos-honorarios" modulo="tributario" />

        <div class="rounded-card border p-5 space-y-2"
             [class]="resultado()!.suspension.calificaSuspension ? 'border-ok-600/25 bg-ok-50' : 'border-warn-600/25 bg-warn-50'">
          <p class="text-sm font-semibold" [class]="resultado()!.suspension.calificaSuspension ? 'text-ok-600' : 'text-warn-600'">
            {{ resultado()!.suspension.calificaSuspension ? '✓ Puedes solicitar suspensión de retención' : 'No calificas para suspensión este período' }}
          </p>
          <p class="text-sm text-ink-600">{{ resultado()!.suspension.mensaje }}</p>
          <p class="text-xs text-ink-500">
            Proyección anual: {{ resultado()!.suspension.proyeccionAnual | currency:'PEN':'symbol':'1.2-2':'es-PE' }} /
            Límite 7 UIT: {{ resultado()!.suspension.limiteExencion | currency:'PEN':'symbol':'1.2-2':'es-PE' }}
          </p>
        </div>
        <app-ads-slot size="banner" />
      }
    </main>
  `,
})
export class RecibosHonorariosComponent implements OnInit {
  private readonly api = inject(ApiClientService); private readonly seo = inject(SeoService);
  private readonly analytics = inject(AnalyticsService); private readonly fb = inject(FormBuilder);
  readonly calculando = signal(false); readonly resultado = signal<RecibosRespuesta | null>(null); readonly error = signal<string | null>(null);
  readonly form = this.fb.group({ montoRecibo: [null as number | null, [Validators.required, Validators.min(1)]] });
  ngOnInit() {
    this.seo.set({ title: 'Calculadora de Recibos por Honorarios', description: 'Calcula la retención de 4.ª categoría y verifica la suspensión ante SUNAT.', canonical: '/calculadora-recibos-por-honorarios' });
    this.analytics.track({ tipoEvento: 'inicio', calculadoraSlug: 'recibos-honorarios', modulo: 'tributario' });
  }
  limpiar() {
    this.form.reset({ montoRecibo: null });
    this.resultado.set(null);
    this.error.set(null);
  }

  calcular() {
    if (this.form.invalid) return;
    this.calculando.set(true); this.error.set(null);
    this.api.post<RecibosRespuesta>('/tributario/recibos-honorarios', this.form.value).subscribe({
      next: (res) => { this.resultado.set(res); this.calculando.set(false); this.analytics.track({ tipoEvento: 'completado', calculadoraSlug: 'recibos-honorarios', modulo: 'tributario' }); },
      error: () => { this.error.set('Ocurrió un error al calcular. Intenta nuevamente.'); this.calculando.set(false); },
    });
  }
  toDesglose(raw: { concepto: string; valor: number }[]): DesgloseLine[] { return raw.map(r => ({ concepto: r.concepto, valor: r.valor })); }
}
