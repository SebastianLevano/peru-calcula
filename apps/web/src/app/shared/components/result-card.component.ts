import { Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { TrustBadgeComponent } from './trust-badge.component';

export interface DesgloseLine {
  concepto: string;
  valor:     number;
}

export interface ResultadoConfianza {
  parametrosVersion?:         string;
  fechaActualizacionNormativa?: string;
  fuente?:                    string;
  disclaimer?:                string;
}

@Component({
  selector: 'app-result-card',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, TrustBadgeComponent],
  template: `
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
      <div class="text-center">
        <p class="text-sm text-gray-500 uppercase tracking-wide">{{ titulo }}</p>
        <p class="text-4xl font-bold text-blue-700 mt-1">
          {{ montoFinal | currency:'PEN':'symbol':'1.2-2' }}
        </p>
      </div>

      @if (desglose?.length) {
        <table class="w-full text-sm" aria-label="Desglose del cálculo">
          <tbody>
            @for (line of desglose; track line.concepto) {
              <tr class="border-t border-gray-100">
                <td class="py-1.5 text-gray-600">{{ line.concepto }}</td>
                <td class="py-1.5 text-right font-medium">
                  {{ line.valor | currency:'PEN':'symbol':'1.2-2' }}
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

      <div class="flex gap-3 pt-2">
        <button
          (click)="onCompartir()"
          class="flex-1 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Compartir resultado por URL">
          Compartir
        </button>
      </div>
    </div>
  `,
})
export class ResultCardComponent {
  @Input() titulo     = 'Resultado';
  @Input() montoFinal = 0;
  @Input() desglose?: DesgloseLine[];
  @Input() confianza?: ResultadoConfianza;

  onCompartir() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
  }
}
