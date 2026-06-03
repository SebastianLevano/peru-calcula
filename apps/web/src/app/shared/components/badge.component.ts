import { Component, Input } from '@angular/core';

export type BadgeTone = 'laboral' | 'tributario' | 'finanzas' | 'nuevo' | 'neutral';

/** Etiqueta/píldora de categoría. Paleta Boleta — armónica, no semáforo genérico. */
@Component({
  selector: 'app-badge',
  standalone: true,
  template: `
    <span class="inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset"
          [class]="clases">
      <ng-content />
    </span>
  `,
})
export class BadgeComponent {
  @Input() tone: BadgeTone = 'neutral';

  private static readonly MAP: Record<BadgeTone, string> = {
    laboral:    'bg-primary-50 text-primary-700 ring-primary-100',
    tributario: 'bg-accent-50 text-accent-700 ring-accent-500/20',
    finanzas:   'bg-ink-900/5 text-ink-700 ring-ink-900/10',
    nuevo:      'bg-accent-600 text-white ring-accent-700',
    neutral:    'bg-paper text-ink-600 ring-line',
  };

  get clases(): string { return BadgeComponent.MAP[this.tone]; }
}
