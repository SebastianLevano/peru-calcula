import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BadgeComponent } from '../components/badge.component';
import { type Modulo, MODULO_LABEL } from '../calculadoras';

const MODULO_ICON_BG: Record<Modulo, string> = {
  laboral:    'bg-primary-100 text-primary-700',
  tributario: 'bg-accent-50 text-accent-600',
  finanzas:   'bg-ink-900/[0.06] text-ink-700',
};

const MODULO_SECTION_BG: Record<Modulo, string> = {
  laboral:    'from-primary-50',
  tributario: 'from-accent-50',
  finanzas:   'from-paper',
};

/**
 * Cabecera profesional de calculadora: botón de retroceso, ícono de módulo,
 * título H1 display, descripción y badge de categoría.
 */
@Component({
  selector: 'app-calc-page-header',
  standalone: true,
  imports: [RouterModule, BadgeComponent],
  template: `
    <section class="border-b border-line bg-gradient-to-br to-surface" [class]="gradFrom">
      <div class="mx-auto px-4 pb-8 pt-5" [class]="'max-w-' + maxWidth">

        <!-- Botón de retroceso -->
        <a routerLink="/"
           class="group mb-6 inline-flex items-center gap-1.5 rounded-input px-2 py-1
                  text-sm font-medium text-ink-500 hover:text-primary-700
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600">
          <svg class="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
               fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/>
          </svg>
          Volver al inicio
        </a>

        <!-- Cuerpo del header: ícono + texto -->
        <div class="flex items-start gap-4">
          <!-- Ícono de módulo en círculo/cuadro -->
          <div class="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-card shadow-card" [class]="iconoBg">
            @switch (modulo) {
              @case ('laboral') {
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2m4 6v3m-2-1.5h4"/>
                </svg>
              }
              @case ('tributario') {
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/>
                </svg>
              }
              @case ('finanzas') {
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"/>
                </svg>
              }
            }
          </div>

          <div class="min-w-0 flex-1">
            <div class="mb-2">
              <app-badge [tone]="modulo">{{ MODULO_LABEL[modulo] }}</app-badge>
            </div>
            <h1 class="font-display text-2xl font-semibold leading-snug text-ink-900 sm:text-3xl">{{ titulo }}</h1>
            <p class="mt-2 max-w-prose text-sm leading-relaxed text-ink-600">{{ descripcion }}</p>
          </div>
        </div>

      </div>
    </section>
  `,
})
export class CalcPageHeaderComponent {
  @Input({ required: true }) titulo!: string;
  @Input({ required: true }) descripcion!: string;
  @Input({ required: true }) modulo!: Modulo;
  @Input() maxWidth = '2xl';

  readonly MODULO_LABEL = MODULO_LABEL;

  get iconoBg(): string  { return MODULO_ICON_BG[this.modulo]; }
  get gradFrom(): string { return MODULO_SECTION_BG[this.modulo]; }
}
