import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, from, switchMap, throwError, catchError } from 'rxjs';
import { AdminAuthService } from './admin-auth.service';

/**
 * Cliente HTTP para endpoints admin. Inyecta Bearer + refresca token automáticamente.
 */
@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http   = inject(HttpClient);
  private readonly auth   = inject(AdminAuthService);
  private readonly router = inject(Router);
  private readonly base   = '/api/v1/admin';

  get<T>(path: string): Observable<T> {
    return this.withAuth(token =>
      this.http.get<T>(`${this.base}${path}`, { headers: this.headers(token) })
    );
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.withAuth(token =>
      this.http.post<T>(`${this.base}${path}`, body, { headers: this.headers(token) })
    );
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.withAuth(token =>
      this.http.put<T>(`${this.base}${path}`, body, { headers: this.headers(token) })
    );
  }

  delete<T>(path: string): Observable<T> {
    return this.withAuth(token =>
      this.http.delete<T>(`${this.base}${path}`, { headers: this.headers(token) })
    );
  }

  private withAuth<T>(fn: (token: string) => Observable<T>): Observable<T> {
    return from(this.auth.refreshIfNeeded()).pipe(
      switchMap(ok => {
        if (!ok) {
          this.router.navigate(['/admin/login']);
          return throwError(() => new Error('No autenticado'));
        }
        return fn(this.auth.getAccessToken()!);
      }),
      catchError(err => {
        if (err?.status === 401) {
          this.auth.logout();
        }
        return throwError(() => err);
      })
    );
  }

  private headers(token: string): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}
