import { Component, inject, signal, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { AdminApiService } from '../admin-api.service';

interface Dashboard {
  periodo: { desde: string; hasta: string };
  totales: { inicios: number; completados: number; tasaCompletadoPct: number };
  porCalculadora: { calculadora: string; inicios: number; completados: number }[];
  rollupsDiarios: { fecha: string; calculadoraSlug: string; inicios: number; completados: number }[];
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div class="px-6 py-6 space-y-6">
      <div>
        <h1 class="text-lg font-semibold text-ink-900">Dashboard</h1>
        @if (data()) {
          <p class="text-xs text-ink-500">Últimos 30 días · {{ data()!.periodo.desde }} → {{ data()!.periodo.hasta }}</p>
        }
      </div>

      @if (cargando()) {
        <p class="text-sm text-ink-500">Cargando…</p>
      } @else if (error()) {
        <div class="rounded-card border border-error-600/25 bg-error-50 p-4 text-sm text-error-700">{{ error() }}</div>
      } @else if (data()) {
        <!-- KPIs -->
        <div class="grid grid-cols-3 gap-4">
          <div class="rounded-card border border-line bg-surface p-4 shadow-card">
            <p class="text-xs text-ink-500">Cálculos iniciados</p>
            <p class="monto mt-1 text-2xl font-semibold text-ink-900">{{ data()!.totales.inicios | number }}</p>
          </div>
          <div class="rounded-card border border-line bg-surface p-4 shadow-card">
            <p class="text-xs text-ink-500">Completados</p>
            <p class="monto mt-1 text-2xl font-semibold text-ok-600">{{ data()!.totales.completados | number }}</p>
          </div>
          <div class="rounded-card border border-line bg-surface p-4 shadow-card">
            <p class="text-xs text-ink-500">Tasa de completado</p>
            <p class="monto mt-1 text-2xl font-semibold text-ink-900">{{ data()!.totales.tasaCompletadoPct | number:'1.1-1' }}%</p>
          </div>
        </div>

        <!-- Por calculadora -->
        <div class="rounded-card border border-line bg-surface shadow-card overflow-hidden">
          <div class="border-b border-line px-4 py-3">
            <h2 class="text-sm font-semibold text-ink-900">Por calculadora</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-paper border-b border-line">
                <tr>
                  <th class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Calculadora</th>
                  <th class="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-ink-500">Inicios</th>
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
      }
    </div>
  `,
})
export class AdminDashboardComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  readonly data     = signal<Dashboard | null>(null);
  readonly cargando = signal(true);
  readonly error    = signal('');

  ngOnInit() {
    this.api.get<Dashboard>('/analytics/dashboard').subscribe({
      next: (d) => { this.data.set(d); this.cargando.set(false); },
      error: () => { this.error.set('Error al cargar el dashboard.'); this.cargando.set(false); },
    });
  }
}
