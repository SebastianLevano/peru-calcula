import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiClientService } from '../../../core/api-client.service';
import { SeoService } from '../../../core/seo.service';
import { AnalyticsService } from '../../../core/analytics.service';
import { ResultCardComponent, DesgloseLine } from '../../../shared/components/result-card.component';
import { CalcInputComponent } from '../../../shared/ui/calc-input.component';

@Component({
  selector: 'app-vacaciones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ResultCardComponent, CalcInputComponent],
  template: `
    <main class="max-w-2xl mx-auto py-10 px-4 space-y-8">
      <header>
        <h1 class="text-3xl font-bold text-gray-900">Calculadora de Vacaciones</h1>
        <p class="mt-2 text-gray-600 text-sm">Vacaciones ordinarias (30 días = RC mensual), truncas y pendientes (D.Leg. 713).</p>
      </header>
      <form [formGroup]="form" (ngSubmit)="calcular()" class="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
        <app-calc-input label="Remuneración mensual" inputId="rem" prefix="S/" placeholder="2500" [required]="true" formControlName="remuneracionMensual" />
        <label class="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" formControlName="tieneHijos" class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <span class="text-sm font-medium text-gray-700">Tengo hijos a cargo</span>
        </label>
        <div class="grid grid-cols-3 gap-4">
          <app-calc-input label="Años completos" inputId="anios" placeholder="1" [min]="0" formControlName="aniosCompletados" />
          <app-calc-input label="Meses truncos" inputId="mesesTruncos" placeholder="0" [min]="0" [max]="11" formControlName="mesesTruncos" />
          <app-calc-input label="Días pendientes" inputId="diasPend" placeholder="0" [min]="0" formControlName="diasPendientes" />
        </div>
        <button type="submit" [disabled]="form.invalid || calculando()"
          class="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors">
          {{ calculando() ? 'Calculando…' : 'Calcular Vacaciones' }}
        </button>
      </form>
      @if (error()) { <div class="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700" role="alert">{{ error() }}</div> }
      @if (resultado()) {
        <app-result-card titulo="Total vacaciones" [montoFinal]="resultado()!.resultado.total" [desglose]="toDesglose(resultado()!.desglose)" [confianza]="resultado()!.confianza" />
      }
    </main>`,
})
export class VacacionesComponent implements OnInit {
  private readonly api = inject(ApiClientService); private readonly seo = inject(SeoService);
  private readonly analytics = inject(AnalyticsService); private readonly fb = inject(FormBuilder);
  readonly calculando = signal(false); readonly resultado = signal<any>(null); readonly error = signal<string | null>(null);
  readonly form = this.fb.group({
    remuneracionMensual: [null as number | null, [Validators.required, Validators.min(1)]],
    tieneHijos: [false], aniosCompletados: [1, [Validators.required, Validators.min(0)]],
    mesesTruncos: [0, [Validators.min(0), Validators.max(11)]], diasPendientes: [0, [Validators.min(0)]],
  });
  ngOnInit() {
    this.seo.set({ title: 'Calculadora de Vacaciones', description: 'Calcula tus vacaciones ordinarias, truncas y pendientes según el D.Leg. 713. Normativa peruana.' });
    this.analytics.track({ tipoEvento: 'inicio', calculadoraSlug: 'vacaciones', modulo: 'laboral' });
  }
  calcular() {
    if (this.form.invalid) return;
    this.calculando.set(true); this.error.set(null);
    this.api.post<any>('/laboral/vacaciones', this.form.value).subscribe({
      next: (res) => { this.resultado.set(res); this.calculando.set(false); this.analytics.track({ tipoEvento: 'completado', calculadoraSlug: 'vacaciones', modulo: 'laboral' }); },
      error: () => { this.error.set('Error al calcular. Intenta nuevamente.'); this.calculando.set(false); },
    });
  }
  toDesglose(raw: any[]): DesgloseLine[] { return raw.map(r => ({ concepto: r.concepto, valor: r.valor })); }
}
