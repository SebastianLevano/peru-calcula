import { Component, inject, signal, computed, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiClientService } from '../../../core/api-client.service';
import { SeoService } from '../../../core/seo.service';
import { AnalyticsService } from '../../../core/analytics.service';
import { ResultCardComponent, ResultadoConfianza, DesgloseLine } from '../../../shared/components/result-card.component';
import { CalcInputComponent } from '../../../shared/ui/calc-input.component';
import { InputMesesComponent } from '../../../shared/ui/input-meses.component';

interface PeriodoInfo {
  nombre: string; inicioEfectivo: string; finEfectivo: string;
  mesesCompletados: number; diasAdicionales: number;
}
interface CtsRespuesta {
  resultado: { montoFinal: number; moneda: string };
  periodo: PeriodoInfo | null;
  desglose: { concepto: string; valor: number }[];
  formula: string;
  confianza: ResultadoConfianza;
}

const MESES_CTS: Record<'mayo' | 'noviembre', string[]> = {
  mayo:      ['Nov', 'Dic', 'Ene', 'Feb', 'Mar', 'Abr'],
  noviembre: ['May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct'],
};

function defaultPeriodoCts(): 'mayo' | 'noviembre' {
  const m = new Date().getMonth() + 1;
  return [11, 12, 1, 2, 3, 4].includes(m) ? 'mayo' : 'noviembre';
}

@Component({
  selector: 'app-cts',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ResultCardComponent, CalcInputComponent, InputMesesComponent],
  template: `
    <main class="max-w-2xl mx-auto py-10 px-4 space-y-8">
      <header>
        <h1 class="text-3xl font-bold text-gray-900">Calculadora de CTS</h1>
        <p class="mt-2 text-gray-600 text-sm">
          Compensación por Tiempo de Servicios semestral según D.Leg. 650.
          RC incluye básico, asig. familiar, 1/6 gratificación y promedios de variables.
        </p>
      </header>

      <!-- Selector de período -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <p class="text-sm font-medium text-gray-700 mb-3">¿Para qué depósito calculás?</p>
        <div class="grid grid-cols-2 gap-3">
          @for (op of opcionesPeriodo; track op.valor) {
            <button type="button"
              (click)="periodoDeposito.set(op.valor)"
              [class]="'rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ' +
                (periodoDeposito() === op.valor
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300')">
              {{ op.label }}
              <span class="block text-xs font-normal opacity-70">{{ op.sub }}</span>
            </button>
          }
        </div>
      </div>

      <form [formGroup]="form" (ngSubmit)="calcular()" class="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">

        <app-calc-input label="Remuneración básica mensual" inputId="basico" prefix="S/"
          placeholder="2000" [required]="true" formControlName="remuneracionBasica" />

        <label class="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" formControlName="tieneHijos"
                 class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <span class="text-sm font-medium text-gray-700">
            Tengo hijos a cargo <span class="text-gray-500">(asignación familiar 10% de la RMV)</span>
          </span>
        </label>

        <div>
          <label for="fechaIngreso" class="block text-sm font-medium text-gray-700 mb-1">Fecha de inicio en la empresa</label>
          <input type="date" id="fechaIngreso" formControlName="fechaIngreso"
                 class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <p class="mt-1 text-xs text-gray-500">El período CTS se calcula automáticamente según el depósito elegido arriba.</p>
        </div>

        <app-calc-input label="Última gratificación recibida (opcional)" inputId="ultimaGrati" prefix="S/"
          placeholder="0" [min]="0" [step]="0.01"
          hint="Si la dejás en 0, se usa básico ÷ 6 como aproximación"
          formControlName="ultimaGratificacion" />

        <!-- Variables mensuales -->
        <div class="rounded-lg bg-gray-50 border border-gray-200 p-4 space-y-5">
          <p class="text-sm font-medium text-gray-700">
            Remuneraciones variables
            <span class="font-normal text-gray-500"> — ingresá cada mes y el promedio se calcula solo (Art. 9 D.Leg. 650)</span>
          </p>
          <app-input-meses #horasRef label="Horas extras (S/)" [mesesLabels]="mesesActuales()" />
          <app-input-meses #comisionesRef label="Comisiones (S/)" [mesesLabels]="mesesActuales()" />
          <app-input-meses #bonosRef label="Otros bonos regulares (S/)" [mesesLabels]="mesesActuales()" />
        </div>

        <app-calc-input label="Días de inasistencia injustificada" inputId="faltas"
          placeholder="0" [min]="0"
          hint="Se descuentan del período computable (Art. 18 D.Leg. 650)"
          formControlName="diasFaltas" />

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
        <app-result-card titulo="Tu CTS semestral"
          [montoFinal]="resultado()!.resultado.montoFinal"
          [desglose]="toDesglose(resultado()!.desglose)"
          [confianza]="resultado()!.confianza" />
      }
    </main>
  `,
})
export class CtsComponent implements OnInit, AfterViewInit {
  private readonly api       = inject(ApiClientService);
  private readonly seo       = inject(SeoService);
  private readonly analytics = inject(AnalyticsService);
  private readonly fb        = inject(FormBuilder);

  @ViewChild('horasRef')      horasRef!:      InputMesesComponent;
  @ViewChild('comisionesRef') comisionesRef!: InputMesesComponent;
  @ViewChild('bonosRef')      bonosRef!:      InputMesesComponent;

  readonly calculando      = signal(false);
  readonly resultado       = signal<CtsRespuesta | null>(null);
  readonly error           = signal<string | null>(null);
  readonly periodoDeposito = signal<'mayo' | 'noviembre'>(defaultPeriodoCts());
  readonly mesesActuales   = computed(() => MESES_CTS[this.periodoDeposito()]);

  readonly opcionesPeriodo = [
    { valor: 'mayo'      as const, label: 'Depósito Mayo',      sub: 'Período Nov – Abr' },
    { valor: 'noviembre' as const, label: 'Depósito Noviembre', sub: 'Período May – Oct' },
  ];

  readonly form = this.fb.group({
    remuneracionBasica:  [null as number | null, [Validators.required, Validators.min(1)]],
    tieneHijos:          [false],
    fechaIngreso:        [null as string | null, Validators.required],
    ultimaGratificacion: [0, [Validators.min(0)]],
    diasFaltas:          [0, [Validators.min(0)]],
  });

  ngOnInit() {
    this.seo.set({
      title: 'Calculadora de CTS — Perú Calcula',
      description: 'Calcula tu CTS semestral con horas extras, comisiones, última gratificación y días de falta. D.Leg. 650.',
    });
    this.analytics.track({ tipoEvento: 'inicio', calculadoraSlug: 'cts', modulo: 'laboral' });
  }

  ngAfterViewInit() {}

  calcular() {
    if (this.form.invalid) return;
    this.calculando.set(true);
    this.error.set(null);

    const v = this.form.value;

    this.api.post<CtsRespuesta>('/laboral/cts', {
      remuneracionBasica:  v.remuneracionBasica,
      tieneHijos:          v.tieneHijos,
      fechaIngreso:        v.fechaIngreso,
      periodoDeposito:     this.periodoDeposito(),
      ultimaGratificacion: v.ultimaGratificacion ?? 0,
      promedioHorasExtras: this.horasRef?.promedio()      ?? 0,
      promedioComisiones:  this.comisionesRef?.promedio() ?? 0,
      otrosBonos:          this.bonosRef?.promedio()      ?? 0,
      diasFaltas:          v.diasFaltas ?? 0,
    }).subscribe({
      next: (res) => {
        this.resultado.set(res);
        this.calculando.set(false);
        this.analytics.track({
          tipoEvento: 'completado', calculadoraSlug: 'cts', modulo: 'laboral',
          parametrosVersion: res.confianza.parametrosVersion,
        });
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
