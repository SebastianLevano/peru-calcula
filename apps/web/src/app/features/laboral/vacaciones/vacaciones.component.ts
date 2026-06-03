import { Component, inject, signal, computed, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiClientService } from '../../../core/api-client.service';
import { SeoService } from '../../../core/seo.service';
import { AnalyticsService } from '../../../core/analytics.service';
import { ResultCardComponent, ResultadoConfianza, DesgloseLine } from '../../../shared/components/result-card.component';
import { CalcInputComponent } from '../../../shared/ui/calc-input.component';
import { InputMesesComponent } from '../../../shared/ui/input-meses.component';

interface VacPeriodo {
  nombre: string; ultimoAniversario: string;
  aniosCompletados: number; mesesTruncos: number; diasAdicionales: number;
}
interface VacRespuesta {
  resultado: { total: number; vacacionesOrdinarias: number; vacacionesTruncas: number; vacacionesPendientes: number; moneda: string };
  periodo: VacPeriodo | null;
  advertencia: string | null;
  desglose: { concepto: string; valor: number }[];
  formula: string;
  confianza: ResultadoConfianza;
}

function ultimos12Meses(): string[] {
  const nombres = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const hoy = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - (11 - i), 1);
    return `${nombres[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
  });
}

@Component({
  selector: 'app-vacaciones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ResultCardComponent, CalcInputComponent, InputMesesComponent],
  template: `
    <main class="max-w-2xl mx-auto py-10 px-4 space-y-8">
      <header>
        <h1 class="text-3xl font-bold text-gray-900">Calculadora de Vacaciones</h1>
        <p class="mt-2 text-gray-600 text-sm">
          Vacaciones ordinarias, truncas y pendientes según D.Leg. 713. RC incluye básico, asignación familiar y variables.
        </p>
      </header>

      <!-- Selector tipo -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <p class="text-sm font-medium text-gray-700 mb-3">¿Qué querés calcular?</p>
        <div class="grid grid-cols-2 gap-3">
          @for (op of opcionesTipo; track op.valor) {
            <button type="button"
              (click)="tipoVacaciones.set(op.valor)"
              [class]="'rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ' +
                (tipoVacaciones() === op.valor
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
          placeholder="2500" [required]="true" formControlName="remuneracionBasica" />

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
          <p class="mt-1 text-xs text-gray-500">
            @if (tipoVacaciones() === 'ordinarias') {
              Los años completos se calculan automáticamente.
            } @else {
              Los meses y días truncos se calculan automáticamente desde el último aniversario.
            }
          </p>
        </div>

        @if (tipoVacaciones() === 'ordinarias') {
          <app-calc-input label="Días de vacaciones no gozados (de años anteriores)" inputId="diasPend"
            placeholder="0" [min]="0"
            hint="Días de períodos anteriores que aún no tomaste"
            formControlName="diasPendientes" />
        }

        <!-- Variables mensuales (12 meses) -->
        <div class="rounded-lg bg-gray-50 border border-gray-200 p-4 space-y-5">
          <p class="text-sm font-medium text-gray-700">
            Remuneraciones variables
            <span class="font-normal text-gray-500"> — últimos 12 meses (D.S. 012-92-TR Art. 12)</span>
          </p>
          <app-input-meses #horasRef label="Horas extras (S/)" [mesesLabels]="meses12()" />
          <app-input-meses #comisionesRef label="Comisiones (S/)" [mesesLabels]="meses12()" />
          <app-input-meses #bonosRef label="Otros bonos regulares (S/)" [mesesLabels]="meses12()" />
        </div>

        <app-calc-input
          [label]="tipoVacaciones() === 'ordinarias'
            ? 'Días de inasistencia injustificada (en el año)'
            : 'Días de inasistencia injustificada (en el período)'"
          inputId="faltas" placeholder="0" [min]="0"
          [hint]="tipoVacaciones() === 'ordinarias'
            ? '≥ 30 días: pierde el derecho vacacional del período (D.Leg. 713 Art. 11)'
            : 'Se descuentan del período trunco computable'"
          formControlName="diasFaltasAnio" />

        <button type="submit" [disabled]="form.invalid || calculando()"
          class="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700
                 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {{ calculando() ? 'Calculando…' : 'Calcular Vacaciones' }}
        </button>
      </form>

      @if (error()) {
        <div class="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700" role="alert">{{ error() }}</div>
      }

      @if (resultado()) {
        @if (resultado()!.advertencia) {
          <div class="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800" role="alert">
            ⚠️ {{ resultado()!.advertencia }}
          </div>
        }

        @if (resultado()!.periodo) {
          <div class="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm">
            <p class="font-medium text-blue-800">Antigüedad laboral: {{ resultado()!.periodo!.nombre }}</p>
            <p class="text-blue-700 mt-0.5">
              Último aniversario: {{ resultado()!.periodo!.ultimoAniversario | date:'dd MMM yyyy':'':'es' }}
              · {{ resultado()!.periodo!.aniosCompletados }} año{{ resultado()!.periodo!.aniosCompletados !== 1 ? 's' : '' }}
              @if (resultado()!.periodo!.mesesTruncos > 0) {
                · {{ resultado()!.periodo!.mesesTruncos }} mes{{ resultado()!.periodo!.mesesTruncos !== 1 ? 'es' : '' }} trunco{{ resultado()!.periodo!.mesesTruncos !== 1 ? 's' : '' }}
              }
            </p>
          </div>
        }

        <app-result-card titulo="Total vacaciones"
          [montoFinal]="resultado()!.resultado.total"
          [desglose]="toDesglose(resultado()!.desglose)"
          [confianza]="resultado()!.confianza" />
      }
    </main>
  `,
})
export class VacacionesComponent implements OnInit, AfterViewInit {
  private readonly api       = inject(ApiClientService);
  private readonly seo       = inject(SeoService);
  private readonly analytics = inject(AnalyticsService);
  private readonly fb        = inject(FormBuilder);

  @ViewChild('horasRef')      horasRef!:      InputMesesComponent;
  @ViewChild('comisionesRef') comisionesRef!: InputMesesComponent;
  @ViewChild('bonosRef')      bonosRef!:      InputMesesComponent;

  readonly calculando     = signal(false);
  readonly resultado      = signal<VacRespuesta | null>(null);
  readonly error          = signal<string | null>(null);
  readonly tipoVacaciones = signal<'ordinarias' | 'truncas'>('ordinarias');
  readonly meses12        = signal<string[]>(ultimos12Meses());

  readonly opcionesTipo = [
    { valor: 'ordinarias' as const, label: 'Vacaciones ordinarias', sub: 'Empleado activo — 30 días por año' },
    { valor: 'truncas'    as const, label: 'Al cese / Truncas',     sub: 'Liquidación al terminar contrato' },
  ];

  readonly form = this.fb.group({
    remuneracionBasica: [null as number | null, [Validators.required, Validators.min(1)]],
    tieneHijos:         [false],
    fechaIngreso:       [null as string | null, Validators.required],
    diasPendientes:     [0, [Validators.min(0)]],
    diasFaltasAnio:     [0, [Validators.min(0)]],
  });

  ngOnInit() {
    this.seo.set({
      title: 'Calculadora de Vacaciones — Perú Calcula',
      description: 'Calcula vacaciones ordinarias, truncas y pendientes con horas extras y comisiones. D.Leg. 713.',
    });
    this.analytics.track({ tipoEvento: 'inicio', calculadoraSlug: 'vacaciones', modulo: 'laboral' });
  }

  ngAfterViewInit() {}

  calcular() {
    if (this.form.invalid) return;
    this.calculando.set(true);
    this.error.set(null);

    const v = this.form.value;

    this.api.post<VacRespuesta>('/laboral/vacaciones', {
      remuneracionBasica:  v.remuneracionBasica,
      tieneHijos:          v.tieneHijos,
      fechaIngreso:        v.fechaIngreso,
      diasPendientes:      this.tipoVacaciones() === 'ordinarias' ? (v.diasPendientes ?? 0) : 0,
      promedioHorasExtras: this.horasRef?.promedio()      ?? 0,
      promedioComisiones:  this.comisionesRef?.promedio() ?? 0,
      otrosBonos:          this.bonosRef?.promedio()      ?? 0,
      diasFaltasAnio:      v.diasFaltasAnio ?? 0,
    }).subscribe({
      next: (res) => {
        this.resultado.set(res);
        this.calculando.set(false);
        this.analytics.track({
          tipoEvento: 'completado', calculadoraSlug: 'vacaciones', modulo: 'laboral',
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
