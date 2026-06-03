import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SeoService } from '../../core/seo.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterModule],
  template: `
    <main class="flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center">
      <p class="font-display text-8xl font-semibold text-primary-100">404</p>
      <h1 class="mt-4 font-display text-2xl font-semibold text-ink-900">Página no encontrada</h1>
      <p class="mt-3 max-w-sm text-sm text-ink-600">
        La página que buscas no existe o fue movida. Puedes volver al inicio o explorar nuestras calculadoras.
      </p>
      <div class="mt-8 flex gap-4">
        <a routerLink="/"
           class="rounded-input bg-primary-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800 transition-colors">
          Ir al inicio
        </a>
        <a routerLink="/guias"
           class="rounded-input border border-line px-5 py-2.5 text-sm font-medium text-ink-700 hover:bg-paper transition-colors">
          Ver guías
        </a>
      </div>
    </main>
  `,
})
export class NotFoundComponent implements OnInit {
  private readonly seo = inject(SeoService);
  ngOnInit() {
    this.seo.set({
      title: 'Página no encontrada',
      description: 'La página que buscas no existe en Perú Calcula.',
      noindex: true,
    });
  }
}
