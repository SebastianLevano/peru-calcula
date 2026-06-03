import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiClientService } from '../../../core/api-client.service';
import { SeoService } from '../../../core/seo.service';
import { AnalyticsService } from '../../../core/analytics.service';
import { ResultCardComponent, ResultadoConfianza, DesgloseLine } from '../../../shared/components/result-card.component';
import { CalcInputComponent } from '../../../shared/ui/calc-input.component';

interface CuotaCronograma { mes: number; cuota: number; interes: number; amortizacion: number; saldo: number; }
interface CreditoRespuesta {
  resultado: { cuota: number; tem: number; totalPagado: number; totalIntereses: number; moneda: string };
  desglose: { concepto: string; valor: number }[];
  cronograma: CuotaCronograma[];
  confianza: ResultadoConfianza;
}

@Component({
  selector: 'app-credito-personal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ResultCardComponent, CalcInputComponent],
  template: `
    <main class="max-w-2xl mx-auto py-10 px-4 space-y-8">
      <header>
        <h1 class="text-3xl font-bold text-gray-900">Simulador de Crédito Personal</h1>
        <p class="mt-2 text-gray-600 text-sm">
          Calcula tu cuota mensual y el cronograma completo con el sistema francés (cuota fija).
        </p>
      </header>

      <form [formGroup]="form" (ngSubmit)="calcular()" class="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
        <app-calc-input label="Monto del préstamo" inputId="monto" prefix="S/"
          placeholder="10000" [required]="true" [min]="100" formControlName="monto" />

        <div class="grid grid-cols-2 gap-4">
          <app-calc-input label="Plazo" inputId="plazo" placeholder="24"
            hint="En meses (máx. 360)" [min]="1" [max]="360" formControlName="plazoMeses" />
          <app-calc-input label="TEA (%)" inputId="tea" placeholder="25"
            hint="Tasa Efectiva Anual" [min]="0" [max]="1000" [step]="0.01" formControlName="tea" />
        </div>

        <button type="submit" [disabled]="form.invalid || calculando()"
          class="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700
                 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {{ calculando() ? 'Calculando…' : 'Simular crédito' }}
        </button>
      </form>

      @if (error()) {
        <div class="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700" role="alert">{{ error() }}</div>
      }

      @if (resultado()) {
        <app-result-card titulo="Cuota mensual"
          [montoFinal]="resultado()!.resultado.cuota"
          [desglose]="toDesglose(resultado()!.desglose)"
          [confianza]="resultado()!.confianza" />

        <!-- Cronograma -->
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <h2 class="px-6 py-4 text-base font-semibold text-gray-900 border-b border-gray-100">
            Cronograma de pagos
          </h2>
          <div class="overflow-x-auto max-h-96 overflow-y-auto">
            <table class="w-full text-sm" aria-label="Cronograma de amortización">
              <thead class="sticky top-0 bg-gray-50">
                <tr>
                  <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Mes</th>
                  <th class="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Cuota</th>
                  <th class="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Interés</th>
                  <th class="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Amort.</th>
                  <th class="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Saldo</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                @for (row of resultado()!.cronograma; track row.mes) {
                  <tr class="hover:bg-gray-50">
                    <td class="px-4 py-2 text-gray-600">{{ row.mes }}</td>
                    <td class="px-4 py-2 text-right">{{ row.cuota | currency:'PEN':'symbol':'1.2-2' }}</td>
                    <td class="px-4 py-2 text-right text-red-600">{{ row.interes | currency:'PEN':'symbol':'1.2-2' }}</td>
                    <td class="px-4 py-2 text-right text-green-600">{{ row.amortizacion | currency:'PEN':'symbol':'1.2-2' }}</td>
                    <td class="px-4 py-2 text-right font-medium">{{ row.saldo | currency:'PEN':'symbol':'1.2-2' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </main>
  `,
})
export class CreditoPersonalComponent implements OnInit {
  private readonly api       = inject(ApiClientService);
  private readonly seo       = inject(SeoService);
  private readonly analytics = inject(AnalyticsService);
  private readonly fb        = inject(FormBuilder);

  readonly calculando = signal(false);
  readonly resultado  = signal<CreditoRespuesta | null>(null);
  readonly error      = signal<string | null>(null);

  readonly form = this.fb.group({
    monto:       [null as number | null, [Validators.required, Validators.min(100)]],
    plazoMeses:  [24, [Validators.required, Validators.min(1), Validators.max(360)]],
    tea:         [25, [Validators.required, Validators.min(0), Validators.max(1000)]],
  });

  ngOnInit() {
    this.seo.set({
      title: 'Simulador de Crédito Personal',
      description: 'Simula tu crédito personal: calcula la cuota mensual y el cronograma completo con el sistema francés. Gratuito y sin registro.',
    });
    this.analytics.track({ tipoEvento: 'inicio', calculadoraSlug: 'credito-personal', modulo: 'finanzas' });
  }

  calcular() {
    if (this.form.invalid) return;
    this.calculando.set(true);
    this.error.set(null);
    this.api.post<CreditoRespuesta>('/finanzas/credito-personal', this.form.value).subscribe({
      next: (res) => {
        this.resultado.set(res);
        this.calculando.set(false);
        this.analytics.track({ tipoEvento: 'completado', calculadoraSlug: 'credito-personal', modulo: 'finanzas' });
      },
      error: () => {
        this.error.set('Ocurrió un error al calcular. Intenta nuevamente.');
        this.calculando.set(false);
      },
    });
  }

  toDesglose(raw: { concepto: string; valor: number }[]): DesgloseLine[] {
    return raw.map(r => ({ concepto: r.concepto, valor: r.valor }));
  }
}
