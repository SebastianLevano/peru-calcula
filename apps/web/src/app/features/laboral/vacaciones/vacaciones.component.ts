import { Component, inject, signal, ViewChild, OnInit, AfterViewInit } from '@angular/core';
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

interface VacPeriodo { nombre: string; ultimoAniversario: string; fechaCese: string | null; aniosCompletados: number; mesesTruncos: number; diasAdicionales: number; }
interface VacRespuesta {
  resultado: { total: number; vacacionesOrdinarias: number; vacacionesTruncas: number; vacacionesPendientes: number; moneda: string };
  periodo: VacPeriodo | null; advertencia: string | null;
  desglose: { concepto: string; valor: number }[]; formula: string; confianza: ResultadoConfianza;
}

function ultimos12Meses(): string[] {
  const n = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const hoy = new Date();
  return Array.from({ length: 12 }, (_, i) => { const d = new Date(hoy.getFullYear(), hoy.getMonth() - (11 - i), 1); return `${n[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`; });
}

@Component({
  selector: 'app-vacaciones',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, RouterModule, ResultCardComponent, CalcInputComponent, InputMesesComponent, AlertComponent, EmptyStateComponent, AdsSlotComponent, CalcPageHeaderComponent],
  template: `
    <app-calc-page-header
      titulo="Calculadora de Vacaciones"
      descripcion="Vacaciones ordinarias, truncas y pendientes según el D. Leg. 713. Incluye horas extras, comisiones y días de inasistencia."
      modulo="laboral" />

    <main class="mx-auto max-w-2xl px-4 py-8 space-y-8">

      <div class="rounded-card border border-line bg-surface p-4">
        <p class="mb-3 text-sm font-medium text-ink-700">¿Qué querés calcular?</p>
        <div class="grid grid-cols-2 gap-3" role="radiogroup">
          @for (op of opcionesTipo; track op.valor) {
            <button type="button" (click)="tipoVacaciones.set(op.valor)"
              class="rounded-card border-2 px-4 py-3 text-sm font-medium transition-colors text-left"
              [class]="tipoVacaciones() === op.valor ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-line text-ink-600 hover:border-ink-500'"
              [attr.aria-pressed]="tipoVacaciones() === op.valor">
              {{ op.label }}<span class="block text-xs font-normal opacity-70">{{ op.sub }}</span>
            </button>
          }
        </div>
      </div>

      <form [formGroup]="form" (ngSubmit)="calcular()" class="rounded-card border border-line bg-surface p-6 shadow-card space-y-5">
        <app-calc-input label="Remuneración básica mensual" inputId="basico" prefix="S/" placeholder="2500" [required]="true" formControlName="remuneracionBasica" />
        <label class="flex cursor-pointer items-center gap-3">
          <input type="checkbox" formControlName="tieneHijos" class="h-4 w-4 rounded border-line text-primary-600 focus:ring-primary-600" />
          <span class="text-sm font-medium text-ink-700">Tengo hijos a cargo <span class="font-normal text-ink-500">(asignación familiar 10% de la RMV)</span></span>
        </label>
        <div class="space-y-1">
          <label for="fechaIngreso" class="block text-sm font-medium text-ink-700">Fecha de inicio en la empresa <span class="text-error-600" aria-hidden="true">*</span></label>
          <input type="date" id="fechaIngreso" formControlName="fechaIngreso"
                 class="w-full rounded-input border border-line bg-surface px-3.5 py-2.5 text-sm text-ink-900 hover:border-ink-500 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
        </div>
        @if (tipoVacaciones() === 'truncas') {
          <div class="space-y-1">
            <label for="fechaCese" class="block text-sm font-medium text-ink-700">Fecha de cese <span class="font-normal text-ink-500">(opcional)</span></label>
            <input type="date" id="fechaCese" formControlName="fechaCese"
                   class="w-full rounded-input border border-line bg-surface px-3.5 py-2.5 text-sm text-ink-900 hover:border-ink-500 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
            <p class="text-xs text-ink-500">Déjala vacía para calcular al día de hoy.</p>
          </div>
        }
        @if (tipoVacaciones() === 'ordinarias') {
          <app-calc-input label="Días de vacaciones no gozados (de años anteriores)" inputId="diasPend" placeholder="0" [min]="0" hint="Días de períodos anteriores que aún no tomaste" formControlName="diasPendientes" />
        }
        <div class="rounded-card bg-paper border border-line p-4 space-y-5">
          <p class="text-sm font-medium text-ink-700">Remuneraciones variables <span class="font-normal text-ink-500">— últimos 12 meses (D.S. 012-92-TR Art. 12)</span></p>
          <app-input-meses #horasRef label="Horas extras (S/)" [mesesLabels]="meses12()" />
          <app-input-meses #comisionesRef label="Comisiones (S/)" [mesesLabels]="meses12()" />
          <app-input-meses #bonosRef label="Otros bonos regulares (S/)" [mesesLabels]="meses12()" />
        </div>
        <app-calc-input
          [label]="tipoVacaciones() === 'ordinarias' ? 'Días de inasistencia injustificada (en el año)' : 'Días de inasistencia injustificada (en el período)'"
          inputId="faltas" placeholder="0" [min]="0"
          [hint]="tipoVacaciones() === 'ordinarias' ? '≥ 30 días: pierde el derecho vacacional del período (D. Leg. 713 Art. 11)' : 'Se descuentan del período trunco computable'"
          formControlName="diasFaltasAnio" />
        <div class="flex gap-3">
          <button type="submit" [disabled]="form.invalid || calculando()"
            class="flex-1 rounded-input bg-primary-700 py-3 text-sm font-semibold text-white hover:bg-primary-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            @if (calculando()) {
              <span class="inline-flex items-center justify-center gap-2"><svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4z"/></svg>Calculando…</span>
            } @else { Calcular Vacaciones }
          </button>
          <button type="button" (click)="limpiar()"
            class="rounded-input border border-line bg-surface px-5 text-sm font-medium text-ink-600
                   hover:bg-paper hover:text-ink-900 transition-colors
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600">
            Limpiar
          </button>
        </div>
      </form>

      @if (error()) { <app-alert tone="error">{{ error() }}</app-alert> }
      @if (!resultado() && !calculando() && !error()) {
        <app-empty-state titulo="Completa el formulario para ver tus vacaciones" mensaje="Ingresa tu remuneración básica y la fecha de inicio para obtener el resultado." />
      }
      @if (resultado()) {
        @if (resultado()!.advertencia) { <app-alert tone="warn">{{ resultado()!.advertencia }}</app-alert> }
        @if (resultado()!.periodo) {
          <div class="rounded-card border border-primary-100 bg-primary-50 p-4 text-sm text-primary-800">
            <p class="font-semibold">{{ resultado()!.periodo!.nombre }}</p>
            <p class="mt-0.5 text-primary-700">
              Último aniversario: {{ resultado()!.periodo!.ultimoAniversario | date:'d MMM y':'':'es' }}
              · {{ resultado()!.periodo!.aniosCompletados }} año{{ resultado()!.periodo!.aniosCompletados !== 1 ? 's' : '' }}
              @if (resultado()!.periodo!.mesesTruncos > 0) { · {{ resultado()!.periodo!.mesesTruncos }} mes{{ resultado()!.periodo!.mesesTruncos !== 1 ? 'es' : '' }} trunco{{ resultado()!.periodo!.mesesTruncos !== 1 ? 's' : '' }} }
            </p>
          </div>
        }
        <app-result-card titulo="Total vacaciones" [montoFinal]="resultado()!.resultado.total" [desglose]="toDesglose(resultado()!.desglose)" [confianza]="resultado()!.confianza" calculadoraSlug="vacaciones" modulo="laboral" />
        <app-ads-slot size="banner" />
      }
    </main>
  `,
})
export class VacacionesComponent implements OnInit, AfterViewInit {
  private readonly api = inject(ApiClientService); private readonly seo = inject(SeoService);
  private readonly analytics = inject(AnalyticsService); private readonly fb = inject(FormBuilder);
  @ViewChild('horasRef') horasRef!: InputMesesComponent;
  @ViewChild('comisionesRef') comisionesRef!: InputMesesComponent;
  @ViewChild('bonosRef') bonosRef!: InputMesesComponent;
  readonly calculando = signal(false); readonly resultado = signal<VacRespuesta | null>(null); readonly error = signal<string | null>(null);
  readonly tipoVacaciones = signal<'ordinarias' | 'truncas'>('ordinarias');
  readonly meses12 = signal<string[]>(ultimos12Meses());
  readonly opcionesTipo = [
    { valor: 'ordinarias' as const, label: 'Vacaciones ordinarias', sub: 'Empleado activo — 30 días por año' },
    { valor: 'truncas' as const, label: 'Al cese / Truncas', sub: 'Liquidación al terminar contrato' },
  ];
  readonly form = this.fb.group({
    remuneracionBasica: [null as number | null, [Validators.required, Validators.min(1)]],
    tieneHijos: [false], fechaIngreso: [null as string | null, Validators.required],
    fechaCese: [null as string | null], diasPendientes: [0, [Validators.min(0)]], diasFaltasAnio: [0, [Validators.min(0)]],
  });
  ngOnInit() {
    this.seo.set({ title: 'Calculadora de Vacaciones — D. Leg. 713', description: 'Calcula vacaciones ordinarias, truncas y pendientes. Según el D. Leg. 713.', canonical: '/calculadora-vacaciones' });
    this.analytics.track({ tipoEvento: 'inicio', calculadoraSlug: 'vacaciones', modulo: 'laboral' });
  }
  ngAfterViewInit() {}

  limpiar() {
    this.form.reset({ remuneracionBasica: null, tieneHijos: false, fechaIngreso: null, fechaCese: null, diasPendientes: 0, diasFaltasAnio: 0 });
    this.horasRef?.reset();
    this.comisionesRef?.reset();
    this.bonosRef?.reset();
    this.resultado.set(null);
    this.error.set(null);
  }

  calcular() {
    if (this.form.invalid) return;
    this.calculando.set(true); this.error.set(null);
    const v = this.form.value;
    const esTruncas = this.tipoVacaciones() === 'truncas';
    this.api.post<VacRespuesta>('/laboral/vacaciones', {
      remuneracionBasica: v.remuneracionBasica, tieneHijos: v.tieneHijos, fechaIngreso: v.fechaIngreso,
      fechaCese: esTruncas && v.fechaCese ? v.fechaCese : null, diasPendientes: esTruncas ? 0 : (v.diasPendientes ?? 0),
      promedioHorasExtras: this.horasRef?.promedio() ?? 0, promedioComisiones: this.comisionesRef?.promedio() ?? 0,
      otrosBonos: this.bonosRef?.promedio() ?? 0, diasFaltasAnio: v.diasFaltasAnio ?? 0,
    }).subscribe({
      next: (res) => { this.resultado.set(res); this.calculando.set(false); this.analytics.track({ tipoEvento: 'completado', calculadoraSlug: 'vacaciones', modulo: 'laboral', parametrosVersion: res.confianza.parametrosVersion }); },
      error: () => { this.error.set('Ocurrió un error al calcular. Intenta nuevamente.'); this.calculando.set(false); },
    });
  }
  toDesglose(raw: { concepto: string; valor: number }[]): DesgloseLine[] { return raw.map(r => ({ concepto: r.concepto, valor: r.valor })); }
}
