import { Component, inject, signal, computed, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
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
import { CalcRelatedComponent } from '../../../shared/ui/calc-related.component';

interface PeriodoInfo { nombre: string; inicioEfectivo: string; finEfectivo: string; mesesCompletados: number; diasAdicionales: number; }
interface GratificacionRespuesta {
  resultado: { gratificacion: number; bonificacionExtraordinaria: number; totalDeposito: number; moneda: string };
  periodo: PeriodoInfo | null;
  desglose: { concepto: string; valor: number }[];
  formula: string;
  confianza: ResultadoConfianza;
}

const MESES_GRATI: Record<'julio' | 'diciembre', string[]> = {
  julio:     ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
  diciembre: ['Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
};
function defaultPeriodoGrati(): 'julio' | 'diciembre' {
  return new Date().getMonth() + 1 <= 6 ? 'julio' : 'diciembre';
}

@Component({
  selector: 'app-gratificacion',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe, RouterModule, ResultCardComponent, CalcInputComponent, InputMesesComponent, AlertComponent, EmptyStateComponent, AdsSlotComponent, CalcPageHeaderComponent, CalcRelatedComponent],
  template: `
    <app-calc-page-header
      titulo="Calculadora de Gratificación"
      descripcion="Gratificación ordinaria de julio y diciembre más bonificación extraordinaria (Ley 27735 / Ley 29351)."
      modulo="laboral" />

    <main class="mx-auto max-w-2xl px-4 py-8 space-y-8">

      <div class="rounded-card border border-line bg-surface p-4">
        <p class="mb-3 text-sm font-medium text-ink-700">¿Qué gratificación calculás?</p>
        <div class="grid grid-cols-2 gap-3" role="radiogroup">
          @for (op of opcionesPeriodo; track op.valor) {
            <button type="button" (click)="periodoDeposito.set(op.valor)"
              class="rounded-card border-2 px-4 py-3 text-sm font-medium transition-colors text-left"
              [class]="periodoDeposito() === op.valor ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-line text-ink-600 hover:border-ink-500'"
              [attr.aria-pressed]="periodoDeposito() === op.valor">
              {{ op.label }}<span class="block text-xs font-normal opacity-70">{{ op.sub }}</span>
            </button>
          }
        </div>
      </div>

      <form [formGroup]="form" (ngSubmit)="calcular()" class="rounded-card border border-line bg-surface p-6 shadow-card space-y-5">
        <app-calc-input label="Remuneración básica mensual" inputId="basico" prefix="S/" placeholder="3000" [required]="true" formControlName="remuneracionBasica" />
        <label class="flex cursor-pointer items-center gap-3">
          <input type="checkbox" formControlName="tieneHijos" class="h-4 w-4 rounded border-line text-primary-600 focus:ring-primary-600" />
          <span class="text-sm font-medium text-ink-700">Tengo hijos a cargo <span class="font-normal text-ink-500">(asignación familiar 10% RMV)</span></span>
        </label>
        <div class="space-y-1">
          <label for="fechaIngreso" class="block text-sm font-medium text-ink-700">Fecha de inicio en la empresa <span class="text-error-600" aria-hidden="true">*</span></label>
          <input type="date" id="fechaIngreso" formControlName="fechaIngreso"
                 class="w-full rounded-input border border-line bg-surface px-3.5 py-2.5 text-sm text-ink-900 hover:border-ink-500 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
          <p class="text-xs text-ink-500">Período {{ periodoDeposito() === 'julio' ? 'Ene–Jun' : 'Jul–Dic' }} calculado automáticamente.</p>
        </div>
        <div class="rounded-card bg-paper border border-line p-4 space-y-5">
          <p class="text-sm font-medium text-ink-700">Remuneraciones variables <span class="font-normal text-ink-500">— ingresá cada mes (Ley 27735 Art. 3)</span></p>
          <app-input-meses #horasRef label="Horas extras (S/)" [mesesLabels]="mesesActuales()" />
          <app-input-meses #comisionesRef label="Comisiones (S/)" [mesesLabels]="mesesActuales()" />
          <app-input-meses #bonosRef label="Otros bonos regulares (S/)" [mesesLabels]="mesesActuales()" />
          <p class="rounded-input border border-warn-600/25 bg-warn-50 px-3 py-2 text-xs text-warn-600">
            Las horas extras integran la RC solo si fueron percibidas en al menos 3 de los 6 meses del semestre.
          </p>
        </div>
        <label class="flex cursor-pointer items-center gap-3">
          <input type="checkbox" formControlName="aportaAEps" class="h-4 w-4 rounded border-line text-primary-600 focus:ring-primary-600" />
          <span class="text-sm font-medium text-ink-700">Aporto a EPS (6.75%) en lugar de EsSalud (9%)</span>
        </label>
        <app-calc-input label="Días de inasistencia injustificada" inputId="faltas" placeholder="0" [min]="0" hint="Reducen el período computable del semestre" formControlName="diasFaltas" />
        <div class="flex gap-3">
          <button type="submit" [disabled]="form.invalid || calculando()"
            class="flex-1 rounded-input bg-primary-700 py-3 text-sm font-semibold text-white hover:bg-primary-800
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2
                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            @if (calculando()) {
              <span class="inline-flex items-center justify-center gap-2"><svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4z"/></svg>Calculando…</span>
            } @else { Calcular Gratificación }
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
        <app-empty-state titulo="Completa el formulario para ver tu gratificación" mensaje="Ingresa tu remuneración básica y la fecha de inicio para obtener el resultado desglosado." />
      }

      @if (resultado()) {
        @if (resultado()!.periodo) {
          <div class="rounded-card border border-primary-100 bg-primary-50 p-4 text-sm text-primary-800">
            <p class="font-semibold">Período: {{ resultado()!.periodo!.nombre }}</p>
            <p class="mt-0.5 text-primary-700">
              {{ resultado()!.periodo!.inicioEfectivo | date:'d MMM y':'':'es' }} → {{ resultado()!.periodo!.finEfectivo | date:'d MMM y':'':'es' }}
              · {{ resultado()!.periodo!.mesesCompletados }} mes{{ resultado()!.periodo!.mesesCompletados !== 1 ? 'es' : '' }}
            </p>
          </div>
        }
        <app-result-card titulo="Total a depositar" [montoFinal]="resultado()!.resultado.totalDeposito" [desglose]="toDesglose(resultado()!.desglose)" [confianza]="resultado()!.confianza" calculadoraSlug="gratificacion" modulo="laboral" />
        <div class="grid grid-cols-2 gap-4">
          <div class="rounded-card border border-line bg-surface p-4 text-center shadow-card">
            <p class="text-xs text-ink-500">Gratificación</p>
            <p class="monto mt-1 font-display text-lg font-semibold text-ink-900">{{ resultado()!.resultado.gratificacion | currency:'PEN':'symbol':'1.2-2':'es-PE' }}</p>
          </div>
          <div class="rounded-card border border-line bg-surface p-4 text-center shadow-card">
            <p class="text-xs text-ink-500">Bonificación extraordinaria</p>
            <p class="monto mt-1 font-display text-lg font-semibold text-ok-600">{{ resultado()!.resultado.bonificacionExtraordinaria | currency:'PEN':'symbol':'1.2-2':'es-PE' }}</p>
          </div>
        </div>
        <app-ads-slot size="banner" />
      }
    </main>

    <app-calc-related slug="/calculadora-gratificacion" />
  `,
})
export class GratificacionComponent implements OnInit, AfterViewInit {
  private readonly api = inject(ApiClientService); private readonly seo = inject(SeoService);
  private readonly analytics = inject(AnalyticsService); private readonly fb = inject(FormBuilder);
  @ViewChild('horasRef') horasRef!: InputMesesComponent;
  @ViewChild('comisionesRef') comisionesRef!: InputMesesComponent;
  @ViewChild('bonosRef') bonosRef!: InputMesesComponent;
  readonly calculando = signal(false); readonly resultado = signal<GratificacionRespuesta | null>(null); readonly error = signal<string | null>(null);
  readonly periodoDeposito = signal<'julio' | 'diciembre'>(defaultPeriodoGrati());
  readonly mesesActuales = computed(() => MESES_GRATI[this.periodoDeposito()]);
  readonly opcionesPeriodo = [
    { valor: 'julio' as const, label: 'Gratificación Julio', sub: 'Período Ene – Jun' },
    { valor: 'diciembre' as const, label: 'Gratificación Diciembre', sub: 'Período Jul – Dic' },
  ];
  readonly form = this.fb.group({
    remuneracionBasica: [null as number | null, [Validators.required, Validators.min(1)]],
    tieneHijos: [false], fechaIngreso: [null as string | null, Validators.required],
    aportaAEps: [false], diasFaltas: [0, [Validators.min(0)]],
  });
  ngOnInit() {
    this.seo.set({ title: 'Calculadora Gratificación 2026', description: 'Calcula tu gratificación de julio o diciembre con bonificación extraordinaria incluida. Normativa actualizada. Gratis.', canonical: '/calculadora-gratificacion' });
    this.analytics.track({ tipoEvento: 'inicio', calculadoraSlug: 'gratificacion', modulo: 'laboral' });
  }
  ngAfterViewInit() {}

  limpiar() {
    this.form.reset({ remuneracionBasica: null, tieneHijos: false, fechaIngreso: null, aportaAEps: false, diasFaltas: 0 });
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
    this.api.post<GratificacionRespuesta>('/laboral/gratificacion', {
      remuneracionBasica: v.remuneracionBasica, tieneHijos: v.tieneHijos, fechaIngreso: v.fechaIngreso,
      periodoDeposito: this.periodoDeposito(), aportaAEps: v.aportaAEps,
      promedioHorasExtras: this.horasRef?.promedio() ?? 0, promedioComisiones: this.comisionesRef?.promedio() ?? 0,
      otrosBonos: this.bonosRef?.promedio() ?? 0, diasFaltas: v.diasFaltas ?? 0,
    }).subscribe({
      next: (res) => { this.resultado.set(res); this.calculando.set(false); this.analytics.track({ tipoEvento: 'completado', calculadoraSlug: 'gratificacion', modulo: 'laboral' }); },
      error: () => { this.error.set('Error al calcular. Intenta nuevamente.'); this.calculando.set(false); },
    });
  }
  toDesglose(raw: { concepto: string; valor: number }[]): DesgloseLine[] { return raw.map(r => ({ concepto: r.concepto, valor: r.valor })); }
}
