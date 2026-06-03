import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConsentService } from '../../core/consent.service';

@Component({
  selector: 'app-consent-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (consent.isPending) {
      <div class="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 shadow-lg p-4" role="dialog" aria-label="Banner de consentimiento de cookies">
        <div class="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <p class="text-sm text-gray-700 flex-1">
            Usamos cookies analíticas anónimas para mejorar la plataforma. No compartimos datos personales.
            <a href="/privacidad" class="underline text-blue-600">Más información</a>
          </p>
          <div class="flex gap-3 shrink-0">
            <button
              (click)="consent.reject()"
              class="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              aria-label="Rechazar cookies opcionales">
              Rechazar
            </button>
            <button
              (click)="consent.accept()"
              class="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              aria-label="Aceptar todas las cookies">
              Aceptar
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConsentBannerComponent {
  readonly consent = inject(ConsentService);
}
