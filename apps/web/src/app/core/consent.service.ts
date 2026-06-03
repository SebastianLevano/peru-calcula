import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ConsentState = 'pending' | 'accepted' | 'rejected';

const STORAGE_KEY = 'peru_calcula_consent';

/**
 * Gestiona el consentimiento (Ley 29733 / ADR-26).
 * GA4 y ads se bloquean hasta opt-in explícito.
 * La analítica in-house anónima opera siempre.
 */
@Injectable({ providedIn: 'root' })
export class ConsentService {
  private readonly platformId = inject(PLATFORM_ID);
  readonly state = signal<ConsentState>('pending');

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem(STORAGE_KEY) as ConsentState | null;
      if (saved === 'accepted' || saved === 'rejected') {
        this.state.set(saved);
      }
    }
  }

  accept() {
    this.state.set('accepted');
    if (isPlatformBrowser(this.platformId))
      localStorage.setItem(STORAGE_KEY, 'accepted');
  }

  reject() {
    this.state.set('rejected');
    if (isPlatformBrowser(this.platformId))
      localStorage.setItem(STORAGE_KEY, 'rejected');
  }

  get hasConsented() { return this.state() === 'accepted'; }
  get isPending()    { return this.state() === 'pending'; }
}
