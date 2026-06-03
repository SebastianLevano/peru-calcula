import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiClientService } from '../../../core/api-client.service';
import { SeoService } from '../../../core/seo.service';
import { AnalyticsService } from '../../../core/analytics.service';
import { UrlStateService } from '../../../core/url-state.service';
import { ResultCardComponent, ResultadoConfianza, DesgloseLine } from '../../../shared/components/result-card.component';
import { CalcInputComponent } from '../../../shared/ui/calc-input.component';

interface VacPeriodo {
  nombre: string;
  ultimoAniversario: string;
  aniosCompletados: number;
  mesesTruncos: number;
  diasAdicionales: number;
}

interface VacRespuesta {
  resultado: {
    total: number;
    vacacionesOrdinarias: number;
    vacacionesTruncas: number;
    vacacionesPendientes: number;
    moneda: string;
  };
  periodo: VacPeriodo | null;
  desglose: { concepto: string; valor: number }[];
  formula: string;
  confianza: ResultadoConfianza;
}

@Component({
  selector: 'app-vacaciones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ResultCardComponent, CalcInputComponent],
  template: `
    <main class="max-w-2xl mx-auto py-10 px-4 space-y-8">
      <header>
        <h1 class="text-3xl font-bold text-gray-900">Calculadora de Vacaciones</h1>
        <p class="mt-2 text-gray-600 text-sm">
          Vacaciones ordinarias (30 días = RC mensual), truncas y pendientes según el D.Leg. 713.
          La RC incluye básico, asignación familiar y promedios de remuneraciones variables.
        </p>
      </header>

      <form [formGroup]="form" (ngSubmit)="calcular()" class="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">

        <!-- Remuneración básica -->
        <app-calc-input label="Remuneración básica mensual" inputId="basico" prefix="S/"
          placeholder="2500" [required]="true" formControlName="remuneracionBasica" />

        <!-- Tiene hijos -->
        <label class="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" formControlName="tieneHijos"
                 class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <span class="text-sm font-medium text-gray-700">
            Tengo hijos a cargo <span class="text-gray-500">(asignación familiar 10% de la RMV)</span>
          </span>
        </label>

        <!-- Fecha de ingreso -->
        <div>
          <label for="fechaIngreso" class="block text-sm font-medium text-gray-700 mb-1">
            Fecha de inicio en la empresa
          </label>
          <input type="date" id="fechaIngreso" formControlName="fechaIngreso"
                 class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <p class="mt-1 text-xs text-gray-500">
            Años completos y meses truncos se calculan automáticamente desde esta fecha.
          </p>
        </div>

        <!-- Días pendientes (manual siempre) -->
        <app-calc-input label="Días de vacaciones no gozados" inputId="diasPend"
          placeholder="0" [min]="0"
          hint="Días de períodos anteriores que aún no tomaste"
          formControlName="diasPendientes" />

        <!-- Remuneraciones variables -->
        <div class="rounded-lg bg-gray-50 border border-gray-200 p-4 space-y-4">
          <p class="text-sm font-medium text-gray-700">
            Remuneraciones variables <span class="font-normal text-gray-500">(promedio mensual últimos 12 meses — D.S. 012-92-TR Art. 12)</span>
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <app-calc-input label="Horas extras" inputId="horas" prefix="S/"
              placeholder="0" [min]="0" [step]="0.01"
              hint="Prom. mens. últimos 12 meses"
              formControlName="promedioHorasExtras" />
            <app-calc-input label="Comisiones" inputId="comisiones" prefix="S/"
              placeholder="0" [min]="0" [step]="0.01"
              hint="Prom. mens. del año"
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
          {{ calculando() ? 'Calculando…' : 'Calcular Vacaciones' }}
        </button>
      </form>

      @if (error()) {
        <div class="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700" role="alert">{{ error() }}</div>
      }

      @if (resultado()) {
        <!-- Período detectado -->
        @if (resultado()!.periodo) {
          <div class="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm">
            <p class="font-medium text-blue-800">Antigüedad laboral: {{ resultado()!.periodo!.nombre }}</p>
            <p class="text-blue-700 mt-0.5">
              Último aniversario: {{ resultado()!.periodo!.ultimoAniversario | date:'dd MMM yyyy':'':'es' }}
              · {{ resultado()!.periodo!.aniosCompletados }} año{{ resultado()!.periodo!.aniosCompletados !== 1 ? 's' : '' }} completo{{ resultado()!.periodo!.aniosCompletados !== 1 ? 's' : '' }}
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
export class VacacionesComponent implements OnInit {
  private readonly api       = inject(ApiClientService);
  private readonly seo       = inject(SeoService);
  private readonly analytics = inject(AnalyticsService);
  private readonly fb        = inject(FormBuilder);

  readonly calculando = signal(false);
  readonly resultado  = signal<VacRespuesta | null>(null);
  readonly error      = signal<string | null>(null);

  readonly form = this.fb.group({
    remuneracionBasica:  [null as number | null, [Validators.required, Validators.min(1)]],
    tieneHijos:          [false],
    fechaIngreso:        [null as string | null, Validators.required],
    diasPendientes:      [0, [Validators.min(0)]],
    promedioHorasExtras: [0, [Validators.min(0)]],
    promedioComisiones:  [0, [Validators.min(0)]],
    otrosBonos:          [0, [Validators.min(0)]],
  });

  ngOnInit() {
    this.seo.set({
      title: 'Calculadora de Vacaciones — Perú Calcula',
      description: 'Calcula tus vacaciones ordinarias, truncas y pendientes con horas extras y comisiones. Normativa D.Leg. 713. Gratuito.',
    });
    this.analytics.track({ tipoEvento: 'inicio', calculadoraSlug: 'vacaciones', modulo: 'laboral' });
  }

  calcular() {
    if (this.form.invalid) return;
    this.calculando.set(true);
    this.error.set(null);

    const v = this.form.value;

    this.api.post<VacRespuesta>('/laboral/vacaciones', {
      remuneracionBasica:  v.remuneracionBasica,
      tieneHijos:          v.tieneHijos,
      fechaIngreso:        v.fechaIngreso,
      diasPendientes:      v.diasPendientes  ?? 0,
      promedioHorasExtras: v.promedioHorasExtras ?? 0,
      promedioComisiones:  v.promedioComisiones  ?? 0,
      otrosBonos:          v.otrosBonos          ?? 0,
    }).subscribe({
      next: (res) => {
        this.resultado.set(res);
        this.calculando.set(false);
        this.analytics.track({
          tipoEvento: 'completado',
          calculadoraSlug: 'vacaciones',
          modulo: 'laboral',
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
