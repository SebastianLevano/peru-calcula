import { Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DecimalPipe, SlicePipe } from '@angular/common';
import { AdminApiService } from '../admin-api.service';

interface Tasa {
  id: number; banco: string; producto: string;
  tea: number; tcea: number; comisionAdmin: number | null;
  vigenciaDesde: string; fuente: string; esReferencial: boolean; xmin: number;
}

@Component({
  selector: 'app-admin-tasas',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe, SlicePipe],
  template: `
    <div class="px-6 py-6 space-y-5">
      <h1 class="text-lg font-semibold text-ink-900">Tasas financieras</h1>
      <p class="text-sm text-ink-500">TEA y TCEA vigentes por producto. Editar cierra la vigencia anterior y crea una nueva entrada histórica.</p>

      @if (error()) { <div class="rounded-card border border-error-600/25 bg-error-50 p-4 text-sm text-error-700">{{ error() }}</div> }
      @if (ok())    { <div class="rounded-card border border-ok-600/25 bg-ok-50 p-4 text-sm text-ok-600">{{ ok() }}</div> }

      @if (cargando()) {
        <p class="text-sm text-ink-500">Cargando…</p>
      } @else {
        <div class="rounded-card border border-line bg-surface shadow-card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm min-w-[800px]">
              <thead class="bg-paper border-b border-line">
                <tr>
                  <th class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Banco</th>
                  <th class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Producto</th>
                  <th class="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-ink-500">TEA %</th>
                  <th class="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-ink-500">TCEA %</th>
                  <th class="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-ink-500">Comisión</th>
                  <th class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Vigencia</th>
                  <th class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Ref.</th>
                  <th class="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-line/70">
                @for (t of tasas(); track t.id) {
                  @if (editando() === t.id) {
                    <tr class="bg-primary-50">
                      <td class="px-4 py-2 text-ink-700">{{ t.banco }}</td>
                      <td class="px-4 py-2 text-ink-600">{{ t.producto }}</td>
                      <td class="px-4 py-2">
                        <input [formControl]="form.controls.tea" type="number" step="0.01"
                          class="w-20 rounded-input border border-line px-2 py-1 text-right text-sm focus:border-primary-600 focus:outline-none" />
                      </td>
                      <td class="px-4 py-2">
                        <input [formControl]="form.controls.tcea" type="number" step="0.01"
                          class="w-20 rounded-input border border-line px-2 py-1 text-right text-sm focus:border-primary-600 focus:outline-none" />
                      </td>
                      <td class="px-4 py-2">
                        <input [formControl]="form.controls.comisionAdmin" type="number" step="0.01"
                          class="w-20 rounded-input border border-line px-2 py-1 text-right text-sm focus:border-primary-600 focus:outline-none" />
                      </td>
                      <td class="px-4 py-2">
                        <input [formControl]="form.controls.vigenciaDesde" type="date"
                          class="rounded-input border border-line px-2 py-1 text-sm focus:border-primary-600 focus:outline-none" />
                      </td>
                      <td class="px-4 py-2">
                        <input [formControl]="form.controls.esReferencial" type="checkbox"
                          class="rounded border-line text-primary-600" />
                      </td>
                      <td class="px-4 py-2">
                        <div class="flex gap-2">
                          <button type="button" (click)="guardar(t)" [disabled]="form.invalid || guardando()"
                            class="rounded-input bg-primary-700 px-3 py-1 text-xs font-medium text-white hover:bg-primary-800 disabled:opacity-50">Guardar</button>
                          <button type="button" (click)="editando.set(null)"
                            class="rounded-input border border-line px-3 py-1 text-xs text-ink-600 hover:bg-paper">Cancelar</button>
                        </div>
                      </td>
                    </tr>
                  } @else {
                    <tr class="hover:bg-paper">
                      <td class="px-4 py-2.5 font-medium text-ink-900">{{ t.banco }}</td>
                      <td class="px-4 py-2.5 text-ink-600">{{ t.producto }}</td>
                      <td class="monto px-4 py-2.5 text-right text-ink-900">{{ t.tea | number:'1.2-2' }}%</td>
                      <td class="monto px-4 py-2.5 text-right font-semibold text-ink-900">{{ t.tcea | number:'1.2-2' }}%</td>
                      <td class="monto px-4 py-2.5 text-right text-ink-600">{{ t.comisionAdmin ? (t.comisionAdmin | number:'1.2-2') : '—' }}</td>
                      <td class="px-4 py-2.5 text-ink-500">{{ t.vigenciaDesde | slice:0:10 }}</td>
                      <td class="px-4 py-2.5 text-center text-ink-500">{{ t.esReferencial ? '*' : '' }}</td>
                      <td class="px-4 py-2.5">
                        <button type="button" (click)="iniciarEdicion(t)"
                          class="rounded-input border border-line px-3 py-1 text-xs text-ink-600 hover:bg-paper">Editar</button>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
})
export class AdminTasasComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly fb  = inject(FormBuilder);

  readonly tasas    = signal<Tasa[]>([]);
  readonly cargando = signal(true);
  readonly editando = signal<number | null>(null);
  readonly guardando = signal(false);
  readonly error    = signal('');
  readonly ok       = signal('');

  readonly form = this.fb.group({
    tea:           [0, [Validators.required, Validators.min(0)]],
    tcea:          [0, [Validators.required, Validators.min(0)]],
    comisionAdmin: [null as number | null],
    vigenciaDesde: ['', Validators.required],
    fuente:        [''],
    esReferencial: [false],
  });

  ngOnInit() {
    this.api.get<Tasa[]>('/tasas').subscribe({
      next: (t) => { this.tasas.set(t); this.cargando.set(false); },
      error: () => { this.error.set('Error al cargar tasas.'); this.cargando.set(false); },
    });
  }

  iniciarEdicion(t: Tasa) {
    this.editando.set(t.id); this.ok.set(''); this.error.set('');
    this.form.setValue({ tea: t.tea, tcea: t.tcea, comisionAdmin: t.comisionAdmin ?? null, vigenciaDesde: t.vigenciaDesde.slice(0, 10), fuente: t.fuente, esReferencial: t.esReferencial });
  }

  guardar(t: Tasa) {
    if (this.form.invalid) return;
    this.guardando.set(true);
    const v = this.form.value;
    this.api.put(`/tasas/${t.id}`, { tea: v.tea, tcea: v.tcea, comisionAdmin: v.comisionAdmin, fuente: v.fuente ?? t.fuente, vigenciaDesde: v.vigenciaDesde, xmin: t.xmin }).subscribe({
      next: () => {
        this.tasas.update(list => list.map(x => x.id === t.id ? { ...x, tea: v.tea!, tcea: v.tcea!, comisionAdmin: v.comisionAdmin ?? null, vigenciaDesde: v.vigenciaDesde!, esReferencial: v.esReferencial! } : x));
        this.editando.set(null); this.guardando.set(false);
        this.ok.set('Tasa actualizada.'); setTimeout(() => this.ok.set(''), 4000);
      },
      error: (err) => { this.error.set(err?.error?.error ?? 'Error al guardar.'); this.guardando.set(false); },
    });
  }
}
