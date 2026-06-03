import { Injectable, signal, inject, WritableSignal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

/**
 * Sincroniza signals de inputs ↔ query string (ADR-14).
 * Uso: const valor = this.urlState.bind('basico', 0);
 */
@Injectable({ providedIn: 'root' })
export class UrlStateService {
  private readonly router = inject(Router);
  private readonly route  = inject(ActivatedRoute);

  bind<T>(key: string, defaultValue: T): WritableSignal<T> {
    const params = toSignal(
      this.route.queryParamMap.pipe(map(p => p.get(key))),
      { initialValue: null }
    );

    const s = signal<T>(
      params() !== null ? this.parse<T>(params()!, defaultValue) : defaultValue
    );

    return s;
  }

  sync(params: Record<string, string | number | boolean | null>) {
    this.router.navigate([], {
      queryParams: params,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  shareUrl(): string {
    return window.location.href;
  }

  private parse<T>(raw: string, fallback: T): T {
    if (typeof fallback === 'number') return Number(raw) as T;
    if (typeof fallback === 'boolean') return (raw === 'true') as T;
    return raw as T;
  }
}
