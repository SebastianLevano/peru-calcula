import { Injectable, signal, PLATFORM_ID, inject, DOCUMENT } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';

export type ConsentState = 'pending' | 'accepted' | 'rejected';

const STORAGE_KEY = 'peru_calcula_consent';

/**
 * Gestiona el consentimiento (Ley 29733 / ADR-26).
 * GA4 y AdSense se bloquean hasta opt-in explícito.
 * La analítica in-house anónima opera siempre sin necesitar consentimiento.
 */
@Injectable({ providedIn: 'root' })
export class ConsentService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly doc        = inject(DOCUMENT);
  readonly state = signal<ConsentState>('pending');

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem(STORAGE_KEY) as ConsentState | null;
      if (saved === 'accepted') {
        this.state.set('accepted');
        this.activarScriptsExternos();
      } else if (saved === 'rejected') {
        this.state.set('rejected');
      }
    }
  }

  accept() {
    this.state.set('accepted');
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(STORAGE_KEY, 'accepted');
      this.activarScriptsExternos();
    }
  }

  reject() {
    this.state.set('rejected');
    if (isPlatformBrowser(this.platformId))
      localStorage.setItem(STORAGE_KEY, 'rejected');
  }

  get hasConsented() { return this.state() === 'accepted'; }
  get isPending()    { return this.state() === 'pending'; }

  /**
   * Carga AdSense y GA4 solo después del consentimiento explícito (ADR-26).
   * Se llama una sola vez; scripts ya presentes en el DOM no se duplican.
   */
  private activarScriptsExternos() {
    if (!isPlatformBrowser(this.platformId)) return;

    // AdSense
    if (environment.adsense?.enabled && environment.adsense?.clientId &&
        !this.doc.querySelector('script[data-adsense]')) {
      const s = this.doc.createElement('script');
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${environment.adsense.clientId}`;
      s.async = true;
      s.crossOrigin = 'anonymous';
      s.setAttribute('data-adsense', '1');
      this.doc.head.appendChild(s);
    }

    // GA4 (si se configura en el futuro)
    if (environment.ga4MeasurementId &&
        !this.doc.querySelector('script[data-ga4]')) {
      const s = this.doc.createElement('script');
      s.src = `https://www.googletagmanager.com/gtag/js?id=${environment.ga4MeasurementId}`;
      s.async = true;
      s.setAttribute('data-ga4', '1');
      this.doc.head.appendChild(s);

      const init = this.doc.createElement('script');
      init.setAttribute('data-ga4', '1');
      init.text = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${environment.ga4MeasurementId}');`;
      this.doc.head.appendChild(init);
    }
  }
}
