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
  selector: 'app-credito-hipotecario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ResultCardComponent, CalcInputComponent],
  template: `
    <main class="max-w-2xl mx-auto py-10 px-4 space-y-8">
      <header>
        <h1 class="text-3xl font-bold text-gray-900">Simulador de Crédito Hipotecario</h1>
        <p class="mt-2 text-gray-600 text-sm">
          Calcula la cuota mensual y el cronograma de tu crédito hipotecario con el sistema francés.
          Compatible con Mivivienda, Techo Propio y créditos libre disposición. Ingresa la TEA de tu banco.
        </p>
      </header>

      <form [formGroup]="form" (ngSubmit)="calcular()" class="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
        <app-calc-input label="Monto del préstamo" inputId="monto" prefix="S/"
          placeholder="200000" [required]="true" [min]="5000" formControlName="monto" />

        <div class="grid grid-cols-2 gap-4">
          <app-calc-input label="Plazo" inputId="plazo" placeholder="240"
            hint="En meses (máx. 360 = 30 años)" [min]="12" [max]="360" formControlName="plazoMeses" />
          <app-calc-input label="TEA (%)" inputId="tea" placeholder="9.5"
            hint="Tasa Efectiva Anual" [min]="0" [max]="100" [step]="0.01" formControlName="tea" />
        </div>

        <div class="rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-700 space-y-1">
          <p><strong>Plazos comunes:</strong> 120 meses (10 años), 180 (15 años), 240 (20 años), 300 (25 años).</p>
          <p>Este simulador no incluye seguro de desgravamen ni seguro de bien inmueble — consulta con tu banco.</p>
        </div>

        <button type="submit" [disabled]="form.invalid || calculando()"
          class="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700
                 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {{ calculando() ? 'Calculando…' : 'Simular crédito hipotecario' }}
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

        <!-- Resumen rápido -->
        <div class="grid grid-cols-3 gap-4">
          <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div class="text-xs text-gray-500 mb-1">Total a pagar</div>
            <div class="text-lg font-bold text-gray-900">
              {{ resultado()!.resultado.totalPagado | currency:'PEN':'symbol':'1.0-0' }}
            </div>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div class="text-xs text-gray-500 mb-1">Total en intereses</div>
            <div class="text-lg font-bold text-red-600">
              {{ resultado()!.resultado.totalIntereses | currency:'PEN':'symbol':'1.0-0' }}
            </div>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div class="text-xs text-gray-500 mb-1">TEM</div>
            <div class="text-lg font-bold text-gray-900">
              {{ resultado()!.resultado.tem | number:'1.4-4' }}%
            </div>
          </div>
        </div>

        <!-- Cronograma -->
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <h2 class="px-6 py-4 text-base font-semibold text-gray-900 border-b border-gray-100">
            Cronograma de pagos ({{ resultado()!.cronograma.length }} cuotas)
          </h2>
          <div class="overflow-x-auto max-h-96 overflow-y-auto">
            <table class="w-full text-sm" aria-label="Cronograma de amortización hipotecario">
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
export class CreditoHipotecarioComponent implements OnInit {
  private readonly api       = inject(ApiClientService);
  private readonly seo       = inject(SeoService);
  private readonly analytics = inject(AnalyticsService);
  private readonly fb        = inject(FormBuilder);

  readonly calculando = signal(false);
  readonly resultado  = signal<CreditoRespuesta | null>(null);
  readonly error      = signal<string | null>(null);

  readonly form = this.fb.group({
    monto:       [null as number | null, [Validators.required, Validators.min(5000)]],
    plazoMeses:  [240, [Validators.required, Validators.min(12), Validators.max(360)]],
    tea:         [9.5, [Validators.required, Validators.min(0), Validators.max(100)]],
  });

  ngOnInit() {
    this.seo.set({
      title: 'Simulador de Crédito Hipotecario — Perú Calcula',
      description: 'Calcula la cuota de tu crédito hipotecario en Perú. Compatible con Mivivienda, Techo Propio y crédito libre disposición. Cronograma completo.',
    });
    this.analytics.track({ tipoEvento: 'inicio', calculadoraSlug: 'credito-hipotecario', modulo: 'finanzas' });
  }

  calcular() {
    if (this.form.invalid) return;
    this.calculando.set(true);
    this.error.set(null);
    this.api.post<CreditoRespuesta>('/finanzas/credito-hipotecario', this.form.value).subscribe({
      next: (res) => {
        this.resultado.set(res);
        this.calculando.set(false);
        this.analytics.track({ tipoEvento: 'completado', calculadoraSlug: 'credito-hipotecario', modulo: 'finanzas' });
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
