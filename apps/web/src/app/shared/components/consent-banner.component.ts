import { Component, inject } from '@angular/core';
import { ConsentService } from '../../core/consent.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-consent-banner',
  standalone: true,
  template: `
    @if (consent.isPending) {
      <div class="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 shadow-lg"
           role="dialog" aria-modal="true" aria-label="Opciones de privacidad">
        <div class="max-w-4xl mx-auto p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div class="flex-1 text-sm text-gray-700 space-y-1">
            <p>
              Usamos <strong>analítica anónima propia</strong> (sin datos personales) para mejorar la plataforma.
              @if (adsActive) {
                Si aceptas, también mostramos <strong>publicidad relevante de Google AdSense</strong>.
              }
              Puedes rechazar sin perder ninguna funcionalidad.
              <a href="/privacidad" class="underline text-blue-600 hover:text-blue-700">Política de privacidad (Ley 29733)</a>
            </p>
          </div>
          <div class="flex gap-3 shrink-0">
            <button
              (click)="consent.reject()"
              class="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors"
              aria-label="Rechazar publicidad y analítica opcional">
              Solo esencial
            </button>
            <button
              (click)="consent.accept()"
              class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              aria-label="Aceptar analítica y publicidad">
              Aceptar todo
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConsentBannerComponent {
  readonly consent   = inject(ConsentService);
  readonly adsActive = environment.adsense?.enabled ?? false;
}
