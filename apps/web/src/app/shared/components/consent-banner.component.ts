import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ConsentService } from '../../core/consent.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-consent-banner',
  standalone: true,
  imports: [RouterModule],
  template: `
    @if (consent.isPending) {
      <div class="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface shadow-pop"
           role="dialog" aria-modal="true" aria-label="Opciones de privacidad"
           aria-describedby="consent-desc">
        <div class="mx-auto max-w-4xl px-4 py-4">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
            <p id="consent-desc" class="flex-1 text-sm text-ink-600">
              Usamos <strong class="text-ink-900">analítica anónima propia</strong> (sin datos personales) para mejorar la plataforma.
              @if (adsActive) {
                Si aceptas, también mostramos <strong class="text-ink-900">publicidad de Google AdSense</strong>.
              }
              Puedes rechazar sin perder ninguna funcionalidad. ·&nbsp;
              <a routerLink="/privacidad"
                 class="font-medium text-primary-700 underline underline-offset-2 hover:text-primary-800
                        focus:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-primary-600">
                Política de privacidad (Ley 29733)
              </a>
            </p>
            <div class="flex shrink-0 gap-3">
              <button type="button" (click)="consent.reject()"
                class="rounded-input border border-line bg-paper px-4 py-2 text-sm font-medium text-ink-700
                       hover:border-ink-500 hover:bg-white
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ink-500 transition-colors"
                aria-label="Rechazar publicidad y analítica opcional">
                Solo esencial
              </button>
              <button type="button" (click)="consent.accept()"
                class="rounded-input bg-primary-700 px-4 py-2 text-sm font-medium text-white
                       hover:bg-primary-800
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-600 transition-colors"
                aria-label="Aceptar analítica y publicidad">
                Aceptar todo
              </button>
            </div>
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
