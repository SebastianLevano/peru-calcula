import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiClientService } from '../../../core/api-client.service';
import { SeoService } from '../../../core/seo.service';
import { AnalyticsService } from '../../../core/analytics.service';
import { ResultCardComponent, ResultadoConfianza, DesgloseLine } from '../../../shared/components/result-card.component';
import { CalcInputComponent } from '../../../shared/ui/calc-input.component';

interface PeriodoInfo { nombre: string; inicioEfectivo: string; finEfectivo: string; mesesCompletados: number; diasAdicionales: number; }
interface CtsRespuesta {
  resultado: { montoFinal: number; moneda: string };
  periodo: PeriodoInfo | null;
  desglose: { concepto: string; valor: number }[];
  formula: string;
  confianza: ResultadoConfianza;
}

@Component({
  selector: 'app-cts',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ResultCardComponent, CalcInputComponent],
  template: `
    <main class="max-w-2xl mx-auto py-10 px-4 space-y-8">
      <header>
        <h1 class="text-3xl font-bold text-gray-900">Calculadora de CTS</h1>
        <p class="mt-2 text-gray-600 text-sm">
          Calcula tu Compensación por Tiempo de Servicios semestral según el D.Leg. 650.
          La RC incluye básico, asignación familiar, 1/6 de gratificación y promedios de horas extras y comisiones.
        </p>
      </header>

      <form [formGroup]="form" (ngSubmit)="calcular()" class="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">

        <!-- Remuneración básica -->
        <app-calc-input label="Remuneración básica mensual" inputId="basico" prefix="S/"
          placeholder="2000" [required]="true" formControlName="remuneracionBasica" />

        <!-- Tiene hijos -->
        <label class="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" formControlName="tieneHijos"
                 class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <span class="text-sm font-medium text-gray-700">
            Tengo hijos a cargo <span class="text-gray-500">(asignación familiar 10% de la RMV)</span>
          </span>
        </label>

        <!-- Período: fecha de ingreso -->
        <div>
          <label for="fechaIngreso" class="block text-sm font-medium text-gray-700 mb-1">
            Fecha de inicio en la empresa
          </label>
          <input type="date" id="fechaIngreso" formControlName="fechaIngreso"
                 class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <p class="mt-1 text-xs text-gray-500">El período CTS se calcula automáticamente (1 nov–30 abr o 1 may–31 oct).</p>
        </div>

        <!-- Remuneraciones variables -->
        <div class="rounded-lg bg-gray-50 border border-gray-200 p-4 space-y-4">
          <p class="text-sm font-medium text-gray-700">
            Remuneraciones variables <span class="font-normal text-gray-500">(promedio mensual del semestre — Art. 9 D.Leg. 650)</span>
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <app-calc-input label="Horas extras" inputId="horas" prefix="S/"
              placeholder="0" [min]="0" [step]="0.01"
              hint="Prom. mens. últimos 6 meses"
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
        </div>

        <button type="submit" [disabled]="form.invalid || calculando()"
          class="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700
                 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {{ calculando() ? 'Calculando…' : 'Calcular CTS' }}
        </button>
      </form>

      @if (error()) {
        <div class="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700" role="alert">{{ error() }}</div>
      }

      @if (resultado()) {
        <!-- Período detectado -->
        @if (resultado()!.periodo) {
          <div class="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm">
            <p class="font-medium text-blue-800">Período detectado: {{ resultado()!.periodo!.nombre }}</p>
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

        <app-result-card titulo="Tu CTS semestral"
          [montoFinal]="resultado()!.resultado.montoFinal"
          [desglose]="toDesglose(resultado()!.desglose)"
          [confianza]="resultado()!.confianza" />
      }
    </main>
  `,
})
export class CtsComponent implements OnInit {
  private readonly api       = inject(ApiClientService);
  private readonly seo       = inject(SeoService);
  private readonly analytics = inject(AnalyticsService);
  private readonly fb        = inject(FormBuilder);

  readonly calculando = signal(false);
  readonly resultado  = signal<CtsRespuesta | null>(null);
  readonly error      = signal<string | null>(null);

  readonly form = this.fb.group({
    remuneracionBasica:  [null as number | null, [Validators.required, Validators.min(1)]],
    tieneHijos:          [false],
    fechaIngreso:        [null as string | null, Validators.required],
    promedioHorasExtras: [0, [Validators.min(0)]],
    promedioComisiones:  [0, [Validators.min(0)]],
    otrosBonos:          [0, [Validators.min(0)]],
  });

  ngOnInit() {
    this.seo.set({
      title: 'Calculadora de CTS — Perú Calcula',
      description: 'Calcula tu CTS semestral con horas extras, comisiones y bonos. Cálculo según D.Leg. 650. Gratuito y sin registro.',
    });
    this.analytics.track({ tipoEvento: 'inicio', calculadoraSlug: 'cts', modulo: 'laboral' });
  }

  calcular() {
    if (this.form.invalid) return;
    this.calculando.set(true);
    this.error.set(null);

    const { remuneracionBasica, tieneHijos, fechaIngreso, promedioHorasExtras, promedioComisiones, otrosBonos } = this.form.value;

    this.api.post<CtsRespuesta>('/laboral/cts', {
      remuneracionBasica,
      tieneHijos,
      fechaIngreso,
      promedioHorasExtras: promedioHorasExtras ?? 0,
      promedioComisiones:  promedioComisiones  ?? 0,
      otrosBonos:          otrosBonos          ?? 0,
    }).subscribe({
      next: (res) => {
        this.resultado.set(res);
        this.calculando.set(false);
        this.analytics.track({ tipoEvento: 'completado', calculadoraSlug: 'cts', modulo: 'laboral',
                               parametrosVersion: res.confianza.parametrosVersion });
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
