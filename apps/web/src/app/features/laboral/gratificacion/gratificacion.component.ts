import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiClientService } from '../../../core/api-client.service';
import { SeoService } from '../../../core/seo.service';
import { AnalyticsService } from '../../../core/analytics.service';
import { ResultCardComponent, ResultadoConfianza, DesgloseLine } from '../../../shared/components/result-card.component';
import { CalcInputComponent } from '../../../shared/ui/calc-input.component';

interface PeriodoInfo { nombre: string; inicioEfectivo: string; finEfectivo: string; mesesCompletados: number; diasAdicionales: number; }
interface GratificacionRespuesta {
  resultado: { gratificacion: number; bonificacionExtraordinaria: number; totalDeposito: number; moneda: string };
  periodo: PeriodoInfo | null;
  desglose: { concepto: string; valor: number }[];
  formula: string;
  confianza: ResultadoConfianza;
}

@Component({
  selector: 'app-gratificacion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ResultCardComponent, CalcInputComponent],
  template: `
    <main class="max-w-2xl mx-auto py-10 px-4 space-y-8">
      <header>
        <h1 class="text-3xl font-bold text-gray-900">Calculadora de Gratificación</h1>
        <p class="mt-2 text-gray-600 text-sm">
          Gratificación ordinaria de julio y diciembre + bonificación extraordinaria (Ley 27735 / Ley 29351).
          Incluye comisiones y bonos regulares en la remuneración computable.
        </p>
      </header>

      <form [formGroup]="form" (ngSubmit)="calcular()" class="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">

        <app-calc-input label="Remuneración básica mensual" inputId="basico" prefix="S/"
          placeholder="3000" [required]="true" formControlName="remuneracionBasica" />

        <label class="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" formControlName="tieneHijos"
                 class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <span class="text-sm font-medium text-gray-700">
            Tengo hijos a cargo <span class="text-gray-500">(asignación familiar 10% RMV)</span>
          </span>
        </label>

        <!-- Fecha de ingreso -->
        <div>
          <label for="fechaIngreso" class="block text-sm font-medium text-gray-700 mb-1">
            Fecha de inicio en la empresa
          </label>
          <input type="date" id="fechaIngreso" formControlName="fechaIngreso"
                 class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <p class="mt-1 text-xs text-gray-500">El período se calcula automáticamente (Ene–Jun para julio, Jul–Dic para diciembre).</p>
        </div>

        <!-- Remuneraciones variables -->
        <div class="rounded-lg bg-gray-50 border border-gray-200 p-4 space-y-4">
          <p class="text-sm font-medium text-gray-700">
            Remuneraciones variables <span class="font-normal text-gray-500">(promedio mensual del semestre — Ley 27735 Art. 3)</span>
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <app-calc-input label="Horas extras" inputId="horas" prefix="S/"
              placeholder="0" [min]="0" [step]="0.01"
              hint="Solo si son regulares ≥ 3 meses"
              formControlName="promedioHorasExtras" />
            <app-calc-input label="Comisiones" inputId="comisiones" prefix="S/"
              placeholder="0" [min]="0" [step]="0.01"
              hint="Prom. mens. del semestre"
              formControlName="promedioComisiones" />
            <app-calc-input label="Otros bonos" inputId="bonos" prefix="S/"
              placeholder="0" [min]="0" [step]="0.01"
              hint="Bonos regulares (≥ 3 meses)"
              formControlName="otrosBonos" />
          </div>
          <p class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            Las horas extras integran la RC solo si fueron percibidas en al menos 3 de los 6 meses del semestre (Art. 3 Ley 27735). Déjalas en 0 si no aplica.
          </p>
        </div>

        <!-- EPS -->
        <label class="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" formControlName="aportaAEps"
                 class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <span class="text-sm font-medium text-gray-700">Aporto a EPS (6.75%) en lugar de EsSalud (9%)</span>
        </label>

        <button type="submit" [disabled]="form.invalid || calculando()"
          class="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700
                 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {{ calculando() ? 'Calculando…' : 'Calcular Gratificación' }}
        </button>
      </form>

      @if (error()) {
        <div class="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700" role="alert">{{ error() }}</div>
      }

      @if (resultado()) {
        <!-- Período -->
        @if (resultado()!.periodo) {
          <div class="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm">
            <p class="font-medium text-blue-800">Período: {{ resultado()!.periodo!.nombre }}</p>
            <p class="text-blue-700 mt-0.5">
              {{ resultado()!.periodo!.inicioEfectivo | date:'dd MMM yyyy':'':'es' }}
              → {{ resultado()!.periodo!.finEfectivo | date:'dd MMM yyyy':'':'es' }}
              · {{ resultado()!.periodo!.mesesCompletados }} mes{{ resultado()!.periodo!.mesesCompletados !== 1 ? 'es' : '' }}
              @if (resultado()!.periodo!.diasAdicionales > 0) {
                y {{ resultado()!.periodo!.diasAdicionales }} día{{ resultado()!.periodo!.diasAdicionales !== 1 ? 's' : '' }}
              }
            </p>
          </div>
        }

        <app-result-card titulo="Total a depositar"
          [montoFinal]="resultado()!.resultado.totalDeposito"
          [desglose]="toDesglose(resultado()!.desglose)"
          [confianza]="resultado()!.confianza" />

        <!-- Detalle gratificación vs bonificación -->
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div class="text-xs text-gray-500 mb-1">Gratificación</div>
            <div class="text-lg font-bold text-gray-900">
              {{ resultado()!.resultado.gratificacion | currency:'PEN':'symbol':'1.2-2' }}
            </div>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div class="text-xs text-gray-500 mb-1">Bonificación extraordinaria</div>
            <div class="text-lg font-bold text-green-700">
              {{ resultado()!.resultado.bonificacionExtraordinaria | currency:'PEN':'symbol':'1.2-2' }}
            </div>
          </div>
        </div>
      }
    </main>
  `,
})
export class GratificacionComponent implements OnInit {
  private readonly api       = inject(ApiClientService);
  private readonly seo       = inject(SeoService);
  private readonly analytics = inject(AnalyticsService);
  private readonly fb        = inject(FormBuilder);

  readonly calculando = signal(false);
  readonly resultado  = signal<GratificacionRespuesta | null>(null);
  readonly error      = signal<string | null>(null);

  readonly form = this.fb.group({
    remuneracionBasica:  [null as number | null, [Validators.required, Validators.min(1)]],
    tieneHijos:          [false],
    fechaIngreso:        [null as string | null, Validators.required],
    aportaAEps:          [false],
    promedioHorasExtras: [0, [Validators.min(0)]],
    promedioComisiones:  [0, [Validators.min(0)]],
    otrosBonos:          [0, [Validators.min(0)]],
  });

  ngOnInit() {
    this.seo.set({
      title: 'Calculadora de Gratificación — Perú Calcula',
      description: 'Calcula tu gratificación de julio o diciembre con bonificación extraordinaria. Incluye comisiones y bonos regulares. Según Ley 27735.',
    });
    this.analytics.track({ tipoEvento: 'inicio', calculadoraSlug: 'gratificacion', modulo: 'laboral' });
  }

  calcular() {
    if (this.form.invalid) return;
    this.calculando.set(true);
    this.error.set(null);

    const { remuneracionBasica, tieneHijos, fechaIngreso, aportaAEps,
            promedioHorasExtras, promedioComisiones, otrosBonos } = this.form.value;

    this.api.post<GratificacionRespuesta>('/laboral/gratificacion', {
      remuneracionBasica,
      tieneHijos,
      fechaIngreso,
      aportaAEps,
      promedioHorasExtras: promedioHorasExtras ?? 0,
      promedioComisiones:  promedioComisiones  ?? 0,
      otrosBonos:          otrosBonos          ?? 0,
    }).subscribe({
      next: (res) => {
        this.resultado.set(res);
        this.calculando.set(false);
        this.analytics.track({ tipoEvento: 'completado', calculadoraSlug: 'gratificacion', modulo: 'laboral' });
      },
      error: () => {
        this.error.set('Error al calcular. Intenta nuevamente.');
        this.calculando.set(false);
      },
    });
  }

  toDesglose(raw: { concepto: string; valor: number }[]): DesgloseLine[] {
    return raw.map(r => ({ concepto: r.concepto, valor: r.valor }));
  }
}
