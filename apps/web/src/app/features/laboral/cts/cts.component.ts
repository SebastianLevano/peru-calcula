import { Component, inject, signal, computed, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiClientService } from '../../../core/api-client.service';
import { SeoService } from '../../../core/seo.service';
import { AnalyticsService } from '../../../core/analytics.service';
import { ResultCardComponent, ResultadoConfianza, DesgloseLine } from '../../../shared/components/result-card.component';
import { CalcInputComponent } from '../../../shared/ui/calc-input.component';
import { InputMesesComponent } from '../../../shared/ui/input-meses.component';
import { AlertComponent } from '../../../shared/components/alert.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state.component';
import { AdsSlotComponent } from '../../../shared/components/ads-slot.component';
import { CalcPageHeaderComponent } from '../../../shared/ui/calc-page-header.component';

interface PeriodoInfo { nombre: string; inicioEfectivo: string; finEfectivo: string; mesesCompletados: number; diasAdicionales: number; }
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
  imports: [ReactiveFormsModule, DatePipe, RouterModule, ResultCardComponent, CalcInputComponent, InputMesesComponent, AlertComponent, EmptyStateComponent, AdsSlotComponent, CalcPageHeaderComponent],
  template: `
    <app-calc-page-header
      titulo="Calculadora de CTS"
      descripcion="Compensación por Tiempo de Servicios semestral según el D. Leg. 650. La remuneración computable incluye básico, asignación familiar, 1/6 de gratificación y promedios de variables."
      modulo="laboral" />

    <main class="mx-auto max-w-2xl px-4 py-8 space-y-8">

      <!-- Selector de período -->
      <div class="rounded-card border border-line bg-surface p-4">
        <p class="mb-3 text-sm font-medium text-ink-700">¿Para qué depósito calculás?</p>
        <div class="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Período de depósito">
          @for (op of opcionesPeriodo; track op.valor) {
            <button type="button"
              (click)="periodoDeposito.set(op.valor)"
              class="rounded-card border-2 px-4 py-3 text-sm font-medium transition-colors text-left"
              [class]="periodoDeposito() === op.valor
                ? 'border-primary-600 bg-primary-50 text-primary-700'
                : 'border-line text-ink-600 hover:border-ink-500'"
              [attr.aria-pressed]="periodoDeposito() === op.valor">
              {{ op.label }}
              <span class="block text-xs font-normal opacity-70">{{ op.sub }}</span>
            </button>
          }
        </div>
      </div>

      <form [formGroup]="form" (ngSubmit)="calcular()" class="rounded-card border border-line bg-surface p-6 shadow-card space-y-5">
        <app-calc-input label="Remuneración básica mensual" inputId="basico" prefix="S/"
          placeholder="2000" [required]="true" formControlName="remuneracionBasica" />

        <label class="flex cursor-pointer items-center gap-3">
          <input type="checkbox" formControlName="tieneHijos"
                 class="h-4 w-4 rounded border-line text-primary-600 focus:ring-primary-600" />
          <span class="text-sm font-medium text-ink-700">
            Tengo hijos a cargo <span class="font-normal text-ink-500">(asignación familiar 10% de la RMV)</span>
          </span>
        </label>

        <div class="space-y-1">
          <label for="fechaIngreso" class="block text-sm font-medium text-ink-700">Fecha de inicio en la empresa <span class="text-error-600" aria-hidden="true">*</span></label>
          <input type="date" id="fechaIngreso" formControlName="fechaIngreso"
                 class="w-full rounded-input border border-line bg-surface px-3.5 py-2.5 text-sm text-ink-900
                        hover:border-ink-500 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
          <p class="text-xs text-ink-500">El período CTS se calcula automáticamente según el depósito elegido.</p>
        </div>

        <app-calc-input label="Última gratificación recibida (opcional)" inputId="ultimaGrati" prefix="S/"
          placeholder="0" [min]="0" [step]="0.01"
          hint="Si la dejás en 0, se usa básico ÷ 6 como aproximación"
          formControlName="ultimaGratificacion" />

        <div class="rounded-card bg-paper border border-line p-4 space-y-5">
          <p class="text-sm font-medium text-ink-700">
            Remuneraciones variables
            <span class="font-normal text-ink-500"> — ingresá cada mes y el promedio se calcula solo (Art. 9 D. Leg. 650)</span>
          </p>
          <app-input-meses #horasRef label="Horas extras (S/)" [mesesLabels]="mesesActuales()" />
          <app-input-meses #comisionesRef label="Comisiones (S/)" [mesesLabels]="mesesActuales()" />
          <app-input-meses #bonosRef label="Otros bonos regulares (S/)" [mesesLabels]="mesesActuales()" />
        </div>

        <app-calc-input label="Días de inasistencia injustificada" inputId="faltas"
          placeholder="0" [min]="0"
          hint="Se descuentan del período computable (Art. 18 D. Leg. 650)"
          formControlName="diasFaltas" />

        <div class="flex gap-3">
          <button type="submit" [disabled]="form.invalid || calculando()"
            class="flex-1 rounded-input bg-primary-700 py-3 text-sm font-semibold text-white
                   hover:bg-primary-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2
                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            @if (calculando()) {
              <span class="inline-flex items-center justify-center gap-2">
                <svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4z"/></svg>
                Calculando…
              </span>
            } @else { Calcular CTS }
          </button>
          <button type="button" (click)="limpiar()"
            class="rounded-input border border-line bg-surface px-5 text-sm font-medium text-ink-600
                   hover:bg-paper hover:text-ink-900 transition-colors
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600">
            Limpiar
          </button>
        </div>
      </form>

      @if (error()) {
        <app-alert tone="error">{{ error() }}</app-alert>
      }

      @if (!resultado() && !calculando() && !error()) {
        <app-empty-state titulo="Completa el formulario para ver tu CTS"
          mensaje="Ingresa tu remuneración básica, la fecha de inicio y el depósito para obtener el resultado con desglose normativo." />
      }

      @if (resultado()) {
        @if (resultado()!.periodo) {
          <div class="rounded-card border border-primary-100 bg-primary-50 p-4 text-sm text-primary-800">
            <p class="font-semibold">Período: {{ resultado()!.periodo!.nombre }}</p>
            <p class="mt-0.5 text-primary-700">
              {{ resultado()!.periodo!.inicioEfectivo | date:'d MMM y':'':'es' }}
              → {{ resultado()!.periodo!.finEfectivo | date:'d MMM y':'':'es' }}
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
          [confianza]="resultado()!.confianza"
          calculadoraSlug="cts"
          modulo="laboral" />

        <!-- AdsSlot SOLO después del resultado (Ajuste #2 y #14) -->
        <app-ads-slot size="banner" />
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
      title: 'Calculadora de CTS — D. Leg. 650',
      description: 'Calcula tu CTS semestral con horas extras, comisiones, última gratificación y días de falta. Según el D. Leg. 650.',
      canonical: '/calculadora-cts',
    });
    this.analytics.track({ tipoEvento: 'inicio', calculadoraSlug: 'cts', modulo: 'laboral' });
  }

  ngAfterViewInit() {}

  limpiar() {
    this.form.reset({ remuneracionBasica: null, tieneHijos: false, fechaIngreso: null, ultimaGratificacion: 0, diasFaltas: 0 });
    this.horasRef?.reset();
    this.comisionesRef?.reset();
    this.bonosRef?.reset();
    this.resultado.set(null);
    this.error.set(null);
  }

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
        this.analytics.track({ tipoEvento: 'completado', calculadoraSlug: 'cts', modulo: 'laboral', parametrosVersion: res.confianza.parametrosVersion });
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
