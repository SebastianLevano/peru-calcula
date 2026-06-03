import { Component, inject, signal, OnInit } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { AdminApiService } from '../admin-api.service';

interface Dashboard {
  periodo: { desde: string; hasta: string };
  totales: { inicios: number; completados: number; tasaCompletadoPct: number };
  hoy:     { inicios: number; completados: number };
  porCalculadora: { calculadora: string; inicios: number; completados: number }[];
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [DecimalPipe, DatePipe],
  template: `
    <div class="px-6 py-6 space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-lg font-semibold text-ink-900">Dashboard</h1>
          @if (data()) {
            <p class="text-xs text-ink-500">
              Últimos 30 días · {{ data()!.periodo.desde }} → {{ data()!.periodo.hasta }}
            </p>
          }
        </div>
        <button type="button" (click)="cargar()" [disabled]="cargando()"
          class="inline-flex items-center gap-1.5 rounded-input border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-600
                 hover:bg-paper disabled:opacity-50 transition-colors">
          <svg class="h-3.5 w-3.5" [class.animate-spin]="cargando()" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/>
          </svg>
          Actualizar
        </button>
      </div>

      @if (error()) {
        <div class="rounded-card border border-error-600/25 bg-error-50 p-4 text-sm text-error-700">{{ error() }}</div>
      }

      @if (cargando() && !data()) {
        <p class="text-sm text-ink-500">Cargando…</p>
      } @else if (data()) {

        <!-- Hoy (tiempo real) -->
        <div class="rounded-card border border-primary-100 bg-primary-50 p-4">
          <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-primary-700">Hoy (tiempo real)</p>
          <div class="flex gap-8">
            <div>
              <p class="text-xs text-primary-600">Cálculos iniciados</p>
              <p class="monto text-xl font-semibold text-primary-900">{{ data()!.hoy.inicios | number }}</p>
            </div>
            <div>
              <p class="text-xs text-primary-600">Completados</p>
              <p class="monto text-xl font-semibold text-primary-900">{{ data()!.hoy.completados | number }}</p>
            </div>
          </div>
        </div>

        <!-- KPIs 30 días -->
        <div class="grid grid-cols-3 gap-4">
          <div class="rounded-card border border-line bg-surface p-4 shadow-card">
            <p class="text-xs text-ink-500">Iniciados (30d)</p>
            <p class="monto mt-1 text-2xl font-semibold text-ink-900">{{ data()!.totales.inicios | number }}</p>
          </div>
          <div class="rounded-card border border-line bg-surface p-4 shadow-card">
            <p class="text-xs text-ink-500">Completados (30d)</p>
            <p class="monto mt-1 text-2xl font-semibold text-ok-600">{{ data()!.totales.completados | number }}</p>
          </div>
          <div class="rounded-card border border-line bg-surface p-4 shadow-card">
            <p class="text-xs text-ink-500">Tasa completado</p>
            <p class="monto mt-1 text-2xl font-semibold text-ink-900">{{ data()!.totales.tasaCompletadoPct | number:'1.1-1' }}%</p>
          </div>
        </div>

        <!-- Por calculadora -->
        @if (data()!.porCalculadora.length > 0) {
          <div class="rounded-card border border-line bg-surface shadow-card overflow-hidden">
            <div class="border-b border-line px-4 py-3">
              <h2 class="text-sm font-semibold text-ink-900">Por calculadora (30d + hoy)</h2>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-paper border-b border-line">
                  <tr>
                    <th class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Calculadora</th>
                    <th class="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-ink-500">Iniciados</th>
                    <th class="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-ink-500">Completados</th>
                    <th class="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-ink-500">Tasa</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-line/70">
                  @for (c of data()!.porCalculadora; track c.calculadora) {
                    <tr class="hover:bg-paper">
                      <td class="px-4 py-2.5 font-medium text-ink-900">{{ c.calculadora }}</td>
                      <td class="monto px-4 py-2.5 text-right text-ink-600">{{ c.inicios | number }}</td>
                      <td class="monto px-4 py-2.5 text-right text-ok-600">{{ c.completados | number }}</td>
                      <td class="monto px-4 py-2.5 text-right text-ink-900">
                        {{ c.inicios > 0 ? ((c.completados / c.inicios * 100) | number:'1.0-0') + '%' : '—' }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        } @else {
          <div class="rounded-card border border-dashed border-line bg-surface p-8 text-center text-sm text-ink-500">
            Aún no hay datos. Los cálculos registrados aparecerán aquí en tiempo real.
          </div>
        }
      }
    </div>
  `,
})
export class AdminDashboardComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  readonly data     = signal<Dashboard | null>(null);
  readonly cargando = signal(true);
  readonly error    = signal('');

  ngOnInit() { this.cargar(); }

  cargar() {
    this.cargando.set(true);
    this.error.set('');
    this.api.get<Dashboard>('/analytics/dashboard').subscribe({
      next: (d) => { this.data.set(d); this.cargando.set(false); },
      error: () => { this.error.set('Error al cargar el dashboard.'); this.cargando.set(false); },
    });
  }
}
