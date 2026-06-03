import { Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AdminApiService } from '../admin-api.service';

interface Banco { id: number; nombre: string; slug: string; logoUrl: string | null; sitioUrl: string | null; urlAfiliado: string | null; esPatrocinado: boolean; activo: boolean; orden: number; productos: number; }
interface Producto { id: number; nombre: string; tipo: string; moneda: string; activo: boolean; tasaVigente: { id: number; tea: number; tcea: number; vigenciaDesde: string } | null; }

@Component({
  selector: 'app-admin-bancos',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="px-6 py-6 space-y-5">
      <div class="flex items-center justify-between">
        <h1 class="text-lg font-semibold text-ink-900">Bancos</h1>
        <button type="button" (click)="mostrarNuevo.set(!mostrarNuevo())"
          class="rounded-input bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800">
          + Nuevo banco
        </button>
      </div>

      @if (error()) { <div class="rounded-card border border-error-600/25 bg-error-50 p-4 text-sm text-error-700">{{ error() }}</div> }
      @if (ok())    { <div class="rounded-card border border-ok-600/25 bg-ok-50 p-4 text-sm text-ok-600">{{ ok() }}</div> }

      @if (mostrarNuevo()) {
        <form [formGroup]="formNuevo" (ngSubmit)="crearBanco()" class="rounded-card border border-line bg-surface p-5 shadow-card space-y-4">
          <h2 class="text-sm font-semibold text-ink-900">Nuevo banco</h2>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="block text-xs font-medium text-ink-700">Nombre *</label>
              <input formControlName="nombre" type="text" class="w-full rounded-input border border-line bg-surface px-3 py-2 text-sm text-ink-900 focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600/20" />
            </div>
            <div class="space-y-1">
              <label class="block text-xs font-medium text-ink-700">Slug *</label>
              <input formControlName="slug" type="text" class="w-full rounded-input border border-line bg-surface px-3 py-2 text-sm text-ink-900 focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600/20" placeholder="bcp" />
            </div>
            <div class="space-y-1">
              <label class="block text-xs font-medium text-ink-700">URL afiliado</label>
              <input formControlName="urlAfiliado" type="text" class="w-full rounded-input border border-line bg-surface px-3 py-2 text-sm text-ink-900 focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600/20" />
            </div>
            <div class="space-y-1">
              <label class="block text-xs font-medium text-ink-700">Sitio web</label>
              <input formControlName="sitioUrl" type="text" class="w-full rounded-input border border-line bg-surface px-3 py-2 text-sm text-ink-900 focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600/20" />
            </div>
            <div class="space-y-1">
              <label class="block text-xs font-medium text-ink-700">Orden</label>
              <input formControlName="orden" type="number" class="w-full rounded-input border border-line bg-surface px-3 py-2 text-sm text-ink-900 focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600/20" />
            </div>
            <div class="flex items-center gap-2 pt-5">
              <input formControlName="esPatrocinado" type="checkbox" id="patrocinado" class="rounded border-line text-primary-600" />
              <label for="patrocinado" class="text-sm text-ink-700">Patrocinado</label>
            </div>
          </div>
          <div class="flex gap-3">
            <button type="submit" [disabled]="formNuevo.invalid || guardando()"
              class="rounded-input bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800 disabled:opacity-50">Crear</button>
            <button type="button" (click)="mostrarNuevo.set(false)"
              class="rounded-input border border-line px-4 py-2 text-sm text-ink-600 hover:bg-paper">Cancelar</button>
          </div>
        </form>
      }

      @if (cargando()) {
        <p class="text-sm text-ink-500">Cargando…</p>
      } @else {
        <div class="rounded-card border border-line bg-surface shadow-card overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-paper border-b border-line">
              <tr>
                <th class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Banco</th>
                <th class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">URL Afiliado</th>
                <th class="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-ink-500">Patrocinado</th>
                <th class="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-ink-500">Activo</th>
                <th class="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-ink-500">Productos</th>
                <th class="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line/70">
              @for (b of bancos(); track b.id) {
                <tr class="hover:bg-paper" [class.opacity-50]="!b.activo">
                  <td class="px-4 py-2.5">
                    <p class="font-medium text-ink-900">{{ b.nombre }}</p>
                    <p class="text-xs text-ink-500">{{ b.slug }}</p>
                  </td>
                  <td class="px-4 py-2.5 max-w-xs truncate text-xs text-ink-500">{{ b.urlAfiliado || '—' }}</td>
                  <td class="px-4 py-2.5 text-center">{{ b.esPatrocinado ? '★' : '' }}</td>
                  <td class="px-4 py-2.5 text-center">
                    <span [class]="b.activo ? 'text-ok-600' : 'text-error-600'">{{ b.activo ? '✓' : '✗' }}</span>
                  </td>
                  <td class="monto px-4 py-2.5 text-right text-ink-600">{{ b.productos }}</td>
                  <td class="px-4 py-2.5">
                    <div class="flex gap-2">
                      <button type="button" (click)="editarBanco(b)"
                        class="rounded-input border border-line px-3 py-1 text-xs text-ink-600 hover:bg-paper">Editar</button>
                      <button type="button" (click)="seleccionarBanco(b)"
                        class="rounded-input border border-primary-200 px-3 py-1 text-xs text-primary-700 hover:bg-primary-50">Productos</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Productos del banco seleccionado -->
        @if (bancoSeleccionado()) {
          <div class="rounded-card border border-line bg-surface shadow-card overflow-hidden">
            <div class="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 class="text-sm font-semibold text-ink-900">Productos de {{ bancoSeleccionado()!.nombre }}</h2>
              <button type="button" (click)="bancoSeleccionado.set(null)"
                class="text-xs text-ink-500 hover:text-ink-900">✕ Cerrar</button>
            </div>
            @if (productosLoading()) { <p class="px-4 py-3 text-sm text-ink-500">Cargando…</p> }
            @else {
              <table class="w-full text-sm">
                <thead class="bg-paper border-b border-line">
                  <tr>
                    <th class="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Nombre</th>
                    <th class="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Tipo</th>
                    <th class="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-ink-500">TEA vigente</th>
                    <th class="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-ink-500">TCEA</th>
                    <th class="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-ink-500">Activo</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-line/70">
                  @for (p of productos(); track p.id) {
                    <tr class="hover:bg-paper" [class.opacity-50]="!p.activo">
                      <td class="px-4 py-2.5 font-medium text-ink-900">{{ p.nombre }}</td>
                      <td class="px-4 py-2.5 text-ink-600">{{ p.tipo }}</td>
                      <td class="monto px-4 py-2.5 text-right text-ink-900">{{ p.tasaVigente ? p.tasaVigente.tea + '%' : '—' }}</td>
                      <td class="monto px-4 py-2.5 text-right text-ink-900">{{ p.tasaVigente ? p.tasaVigente.tcea + '%' : '—' }}</td>
                      <td class="px-4 py-2.5 text-center"><span [class]="p.activo ? 'text-ok-600' : 'text-error-600'">{{ p.activo ? '✓' : '✗' }}</span></td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        }
      }
    </div>
  `,
})
export class AdminBancosComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly fb  = inject(FormBuilder);

  readonly bancos            = signal<Banco[]>([]);
  readonly productos         = signal<Producto[]>([]);
  readonly bancoSeleccionado = signal<Banco | null>(null);
  readonly cargando          = signal(true);
  readonly productosLoading  = signal(false);
  readonly guardando         = signal(false);
  readonly mostrarNuevo      = signal(false);
  readonly error             = signal('');
  readonly ok                = signal('');

  readonly formNuevo = this.fb.group({
    nombre:       ['', Validators.required],
    slug:         ['', Validators.required],
    urlAfiliado:  [''],
    sitioUrl:     [''],
    logoUrl:      [''],
    esPatrocinado:[false],
    orden:        [99],
  });

  ngOnInit() {
    this.api.get<Banco[]>('/bancos').subscribe({
      next: (b) => { this.bancos.set(b); this.cargando.set(false); },
      error: () => { this.error.set('Error al cargar bancos.'); this.cargando.set(false); },
    });
  }

  seleccionarBanco(b: Banco) {
    this.bancoSeleccionado.set(b);
    this.productosLoading.set(true);
    this.api.get<Producto[]>(`/bancos/${b.id}/productos`).subscribe({
      next: (p) => { this.productos.set(p); this.productosLoading.set(false); },
      error: () => { this.productosLoading.set(false); },
    });
  }

  editarBanco(b: Banco) {
    // Edición en línea simplificada: toggle activo
    this.api.put(`/bancos/${b.id}`, { ...b, activo: !b.activo }).subscribe({
      next: () => {
        this.bancos.update(list => list.map(x => x.id === b.id ? { ...x, activo: !x.activo } : x));
        this.ok.set(`Banco "${b.nombre}" ${!b.activo ? 'activado' : 'desactivado'}.`);
        setTimeout(() => this.ok.set(''), 3000);
      },
      error: () => this.error.set('Error al actualizar banco.'),
    });
  }

  crearBanco() {
    if (this.formNuevo.invalid) return;
    this.guardando.set(true);
    const v = this.formNuevo.value;
    this.api.post<{ id: number; nombre: string }>('/bancos', v).subscribe({
      next: (r) => {
        this.mostrarNuevo.set(false);
        this.guardando.set(false);
        this.formNuevo.reset({ esPatrocinado: false, orden: 99 });
        this.ok.set(`Banco "${r.nombre}" creado.`);
        setTimeout(() => this.ok.set(''), 4000);
        // Recargar lista
        this.api.get<Banco[]>('/bancos').subscribe(b => this.bancos.set(b));
      },
      error: (err) => { this.error.set(err?.error?.error ?? 'Error al crear banco.'); this.guardando.set(false); },
    });
  }
}
