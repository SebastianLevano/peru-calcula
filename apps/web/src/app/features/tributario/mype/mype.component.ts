import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiClientService } from '../../../core/api-client.service';
import { SeoService } from '../../../core/seo.service';
import { AnalyticsService } from '../../../core/analytics.service';
import { ResultCardComponent, DesgloseLine } from '../../../shared/components/result-card.component';
import { CalcInputComponent } from '../../../shared/ui/calc-input.component';

@Component({
  selector: 'app-mype',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ResultCardComponent, CalcInputComponent],
  template: `
    <main class="max-w-2xl mx-auto py-10 px-4 space-y-8">
      <header>
        <h1 class="text-3xl font-bold text-gray-900">Calculadora Régimen MYPE Tributario</h1>
        <p class="mt-2 text-gray-600 text-sm">Pago a cuenta mensual y renta anual estimada (D.Leg. 1269). Tramos: 10% hasta 15 UIT, 29.5% el exceso.</p>
      </header>
      <form [formGroup]="form" (ngSubmit)="calcular()" class="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
        <app-calc-input label="Ingresos netos del mes" inputId="ingresos" prefix="S/" placeholder="15000" [required]="true" formControlName="ingresosNetos" />
        <button type="submit" [disabled]="form.invalid || calculando()"
          class="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors">
          {{ calculando() ? 'Calculando…' : 'Calcular RMT' }}
        </button>
      </form>
      @if (error()) { <div class="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700" role="alert">{{ error() }}</div> }
      @if (resultado()) {
        <app-result-card titulo="Pago a cuenta mensual" [montoFinal]="resultado()!.resultado.pagoACuenta" [desglose]="toDesglose(resultado()!.desglose)" [confianza]="resultado()!.confianza" />
      }
    </main>`,
})
export class MypeComponent implements OnInit {
  private readonly api = inject(ApiClientService); private readonly seo = inject(SeoService);
  private readonly analytics = inject(AnalyticsService); private readonly fb = inject(FormBuilder);
  readonly calculando = signal(false); readonly resultado = signal<any>(null); readonly error = signal<string | null>(null);
  readonly form = this.fb.group({ ingresosNetos: [null as number | null, [Validators.required, Validators.min(1)]] });
  ngOnInit() {
    this.seo.set({ title: 'Calculadora Régimen MYPE Tributario', description: 'Calcula el pago a cuenta mensual y renta anual en el Régimen MYPE Tributario (RMT). Tramos 10% y 29.5%.' });
    this.analytics.track({ tipoEvento: 'inicio', calculadoraSlug: 'mype', modulo: 'tributario' });
  }
  calcular() {
    if (this.form.invalid) return;
    this.calculando.set(true); this.error.set(null);
    this.api.post<any>('/tributario/mype', this.form.value).subscribe({
      next: (res) => { this.resultado.set(res); this.calculando.set(false); this.analytics.track({ tipoEvento: 'completado', calculadoraSlug: 'mype', modulo: 'tributario' }); },
      error: () => { this.error.set('Error al calcular. Intenta nuevamente.'); this.calculando.set(false); },
    });
  }
  toDesglose(raw: any[]): DesgloseLine[] { return raw.map(r => ({ concepto: r.concepto, valor: r.valor })); }
}
