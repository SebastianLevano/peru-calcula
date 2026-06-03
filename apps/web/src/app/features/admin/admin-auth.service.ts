import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

const ACCESS_KEY  = 'admin_access';
const REFRESH_KEY = 'admin_refresh';

interface AuthTokens { accessToken: string; refreshToken: string; }

/**
 * Gestiona el ciclo de vida de la sesión admin: login, logout, refresh automático.
 * Tokens en localStorage (ADR-08: JWT corto + refresh revocable).
 */
@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly http     = inject(HttpClient);
  private readonly router   = inject(Router);
  private readonly platform = inject(PLATFORM_ID);
  private readonly apiBase  = `${environment.apiUrl}/api/v1/admin/auth`;

  readonly autenticado = signal(false);
  readonly email       = signal('');

  constructor() {
    if (isPlatformBrowser(this.platform)) {
      const token = localStorage.getItem(ACCESS_KEY);
      if (token && !this.estaExpirado(token)) {
        this.autenticado.set(true);
        this.email.set(this.emailDesdeToken(token));
      }
    }
  }

  async login(emailVal: string, password: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<AuthTokens>(`${this.apiBase}/login`, { email: emailVal, password })
    );
    this.guardarTokens(res);
  }

  async logout(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      try {
        await firstValueFrom(
          this.http.post(`${this.apiBase}/logout`, { refreshToken },
            { headers: { Authorization: `Bearer ${this.getAccessToken()}` } })
        );
      } catch { /* ignorar errores en logout */ }
    }
    this.limpiarTokens();
    this.router.navigate(['/admin/login']);
  }

  async refreshIfNeeded(): Promise<boolean> {
    const access  = this.getAccessToken();
    const refresh = this.getRefreshToken();
    if (!refresh) return false;
    if (access && !this.estaExpirado(access)) return true;

    try {
      const res = await firstValueFrom(
        this.http.post<AuthTokens>(`${this.apiBase}/refresh`, { refreshToken: refresh })
      );
      this.guardarTokens(res);
      return true;
    } catch {
      this.limpiarTokens();
      return false;
    }
  }

  getAccessToken(): string | null {
    if (!isPlatformBrowser(this.platform)) return null;
    return localStorage.getItem(ACCESS_KEY);
  }

  private getRefreshToken(): string | null {
    if (!isPlatformBrowser(this.platform)) return null;
    return localStorage.getItem(REFRESH_KEY);
  }

  private guardarTokens(tokens: AuthTokens) {
    if (!isPlatformBrowser(this.platform)) return;
    localStorage.setItem(ACCESS_KEY,  tokens.accessToken);
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
    this.autenticado.set(true);
    this.email.set(this.emailDesdeToken(tokens.accessToken));
  }

  private limpiarTokens() {
    if (!isPlatformBrowser(this.platform)) return;
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    this.autenticado.set(false);
    this.email.set('');
  }

  private estaExpirado(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch { return true; }
  }

  private emailDesdeToken(token: string): string {
    try {
      return JSON.parse(atob(token.split('.')[1])).email ?? '';
    } catch { return ''; }
  }
}
