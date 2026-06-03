import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminAuthService } from '../admin-auth.service';
import { LogoComponent } from '../../../shared/layout/logo.component';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [ReactiveFormsModule, LogoComponent],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-paper px-4">
      <div class="w-full max-w-sm">

        <div class="mb-8 flex flex-col items-center gap-3 text-center">
          <app-logo class="block h-12 w-12" />
          <div>
            <h1 class="font-display text-xl font-semibold text-ink-900">Perú Calcula</h1>
            <p class="text-sm text-ink-500">Panel de administración</p>
          </div>
        </div>

        <form [formGroup]="form" (ngSubmit)="ingresar()"
              class="rounded-card border border-line bg-surface p-6 shadow-card space-y-5">

          @if (errorMsg()) {
            <div class="rounded-input border border-error-600/25 bg-error-50 px-4 py-3 text-sm text-error-700" role="alert">
              {{ errorMsg() }}
            </div>
          }

          <div class="space-y-1">
            <label for="email" class="block text-sm font-medium text-ink-700">Email</label>
            <input id="email" type="email" formControlName="email" autocomplete="email"
                   class="w-full rounded-input border border-line bg-surface px-3.5 py-2.5 text-sm text-ink-900 placeholder-ink-500
                          focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20">
          </div>

          <div class="space-y-1">
            <label for="password" class="block text-sm font-medium text-ink-700">Contraseña</label>
            <input id="password" type="password" formControlName="password" autocomplete="current-password"
                   class="w-full rounded-input border border-line bg-surface px-3.5 py-2.5 text-sm text-ink-900 placeholder-ink-500
                          focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20">
          </div>

          <button type="submit" [disabled]="form.invalid || cargando()"
            class="w-full rounded-input bg-primary-700 py-2.5 text-sm font-semibold text-white
                   hover:bg-primary-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2
                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            @if (cargando()) {
              <span class="inline-flex items-center justify-center gap-2">
                <svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4z"/>
                </svg>
                Ingresando…
              </span>
            } @else { Ingresar }
          </button>
        </form>

      </div>
    </div>
  `,
})
export class AdminLoginComponent {
  private readonly auth   = inject(AdminAuthService);
  private readonly router = inject(Router);
  private readonly fb     = inject(FormBuilder);

  readonly cargando = signal(false);
  readonly errorMsg = signal('');

  readonly form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  async ingresar() {
    if (this.form.invalid) return;
    this.cargando.set(true);
    this.errorMsg.set('');

    try {
      await this.auth.login(this.form.value.email!, this.form.value.password!);
      this.router.navigate(['/admin/dashboard']);
    } catch {
      this.errorMsg.set('Email o contraseña incorrectos.');
    } finally {
      this.cargando.set(false);
    }
  }
}
