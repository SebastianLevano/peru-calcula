import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AdminAuthService } from './admin-auth.service';
import { LogoComponent } from '../../shared/layout/logo.component';
import { SeoService } from '../../core/seo.service';

const NAV = [
  { path: '/admin/dashboard',  label: 'Dashboard',   icon: 'chart' },
  { path: '/admin/parametros', label: 'Parámetros',  icon: 'sliders' },
  { path: '/admin/tasas',      label: 'Tasas',        icon: 'percent' },
  { path: '/admin/bancos',     label: 'Bancos',       icon: 'bank' },
  { path: '/admin/guias',      label: 'Guías',        icon: 'document' },
];

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterModule, LogoComponent],
  template: `
    <div class="flex h-screen bg-paper">

      <!-- Sidebar -->
      <aside class="hidden w-56 shrink-0 flex-col border-r border-line bg-surface md:flex">
        <div class="flex items-center gap-2.5 border-b border-line px-4 py-4">
          <app-logo class="block h-7 w-7" />
          <div>
            <p class="text-sm font-semibold text-ink-900">Perú Calcula</p>
            <p class="text-xs text-ink-500">Admin</p>
          </div>
        </div>

        <nav class="flex-1 overflow-y-auto px-2 py-3 space-y-0.5" aria-label="Navegación admin">
          @for (item of nav; track item.path) {
            <a [routerLink]="item.path" routerLinkActive="bg-primary-50 text-primary-700 font-medium"
               class="flex items-center gap-3 rounded-input px-3 py-2 text-sm text-ink-600
                      hover:bg-paper hover:text-ink-900 transition-colors
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600">
              <span class="h-4 w-4 shrink-0" aria-hidden="true" [innerHTML]="icono(item.icon)"></span>
              {{ item.label }}
            </a>
          }
        </nav>

        <div class="border-t border-line px-4 py-3">
          <p class="truncate text-xs text-ink-500">{{ auth.email() }}</p>
          <button type="button" (click)="auth.logout()"
            class="mt-1 text-xs font-medium text-error-600 hover:text-error-700">
            Cerrar sesión
          </button>
        </div>
      </aside>

      <!-- Mobile header -->
      <div class="flex flex-1 flex-col overflow-hidden">
        <header class="flex items-center gap-3 border-b border-line bg-surface px-4 py-3 md:hidden">
          <app-logo class="block h-7 w-7" />
          <span class="font-semibold text-ink-900">Admin</span>
          <button type="button" (click)="mobileMenu.set(!mobileMenu())"
            class="ml-auto rounded-input p-2 text-ink-600 hover:bg-paper">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" d="M4 7h16M4 12h16M4 17h16"/>
            </svg>
          </button>
        </header>

        @if (mobileMenu()) {
          <nav class="border-b border-line bg-surface px-2 py-2 space-y-0.5 md:hidden">
            @for (item of nav; track item.path) {
              <a [routerLink]="item.path" (click)="mobileMenu.set(false)"
                 routerLinkActive="bg-primary-50 text-primary-700"
                 class="block rounded-input px-3 py-2 text-sm text-ink-600 hover:bg-paper">
                {{ item.label }}
              </a>
            }
            <button type="button" (click)="auth.logout()"
              class="block w-full rounded-input px-3 py-2 text-left text-sm text-error-600">
              Cerrar sesión
            </button>
          </nav>
        }

        <!-- Page content -->
        <main class="flex-1 overflow-y-auto">
          <router-outlet />
        </main>
      </div>

    </div>
  `,
})
export class AdminLayoutComponent implements OnInit {
  private readonly seo = inject(SeoService);
  readonly auth        = inject(AdminAuthService);

  ngOnInit() {
    // Evitar indexación de todas las páginas del panel admin
    this.seo.set({ title: 'Admin', description: '', noindex: true });
  }
  readonly nav        = NAV;
  readonly mobileMenu = signal(false);

  icono(name: string): string {
    const icons: Record<string, string> = {
      chart:    '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.7"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"/></svg>',
      sliders:  '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.7"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"/></svg>',
      percent:  '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.7"><path stroke-linecap="round" stroke-linejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185Z"/></svg>',
      bank:     '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.7"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z"/></svg>',
      document: '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.7"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/></svg>',
    };
    return icons[name] ?? '';
  }
}
