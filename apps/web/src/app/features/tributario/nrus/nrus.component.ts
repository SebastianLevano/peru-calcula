import { Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiClientService } from '../../../core/api-client.service';
import { SeoService } from '../../../core/seo.service';
import { AnalyticsService } from '../../../core/analytics.service';
import { ResultCardComponent, DesgloseLine } from '../../../shared/components/result-card.component';
import { CalcInputComponent } from '../../../shared/ui/calc-input.component';
import { AlertComponent } from '../../../shared/components/alert.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state.component';
import { AdsSlotComponent } from '../../../shared/components/ads-slot.component';
import { CalcPageHeaderComponent } from '../../../shared/ui/calc-page-header.component';
import { CalcRelatedComponent } from '../../../shared/ui/calc-related.component';

@Component({
  selector: 'app-nrus',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, ResultCardComponent, CalcInputComponent, AlertComponent, EmptyStateComponent, AdsSlotComponent, CalcPageHeaderComponent, CalcRelatedComponent],
  template: `
    <app-calc-page-header
      titulo="Calculadora NRUS"
      descripcion="Determina tu categoría y cuota mensual en el Nuevo Régimen Único Simplificado (D. Leg. 937)."
      modulo="tributario" />

    <main class="mx-auto max-w-2xl px-4 py-8 space-y-8">
      <form [formGroup]="form" (ngSubmit)="calcular()" class="rounded-card border border-line bg-surface p-6 shadow-card space-y-5">
        <app-calc-input label="Ingresos mensuales" inputId="ingresos" prefix="S/" placeholder="3000" [required]="true" formControlName="ingresosMensuales" />
        <app-calc-input label="Compras mensuales" inputId="compras" prefix="S/" placeholder="2000" hint="Se usa el mayor valor para determinar la categoría" formControlName="comprasMensuales" />
        <div class="flex gap-3">
          <button type="submit" [disabled]="form.invalid || calculando()"
            class="flex-1 rounded-input bg-primary-700 py-3 text-sm font-semibold text-white hover:bg-primary-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            @if (calculando()) { <span class="inline-flex items-center justify-center gap-2"><svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4z"/></svg>Calculando…</span>
          } @else { Calcular cuota NRUS }
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
        <app-empty-state titulo="Ingresa tus ingresos para ver tu cuota NRUS" />
      }
      @if (resultado()) {
        @if (resultado()!.resultado.categoria > 0) {
          <app-result-card [titulo]="'Categoría ' + resultado()!.resultado.categoria + ' — Cuota mensual'" [montoFinal]="resultado()!.resultado.cuota" [desglose]="toDesglose(resultado()!.desglose)" [confianza]="resultado()!.confianza" calculadoraSlug="nrus" modulo="tributario" />
        } @else {
          <app-alert tone="warn" titulo="No aplica NRUS">{{ resultado()!.resultado.alerta }}</app-alert>
        }
        <app-ads-slot size="banner" />
      }
    </main>

    <app-calc-related slug="/calculadora-rus" />
  `,
})
export class NrusComponent implements OnInit {
  private readonly api = inject(ApiClientService); private readonly seo = inject(SeoService);
  private readonly analytics = inject(AnalyticsService); private readonly fb = inject(FormBuilder);
  readonly calculando = signal(false); readonly resultado = signal<any>(null); readonly error = signal<string | null>(null);
  readonly form = this.fb.group({ ingresosMensuales: [null as number | null, [Validators.required, Validators.min(0)]], comprasMensuales: [0, [Validators.min(0)]] });
  ngOnInit() {
    this.seo.set({ title: 'Calculadora RUS 2026', description: 'Determina tu categoría y cuota mensual del Nuevo RUS según tus ingresos. Normativa SUNAT actualizada.', canonical: '/calculadora-rus' });
    this.analytics.track({ tipoEvento: 'inicio', calculadoraSlug: 'nrus', modulo: 'tributario' });
  }
  limpiar() {
    this.form.reset({ ingresosMensuales: null, comprasMensuales: 0 });
    this.resultado.set(null);
    this.error.set(null);
  }

  calcular() {
    if (this.form.invalid) return;
    this.calculando.set(true); this.error.set(null);
    this.api.post<any>('/tributario/nrus', this.form.value).subscribe({
      next: (res) => { this.resultado.set(res); this.calculando.set(false); this.analytics.track({ tipoEvento: 'completado', calculadoraSlug: 'nrus', modulo: 'tributario' }); },
      error: () => { this.error.set('Error al calcular. Intenta nuevamente.'); this.calculando.set(false); },
    });
  }
  toDesglose(raw: any[]): DesgloseLine[] { return raw.map(r => ({ concepto: r.concepto, valor: r.valor })); }
}
