import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Muestra señales de confianza: fuente normativa, fecha actualización y versión de parámetros (ADR-20).
 */
@Component({
  selector: 'app-trust-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-wrap gap-2 text-xs text-gray-500 mt-2">
      @if (fuente) {
        <span class="inline-flex items-center gap-1">
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          Fuente: {{ fuente }}
        </span>
      }
      @if (fechaActualizacion) {
        <span>· Actualizado: {{ fechaActualizacion }}</span>
      }
      @if (version) {
        <span>· v{{ version }}</span>
      }
      <span class="block w-full mt-1 text-gray-400">
        Cálculo referencial. No constituye asesoría legal o tributaria.
      </span>
    </div>
  `,
})
export class TrustBadgeComponent {
  @Input() fuente?: string;
  @Input() fechaActualizacion?: string;
  @Input() version?: string;
}
