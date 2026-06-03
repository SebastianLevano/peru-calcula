import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiClientService } from '../../../core/api-client.service';
import { SeoService } from '../../../core/seo.service';
import { AnalyticsService } from '../../../core/analytics.service';
import { ResultCardComponent, DesgloseLine } from '../../../shared/components/result-card.component';
import { CalcInputComponent } from '../../../shared/ui/calc-input.component';

@Component({
  selector: 'app-nrus',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ResultCardComponent, CalcInputComponent],
  template: `
    <main class="max-w-2xl mx-auto py-10 px-4 space-y-8">
      <header>
        <h1 class="text-3xl font-bold text-gray-900">Calculadora NRUS</h1>
        <p class="mt-2 text-gray-600 text-sm">Determina tu categoría y cuota mensual en el Nuevo Régimen Único Simplificado (D.Leg. 937).</p>
      </header>
      <form [formGroup]="form" (ngSubmit)="calcular()" class="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
        <app-calc-input label="Ingresos mensuales" inputId="ingresos" prefix="S/" placeholder="3000" [required]="true" formControlName="ingresosMensuales" />
        <app-calc-input label="Compras mensuales" inputId="compras" prefix="S/" placeholder="2000" hint="Para determinar la categoría se usa el mayor valor" formControlName="comprasMensuales" />
        <button type="submit" [disabled]="form.invalid || calculando()"
          class="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors">
          {{ calculando() ? 'Calculando…' : 'Calcular cuota NRUS' }}
        </button>
      </form>
      @if (error()) { <div class="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700" role="alert">{{ error() }}</div> }
      @if (resultado()) {
        @if (resultado()!.resultado.categoria > 0) {
          <app-result-card [titulo]="'Categoría ' + resultado()!.resultado.categoria + ' — Cuota mensual'" [montoFinal]="resultado()!.resultado.cuota" [desglose]="toDesglose(resultado()!.desglose)" [confianza]="resultado()!.confianza" />
        } @else {
          <div class="rounded-xl bg-amber-50 border border-amber-200 p-5">
            <p class="font-semibold text-amber-800">No aplica NRUS</p>
            <p class="text-sm text-amber-700 mt-1">{{ resultado()!.resultado.alerta }}</p>
          </div>
        }
      }
    </main>`,
})
export class NrusComponent implements OnInit {
  private readonly api = inject(ApiClientService); private readonly seo = inject(SeoService);
  private readonly analytics = inject(AnalyticsService); private readonly fb = inject(FormBuilder);
  readonly calculando = signal(false); readonly resultado = signal<any>(null); readonly error = signal<string | null>(null);
  readonly form = this.fb.group({
    ingresosMensuales: [null as number | null, [Validators.required, Validators.min(0)]],
    comprasMensuales:  [0, [Validators.min(0)]],
  });
  ngOnInit() {
    this.seo.set({ title: 'Calculadora NRUS', description: 'Determina tu categoría y cuota mensual en el Nuevo RUS. Régimen simplificado para pequeños negocios.' });
    this.analytics.track({ tipoEvento: 'inicio', calculadoraSlug: 'nrus', modulo: 'tributario' });
  }
  calcular() {
    if (this.form.invalid) return;
    this.calculando.set(true); this.error.set(null);
    this.api.post<any>('/tributario/nrus', this.form.value).subscribe({
      next: (res) => { this.resultado.set(res); this.calculando.set(false); this.analytics.track({ tipoEvento: 'completado', calculadoraSlug: 'nrus', modulo: 'tributario' }); },
      error: () => { this.error.set('Error al calcular. Intenta nuevamente.'); this.calculando.set(false); },
    });
  }
  toDesglose(raw: any[]): DesgloseLine[] { return raw.map(r => ({ concepto: r.concepto, valor: r.valor })); }
}
