import { Component, Input } from '@angular/core';

/** Estado vacío: marcador antes del primer cálculo. Acciones vía contenido proyectado. */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="flex flex-col items-center rounded-card border border-dashed border-line bg-surface px-6 py-10 text-center">
      <span class="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-700">
        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 7h6m-6 4h6m-6 4h4M6 3h9l3 3v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/>
        </svg>
      </span>
      <p class="mt-4 font-display text-base font-semibold text-ink-900">{{ titulo }}</p>
      @if (mensaje) { <p class="mt-1 max-w-sm text-sm text-ink-600">{{ mensaje }}</p> }
      <div class="mt-4 empty:hidden"><ng-content /></div>
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() titulo = 'Aún no hay resultados';
  @Input() mensaje?: string;
}
