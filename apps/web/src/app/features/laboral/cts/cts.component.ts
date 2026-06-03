import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiClientService } from '../../../core/api-client.service';
import { SeoService } from '../../../core/seo.service';
import { AnalyticsService } from '../../../core/analytics.service';
import { ResultCardComponent, ResultadoConfianza, DesgloseLine } from '../../../shared/components/result-card.component';
import { CalcInputComponent } from '../../../shared/ui/calc-input.component';

interface CtsRespuesta {
  resultado: { montoFinal: number; moneda: string };
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
        </p>
      </header>

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

        <div class="grid grid-cols-2 gap-4">
          <app-calc-input label="Meses completos" inputId="meses" placeholder="4"
            [min]="0" [max]="6" hint="Del semestre (máx. 6)" formControlName="mesesCompletados" />
          <app-calc-input label="Días adicionales" inputId="dias" placeholder="0"
            [min]="0" [max]="29" hint="Días restantes (máx. 29)" formControlName="diasAdicionales" />
        </div>

        <button type="submit" [disabled]="form.invalid || calculando()"
          class="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700
                 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {{ calculando() ? 'Calculando…' : 'Calcular CTS' }}
        </button>
      </form>

      @if (error()) {
        <div class="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700" role="alert">
          {{ error() }}
        </div>
      }

      @if (resultado()) {
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
    remuneracionBasica: [null as number | null, [Validators.required, Validators.min(1)]],
    tieneHijos:         [false],
    mesesCompletados:   [4, [Validators.required, Validators.min(0), Validators.max(6)]],
    diasAdicionales:    [0, [Validators.required, Validators.min(0), Validators.max(29)]],
  });

  ngOnInit() {
    this.seo.set({
      title: 'Calculadora de CTS',
      description: 'Calcula tu CTS semestral según la normativa peruana. Gratuito y sin registro.',
    });
    this.analytics.track({ tipoEvento: 'inicio', calculadoraSlug: 'cts', modulo: 'laboral' });
  }

  calcular() {
    if (this.form.invalid) return;
    this.calculando.set(true);
    this.error.set(null);
    this.api.post<CtsRespuesta>('/laboral/cts', this.form.value).subscribe({
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
