import { Component, Input } from '@angular/core';

/**
 * Placeholder de carga. Por defecto un bloque que llena el host (tamaño vía clases).
 * Con [lines] dibuja N renglones de texto. Respeta prefers-reduced-motion.
 */
@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    @if (lines > 0) {
      <div class="space-y-2" aria-hidden="true">
        @for (l of renglones; track $index) {
          <div class="h-3.5 rounded bg-line motion-safe:animate-pulse" [class]="$last ? 'w-2/3' : 'w-full'"></div>
        }
      </div>
    } @else {
      <div class="h-full w-full rounded-card bg-line motion-safe:animate-pulse" aria-hidden="true"></div>
    }
  `,
})
export class SkeletonComponent {
  @Input() lines = 0;
  get renglones(): number[] { return Array.from({ length: this.lines }); }
}
