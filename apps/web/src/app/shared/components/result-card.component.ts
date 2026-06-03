import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { TrustBadgeComponent } from './trust-badge.component';
import { PdfService } from '../../core/pdf.service';
import { FeatureFlagsService } from '../../core/feature-flags.service';

export interface DesgloseLine {
  concepto: string;
  valor:     number;
}

export interface ResultadoConfianza {
  parametrosVersion?:           string;
  fechaActualizacionNormativa?: string;
  fuente?:                      string;
  disclaimer?:                  string;
}

/**
 * Resultado como "documento": monto en serif tabular, vigencia normativa bajo el monto,
 * desglose tipo estado de cuenta y ficha de auditoría (TrustBadge) al pie.
 */
@Component({
  selector: 'app-result-card',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, TrustBadgeComponent],
  template: `
    <div class="overflow-hidden rounded-card border border-line bg-surface shadow-card">
      <div id="result-card-content" class="space-y-5 p-6">
        <!-- Monto principal -->
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-ink-500">{{ titulo }}</p>
          <p class="monto mt-1 font-display text-4xl font-semibold leading-tight text-ink-900 sm:text-5xl">
            {{ montoFinal | currency: 'PEN' : 'symbol' : '1.2-2' : 'es-PE' }}
          </p>

          <!-- Vigencia normativa (Ajuste #13): bajo el monto, antes del desglose -->
          @if (confianza?.fechaActualizacionNormativa) {
            <p class="mt-2 inline-flex items-center gap-1.5 text-sm text-ink-600">
              <svg class="h-4 w-4 text-primary-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.7-9.3a1 1 0 0 0-1.4-1.4L9 10.6 7.7 9.3a1 1 0 0 0-1.4 1.4l2 2a1 1 0 0 0 1.4 0l4-4Z" clip-rule="evenodd"/>
              </svg>
              Normativa vigente al {{ confianza!.fechaActualizacionNormativa | date: 'd \\'de\\' MMMM \\'de\\' y' : '' : 'es' }}
            </p>
          }
        </div>

        @if (desglose?.length) {
          <table class="w-full border-t border-line text-sm" aria-label="Desglose del cálculo">
            <tbody>
              @for (line of desglose; track line.concepto) {
                <tr class="border-b border-line/70">
                  <th scope="row" class="py-2 pr-3 text-left font-normal text-ink-600">{{ line.concepto }}</th>
                  <td class="monto py-2 text-right font-medium text-ink-900">
                    {{ line.valor | currency: 'PEN' : 'symbol' : '1.2-2' : 'es-PE' }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }

        @if (confianza) {
          <app-trust-badge
            [fuente]="confianza.fuente"
            [fechaActualizacion]="confianza.fechaActualizacionNormativa"
            [version]="confianza.parametrosVersion" />
        }
      </div>

      <!-- Acciones (fuera del área capturada en PDF) -->
      <div class="flex gap-3 border-t border-line bg-paper p-4">
        <button (click)="onCompartir()" type="button"
          class="inline-flex flex-1 items-center justify-center gap-2 rounded-input border border-line bg-surface py-2.5 text-sm font-medium text-ink-700
                 hover:border-primary-200 hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
          aria-label="Copiar el enlace para compartir este resultado">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.7 13.3a4 4 0 0 0 6 .4l3-3a4 4 0 0 0-5.7-5.7l-1.7 1.7m-1.3 4.7a4 4 0 0 1-6-.4l-3-3a4 4 0 0 1 5.7-5.7L7.1 4"/>
          </svg>
          {{ copiado() ? '¡Enlace copiado!' : 'Compartir' }}
        </button>
        @if (flags.isEnabled('pdfExport')) {
          <button (click)="onDescargarPdf()" type="button"
            class="inline-flex flex-1 items-center justify-center gap-2 rounded-input border border-line bg-surface py-2.5 text-sm font-medium text-ink-700
                   hover:border-primary-200 hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
            aria-label="Descargar el resultado en PDF">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>
            </svg>
            Descargar PDF
          </button>
        }
      </div>
    </div>
  `,
})
export class ResultCardComponent {
  @Input() titulo            = 'Resultado';
  @Input() montoFinal        = 0;
  @Input() desglose?:        DesgloseLine[];
  @Input() confianza?:       ResultadoConfianza;
  @Input() calculadoraSlug   = '';
  @Input() modulo: 'laboral' | 'tributario' | 'finanzas' = 'finanzas';

  private readonly pdf  = inject(PdfService);
  readonly flags        = inject(FeatureFlagsService);
  readonly copiado      = signal(false);

  onCompartir() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).then(() => {
        this.copiado.set(true);
        setTimeout(() => this.copiado.set(false), 2200);
      });
    }
  }

  onDescargarPdf() {
    this.pdf.descargar('result-card-content', `resultado-${this.calculadoraSlug}`, this.calculadoraSlug, this.modulo);
  }
}
