import { Component, Input } from '@angular/core';
import { DatePipe } from '@angular/common';

/**
 * Ficha de auditoría (ADR-20): el activo de confianza, protagonista.
 * Evoca el pie de una resolución oficial: fuente · versión · fecha de la norma.
 * Contraste AA obligatorio; iconografía de verificación.
 */
@Component({
  selector: 'app-trust-badge',
  standalone: true,
  imports: [DatePipe],
  template: `
    <section class="rounded-card border border-line bg-paper p-4" aria-label="Origen normativo del cálculo">
      <div class="flex items-center gap-2">
        <span class="flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-white">
          <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z" clip-rule="evenodd"/>
          </svg>
        </span>
        <p class="font-display text-sm font-semibold text-ink-900">Calculado con la norma vigente</p>
      </div>

      <dl class="mt-3 grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
        @if (fuente) {
          <div class="flex items-baseline justify-between gap-3 border-b border-line/70 pb-1.5">
            <dt class="text-ink-500">Fuente / norma</dt>
            <dd class="text-right font-medium text-ink-900">{{ fuente }}</dd>
          </div>
        }
        @if (version) {
          <div class="flex items-baseline justify-between gap-3 border-b border-line/70 pb-1.5">
            <dt class="text-ink-500">Versión de parámetros</dt>
            <dd class="text-right font-medium text-ink-900">v{{ version }}</dd>
          </div>
        }
        @if (fechaActualizacion) {
          <div class="flex items-baseline justify-between gap-3 border-b border-line/70 pb-1.5">
            <dt class="text-ink-500">Actualización normativa</dt>
            <dd class="text-right font-medium text-ink-900">{{ fechaActualizacion | date: 'd \\'de\\' MMMM \\'de\\' y' : '' : 'es' }}</dd>
          </div>
        }
      </dl>

      <p class="mt-3 text-xs text-ink-500">
        Cálculo referencial basado en la normativa citada. No constituye asesoría legal ni tributaria.
      </p>
    </section>
  `,
})
export class TrustBadgeComponent {
  @Input() fuente?: string;
  @Input() fechaActualizacion?: string;
  @Input() version?: string;
}
