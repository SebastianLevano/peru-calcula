import { Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SlicePipe } from '@angular/common';
import { AdminApiService } from '../admin-api.service';

interface Parametro {
  id: number; clave: string; descripcion: string;
  valor: string; moneda: string | null; fuente: string;
  vigenciaDesde: string; xmin: number;
}

@Component({
  selector: 'app-admin-parametros',
  standalone: true,
  imports: [ReactiveFormsModule, SlicePipe],
  template: `
    <div class="px-6 py-6 space-y-5">
      <h1 class="text-lg font-semibold text-ink-900">Parámetros normativos</h1>
      <p class="text-sm text-ink-500">UIT, RMV y otros valores. Al guardar, la caché se invalida inmediatamente (ADR-24).</p>

      @if (error()) {
        <div class="rounded-card border border-error-600/25 bg-error-50 p-4 text-sm text-error-700" role="alert">{{ error() }}</div>
      }
      @if (ok()) {
        <div class="rounded-card border border-ok-600/25 bg-ok-50 p-4 text-sm text-ok-600" role="status">{{ ok() }}</div>
      }

      @if (cargando()) {
        <p class="text-sm text-ink-500">Cargando…</p>
      } @else {
        <div class="rounded-card border border-line bg-surface shadow-card overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-paper border-b border-line">
              <tr>
                <th class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Clave</th>
                <th class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Descripción</th>
                <th class="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-ink-500">Valor</th>
                <th class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Vigencia</th>
                <th class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Fuente</th>
                <th class="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line/70">
              @for (p of parametros(); track p.id) {
                @if (editando() === p.id) {
                  <tr class="bg-primary-50">
                    <td class="px-4 py-2 font-mono text-xs text-ink-700">{{ p.clave }}</td>
                    <td class="px-4 py-2 text-ink-600">{{ p.descripcion }}</td>
                    <td class="px-4 py-2">
                      <input [formControl]="editForm.controls.valor" type="text"
                        class="w-24 rounded-input border border-line px-2 py-1 text-right text-sm focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600/20" />
                    </td>
                    <td class="px-4 py-2">
                      <input [formControl]="editForm.controls.vigenciaDesde" type="date"
                        class="rounded-input border border-line px-2 py-1 text-sm focus:border-primary-600 focus:outline-none" />
                    </td>
                    <td class="px-4 py-2">
                      <input [formControl]="editForm.controls.fuente" type="text"
                        class="w-40 rounded-input border border-line px-2 py-1 text-sm focus:border-primary-600 focus:outline-none" />
                    </td>
                    <td class="px-4 py-2">
                      <div class="flex gap-2">
                        <button type="button" (click)="guardar(p)"
                          [disabled]="editForm.invalid || guardando()"
                          class="rounded-input bg-primary-700 px-3 py-1 text-xs font-medium text-white hover:bg-primary-800 disabled:opacity-50">
                          Guardar
                        </button>
                        <button type="button" (click)="editando.set(null)"
                          class="rounded-input border border-line px-3 py-1 text-xs text-ink-600 hover:bg-paper">
                          Cancelar
                        </button>
                      </div>
                    </td>
                  </tr>
                } @else {
                  <tr class="hover:bg-paper">
                    <td class="px-4 py-2.5 font-mono text-xs text-ink-700">{{ p.clave }}</td>
                    <td class="px-4 py-2.5 text-ink-600">{{ p.descripcion }}</td>
                    <td class="monto px-4 py-2.5 text-right font-semibold text-ink-900">
                      {{ p.moneda ? p.moneda + ' ' : '' }}{{ p.valor }}
                    </td>
                    <td class="px-4 py-2.5 text-ink-500">{{ p.vigenciaDesde | slice:0:10 }}</td>
                    <td class="px-4 py-2.5 text-ink-500 max-w-xs truncate">{{ p.fuente }}</td>
                    <td class="px-4 py-2.5">
                      <button type="button" (click)="iniciarEdicion(p)"
                        class="rounded-input border border-line px-3 py-1 text-xs text-ink-600 hover:bg-paper hover:text-ink-900">
                        Editar
                      </button>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class AdminParametrosComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly fb  = inject(FormBuilder);

  readonly parametros = signal<Parametro[]>([]);
  readonly cargando   = signal(true);
  readonly editando   = signal<number | null>(null);
  readonly guardando  = signal(false);
  readonly error      = signal('');
  readonly ok         = signal('');

  readonly editForm = this.fb.group({
    valor:         ['', Validators.required],
    fuente:        ['', Validators.required],
    vigenciaDesde: ['', Validators.required],
  });

  ngOnInit() {
    this.api.get<Parametro[]>('/parametros').subscribe({
      next: (p) => { this.parametros.set(p); this.cargando.set(false); },
      error: () => { this.error.set('Error al cargar parámetros.'); this.cargando.set(false); },
    });
  }

  iniciarEdicion(p: Parametro) {
    this.editando.set(p.id);
    this.ok.set('');
    this.error.set('');
    this.editForm.setValue({
      valor:         p.valor,
      fuente:        p.fuente,
      vigenciaDesde: p.vigenciaDesde.slice(0, 10),
    });
  }

  guardar(p: Parametro) {
    if (this.editForm.invalid) return;
    this.guardando.set(true);
    const v = this.editForm.value;
    this.api.put(`/parametros/${p.id}`, {
      valor:         v.valor,
      fuente:        v.fuente,
      vigenciaDesde: v.vigenciaDesde,
      xmin:          p.xmin,
    }).subscribe({
      next: () => {
        this.parametros.update(list =>
          list.map(x => x.id === p.id ? { ...x, valor: v.valor!, fuente: v.fuente!, vigenciaDesde: v.vigenciaDesde! } : x)
        );
        this.editando.set(null);
        this.guardando.set(false);
        this.ok.set(`Parámetro "${p.clave}" actualizado. Caché invalidada.`);
        setTimeout(() => this.ok.set(''), 4000);
      },
      error: (err) => {
        this.error.set(err?.error?.error ?? 'Error al guardar.');
        this.guardando.set(false);
      },
    });
  }
}
