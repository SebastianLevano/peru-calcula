import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiClientService } from '../../../core/api-client.service';
import { SeoService } from '../../../core/seo.service';
import { AnalyticsService } from '../../../core/analytics.service';
import { ResultCardComponent, ResultadoConfianza, DesgloseLine } from '../../../shared/components/result-card.component';
import { CalcInputComponent } from '../../../shared/ui/calc-input.component';

interface RecibosRespuesta {
  resultado: { montoRecibo: number; aplicaRetencion: boolean; montoRetencion: number; montoNeto: number; moneda: string };
  desglose: { concepto: string; valor: number }[];
  suspension: { calificaSuspension: boolean; proyeccionAnual: number; limiteExencion: number; mensaje: string };
  confianza: ResultadoConfianza;
}

@Component({
  selector: 'app-recibos-honorarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ResultCardComponent, CalcInputComponent],
  template: `
    <main class="max-w-2xl mx-auto py-10 px-4 space-y-8">
      <header>
        <h1 class="text-3xl font-bold text-gray-900">Calculadora Recibos por Honorarios</h1>
        <p class="mt-2 text-gray-600 text-sm">
          Calcula la retención de 4ta categoría y verifica si calificas para suspensión (SUNAT).
        </p>
      </header>

      <form [formGroup]="form" (ngSubmit)="calcular()" class="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
        <app-calc-input label="Monto del recibo" inputId="monto" prefix="S/"
          placeholder="2000" [required]="true" [min]="1" formControlName="montoRecibo" />

        <button type="submit" [disabled]="form.invalid || calculando()"
          class="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700
                 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {{ calculando() ? 'Calculando…' : 'Calcular' }}
        </button>
      </form>

      @if (error()) {
        <div class="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700" role="alert">{{ error() }}</div>
      }

      @if (resultado()) {
        <app-result-card
          [titulo]="resultado()!.resultado.aplicaRetencion ? 'Con retención del 8%' : 'Sin retención'"
          [montoFinal]="resultado()!.resultado.montoNeto"
          [desglose]="toDesglose(resultado()!.desglose)"
          [confianza]="resultado()!.confianza" />

        <div class="rounded-xl border p-5 space-y-2"
             [class]="resultado()!.suspension.calificaSuspension ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'">
          <p class="text-sm font-semibold"
             [class]="resultado()!.suspension.calificaSuspension ? 'text-green-800' : 'text-yellow-800'">
            {{ resultado()!.suspension.calificaSuspension ? '✓ Puedes solicitar suspensión' : 'No calificas para suspensión' }}
          </p>
          <p class="text-sm text-gray-600">{{ resultado()!.suspension.mensaje }}</p>
          <p class="text-xs text-gray-500">
            Proyección anual: S/ {{ resultado()!.suspension.proyeccionAnual | number:'1.2-2' }} /
            Límite 7 UIT: S/ {{ resultado()!.suspension.limiteExencion | number:'1.2-2' }}
          </p>
        </div>
      }
    </main>
  `,
})
export class RecibosHonorariosComponent implements OnInit {
  private readonly api       = inject(ApiClientService);
  private readonly seo       = inject(SeoService);
  private readonly analytics = inject(AnalyticsService);
  private readonly fb        = inject(FormBuilder);

  readonly calculando = signal(false);
  readonly resultado  = signal<RecibosRespuesta | null>(null);
  readonly error      = signal<string | null>(null);

  readonly form = this.fb.group({
    montoRecibo: [null as number | null, [Validators.required, Validators.min(1)]],
  });

  ngOnInit() {
    this.seo.set({
      title: 'Calculadora Recibos por Honorarios',
      description: 'Calcula la retención de 4ta categoría en tu recibo por honorarios y verifica si puedes solicitar suspensión a SUNAT.',
    });
    this.analytics.track({ tipoEvento: 'inicio', calculadoraSlug: 'recibos-honorarios', modulo: 'tributario' });
  }

  calcular() {
    if (this.form.invalid) return;
    this.calculando.set(true);
    this.error.set(null);
    this.api.post<RecibosRespuesta>('/tributario/recibos-honorarios', this.form.value).subscribe({
      next: (res) => {
        this.resultado.set(res);
        this.calculando.set(false);
        this.analytics.track({ tipoEvento: 'completado', calculadoraSlug: 'recibos-honorarios', modulo: 'tributario' });
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
