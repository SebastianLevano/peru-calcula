import { Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AdminApiService } from '../admin-api.service';
import { ApiClientService } from '../../../core/api-client.service';

interface Guia { id: number; slug: string; titulo: string; resumen: string; estado: string; actualizadoEn: string; }

@Component({
  selector: 'app-admin-guias',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe],
  template: `
    <div class="px-6 py-6 space-y-5">
      <div class="flex items-center justify-between">
        <h1 class="text-lg font-semibold text-ink-900">Guías</h1>
        <button type="button" (click)="abrirNueva()"
          class="rounded-input bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800">
          + Nueva guía
        </button>
      </div>

      @if (error()) { <div class="rounded-card border border-error-600/25 bg-error-50 p-4 text-sm text-error-700">{{ error() }}</div> }
      @if (ok())    { <div class="rounded-card border border-ok-600/25 bg-ok-50 p-4 text-sm text-ok-600">{{ ok() }}</div> }

      <!-- Formulario nuevo/editar -->
      @if (formVisible()) {
        <form [formGroup]="form" (ngSubmit)="guardar()" class="rounded-card border border-line bg-surface p-5 shadow-card space-y-4">
          <h2 class="text-sm font-semibold text-ink-900">{{ editandoId() ? 'Editar guía' : 'Nueva guía' }}</h2>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1 col-span-2 md:col-span-1">
              <label class="block text-xs font-medium text-ink-700">Título *</label>
              <input formControlName="titulo" type="text"
                class="w-full rounded-input border border-line px-3 py-2 text-sm focus:border-primary-600 focus:outline-none" />
            </div>
            <div class="space-y-1 col-span-2 md:col-span-1">
              <label class="block text-xs font-medium text-ink-700">Slug (auto si vacío)</label>
              <input formControlName="slug" type="text"
                class="w-full rounded-input border border-line px-3 py-2 text-sm focus:border-primary-600 focus:outline-none" placeholder="como-calcular-cts" />
            </div>
            <div class="space-y-1 col-span-2">
              <label class="block text-xs font-medium text-ink-700">Resumen *</label>
              <input formControlName="resumen" type="text"
                class="w-full rounded-input border border-line px-3 py-2 text-sm focus:border-primary-600 focus:outline-none" />
            </div>
            <div class="space-y-1 col-span-2 md:col-span-1">
              <label class="block text-xs font-medium text-ink-700">Calculadora relacionada</label>
              <input formControlName="calculadoraRelacionada" type="text"
                class="w-full rounded-input border border-line px-3 py-2 text-sm focus:border-primary-600 focus:outline-none" placeholder="CTS" />
            </div>
            <div class="space-y-1 col-span-2 md:col-span-1">
              <label class="block text-xs font-medium text-ink-700">Estado</label>
              <select formControlName="estado"
                class="w-full rounded-input border border-line bg-surface px-3 py-2 text-sm focus:border-primary-600 focus:outline-none">
                <option value="borrador">Borrador</option>
                <option value="publicado">Publicado</option>
              </select>
            </div>
            <div class="space-y-1 col-span-2">
              <label class="block text-xs font-medium text-ink-700">Contenido (Markdown) *</label>
              <textarea formControlName="cuerpoMarkdown" rows="12"
                class="w-full rounded-input border border-line px-3 py-2 text-sm font-mono focus:border-primary-600 focus:outline-none resize-y">
              </textarea>
            </div>
          </div>
          <div class="flex gap-3">
            <button type="submit" [disabled]="form.invalid || guardando()"
              class="rounded-input bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800 disabled:opacity-50">
              {{ guardando() ? 'Guardando…' : (editandoId() ? 'Actualizar' : 'Crear') }}
            </button>
            <button type="button" (click)="cerrarForm()"
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
                <th class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Título</th>
                <th class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Slug</th>
                <th class="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-ink-500">Estado</th>
                <th class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Actualizado</th>
                <th class="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line/70">
              @for (g of guias(); track g.id) {
                <tr class="hover:bg-paper">
                  <td class="px-4 py-2.5 font-medium text-ink-900">{{ g.titulo }}</td>
                  <td class="px-4 py-2.5 font-mono text-xs text-ink-500">{{ g.slug }}</td>
                  <td class="px-4 py-2.5 text-center">
                    <span class="rounded-pill px-2 py-0.5 text-xs font-medium"
                          [class]="g.estado === 'publicado' ? 'bg-ok-50 text-ok-600' : 'bg-paper text-ink-500 border border-line'">
                      {{ g.estado }}
                    </span>
                  </td>
                  <td class="px-4 py-2.5 text-ink-500">{{ g.actualizadoEn | date:'dd/MM/yyyy' }}</td>
                  <td class="px-4 py-2.5">
                    <div class="flex gap-2">
                      <button type="button" (click)="editarGuia(g)"
                        class="rounded-input border border-line px-3 py-1 text-xs text-ink-600 hover:bg-paper">Editar</button>
                      <button type="button" (click)="archivar(g)"
                        class="rounded-input border border-error-600/30 px-3 py-1 text-xs text-error-600 hover:bg-error-50">Archivar</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class AdminGuiasComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  private readonly pubApi   = inject(ApiClientService);   // para leer guías (endpoint público)
  private readonly fb       = inject(FormBuilder);

  readonly guias      = signal<Guia[]>([]);
  readonly cargando   = signal(true);
  readonly formVisible = signal(false);
  readonly editandoId  = signal<number | null>(null);
  readonly guardando   = signal(false);
  readonly error       = signal('');
  readonly ok          = signal('');

  readonly form = this.fb.group({
    titulo:                ['', Validators.required],
    slug:                  [''],
    resumen:               ['', Validators.required],
    cuerpoMarkdown:        ['', Validators.required],
    calculadoraRelacionada:[''],
    estado:                ['borrador'],
    metaTitle:             [''],
    metaDescription:       [''],
  });

  ngOnInit() { this.cargar(); }

  cargar() {
    this.cargando.set(true);
    this.adminApi.get<Guia[]>('/guias').subscribe({
      next: (g) => { this.guias.set(g); this.cargando.set(false); },
      error: () => { this.error.set('Error al cargar guías.'); this.cargando.set(false); },
    });
  }

  abrirNueva() {
    this.editandoId.set(null);
    this.form.reset({ estado: 'borrador' });
    this.formVisible.set(true);
    this.ok.set(''); this.error.set('');
  }

  editarGuia(g: Guia) {
    this.editandoId.set(g.id);
    this.formVisible.set(true);
    this.ok.set(''); this.error.set('');
    // Cargar el markdown completo (endpoint público, único que devuelve cuerpoMarkdown por slug)
    this.pubApi.get<any>(`/guias/${g.slug}`).subscribe({
      next: (d) => this.form.patchValue({
        titulo: d.titulo, slug: d.slug, resumen: d.resumen,
        cuerpoMarkdown: d.cuerpoMarkdown, calculadoraRelacionada: d.calculadoraRelacionada ?? '',
        estado: d.estado ?? 'borrador', metaTitle: d.metaTitle ?? '', metaDescription: d.metaDescription ?? '',
      }),
    });
  }

  guardar() {
    if (this.form.invalid) return;
    this.guardando.set(true);
    const v = this.form.value;
    const id = this.editandoId();
    const req = id
      ? this.adminApi.put(`/guias/${id}`, v)
      : this.adminApi.post('/guias', v);

    req.subscribe({
      next: () => {
        this.guardando.set(false); this.formVisible.set(false);
        this.ok.set(id ? 'Guía actualizada.' : 'Guía creada.');
        setTimeout(() => this.ok.set(''), 4000);
        this.cargar();
      },
      error: (err) => { this.error.set(err?.error?.error ?? 'Error al guardar.'); this.guardando.set(false); },
    });
  }

  archivar(g: Guia) {
    if (!confirm(`¿Archivar "${g.titulo}"?`)) return;
    this.adminApi.delete(`/guias/${g.id}`).subscribe({
      next: () => { this.ok.set(`"${g.titulo}" archivada.`); setTimeout(() => this.ok.set(''), 3000); this.cargar(); },
      error: () => this.error.set('Error al archivar.'),
    });
  }

  cerrarForm() { this.formVisible.set(false); this.editandoId.set(null); }
}
