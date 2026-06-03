import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ApiClientService } from './api-client.service';
import { ConsentService } from './consent.service';

export interface AnalyticsEvento {
  tipoEvento: 'inicio' | 'completado' | 'export_pdf' | 'click_afiliado';
  calculadoraSlug: string;
  modulo: 'laboral' | 'tributario' | 'finanzas';
  parametrosVersion?: string;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly api       = inject(ApiClientService);
  private readonly consent   = inject(ConsentService);
  private readonly platform  = inject(PLATFORM_ID);

  track(evento: AnalyticsEvento) {
    if (!isPlatformBrowser(this.platform)) return;

    const dispositivo = this.detectDevice();
    // Fire-and-forget: errores no bloquean al usuario
    this.api.post('/analytics/evento', { ...evento, dispositivo }).subscribe({
      error: () => { /* silencioso */ }
    });
  }

  private detectDevice(): 'mobile' | 'desktop' | 'tablet' {
    const w = window.innerWidth;
    if (w < 768)  return 'mobile';
    if (w < 1024) return 'tablet';
    return 'desktop';
  }
}
