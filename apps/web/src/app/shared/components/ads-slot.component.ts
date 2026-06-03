import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Placeholder reservado para ads (ADR-19). Fija el layout para proteger CLS.
 * Vacío en MVP; se activa en F4 con AdSense / afiliados.
 */
@Component({
  selector: 'app-ads-slot',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- ads-slot: reservado, vacío en MVP -->
    <div
      [class]="slotClass"
      aria-hidden="true"
      data-slot="ads">
    </div>
  `,
})
export class AdsSlotComponent {
  @Input() size: 'banner' | 'sidebar' | 'inline' = 'banner';

  get slotClass(): string {
    const sizes: Record<string, string> = {
      banner:  'w-full h-[90px]',
      sidebar: 'w-full h-[250px]',
      inline:  'w-full h-[100px]',
    };
    return `block ${sizes[this.size] ?? sizes['banner']}`;
  }
}
