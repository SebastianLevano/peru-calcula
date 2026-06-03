import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiClientService } from '../../../core/api-client.service';
import { SeoService } from '../../../core/seo.service';
import { AnalyticsService } from '../../../core/analytics.service';
import { ResultCardComponent, DesgloseLine } from '../../../shared/components/result-card.component';
import { CalcInputComponent } from '../../../shared/ui/calc-input.component';

@Component({
  selector: 'app-rer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ResultCardComponent, CalcInputComponent],
  template: `
    <main class="max-w-2xl mx-auto py-10 px-4 space-y-8">
      <header>
        <h1 class="text-3xl font-bold text-gray-900">Calculadora RER</h1>
        <p class="mt-2 text-gray-600 text-sm">Pago mensual del Régimen Especial de Renta: 1.5% sobre ingresos netos (Art. 120 TUO LIR).</p>
      </header>
      <form [formGroup]="form" (ngSubmit)="calcular()" class="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
        <app-calc-input label="Ingresos netos del mes" inputId="ingresos" prefix="S/" placeholder="10000" [required]="true" formControlName="ingresosMensuales" />
        <button type="submit" [disabled]="form.invalid || calculando()"
          class="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors">
          {{ calculando() ? 'Calculando…' : 'Calcular impuesto RER' }}
        </button>
      </form>
      @if (error()) { <div class="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700" role="alert">{{ error() }}</div> }
      @if (resultado()) {
        <app-result-card titulo="Impuesto mensual RER" [montoFinal]="resultado()!.resultado.impuesto" [desglose]="toDesglose(resultado()!.desglose)" [confianza]="resultado()!.confianza" />
        @if (resultado()!.resultado.superaTopeAnual) {
          <div class="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
            <strong>Atención:</strong> tu proyección anual supera el tope del RER (S/ 525,000). Considera cambiar al Régimen MYPE Tributario.
          </div>
        }
      }
    </main>`,
})
export class RerComponent implements OnInit {
  private readonly api = inject(ApiClientService); private readonly seo = inject(SeoService);
  private readonly analytics = inject(AnalyticsService); private readonly fb = inject(FormBuilder);
  readonly calculando = signal(false); readonly resultado = signal<any>(null); readonly error = signal<string | null>(null);
  readonly form = this.fb.group({ ingresosMensuales: [null as number | null, [Validators.required, Validators.min(1)]] });
  ngOnInit() {
    this.seo.set({ title: 'Calculadora RER', description: 'Calcula el pago mensual del Régimen Especial de Renta (RER): 1.5% de ingresos netos.' });
    this.analytics.track({ tipoEvento: 'inicio', calculadoraSlug: 'rer', modulo: 'tributario' });
  }
  calcular() {
    if (this.form.invalid) return;
    this.calculando.set(true); this.error.set(null);
    this.api.post<any>('/tributario/rer', this.form.value).subscribe({
      next: (res) => { this.resultado.set(res); this.calculando.set(false); this.analytics.track({ tipoEvento: 'completado', calculadoraSlug: 'rer', modulo: 'tributario' }); },
      error: () => { this.error.set('Error al calcular. Intenta nuevamente.'); this.calculando.set(false); },
    });
  }
  toDesglose(raw: any[]): DesgloseLine[] { return raw.map(r => ({ concepto: r.concepto, valor: r.valor })); }
}
