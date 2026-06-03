import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SeoService } from '../../core/seo.service';

@Component({
  selector: 'app-acerca',
  standalone: true,
  imports: [RouterModule],
  template: `
    <main class="mx-auto max-w-3xl px-4 py-10">
      <nav class="mb-6 text-sm text-ink-500">
        <a routerLink="/" class="hover:text-primary-700">Inicio</a>
        <span class="mx-2" aria-hidden="true">/</span>
        <span class="text-ink-700" aria-current="page">Acerca de Perú Calcula</span>
      </nav>
      <article class="prose prose-stone max-w-none prose-headings:font-display prose-headings:text-ink-900 prose-a:text-primary-700">
        <h1>Acerca de Perú Calcula</h1>

        <p>Perú Calcula es una plataforma de calculadoras laborales, tributarias y financieras diseñada para trabajadores, independientes y microempresas peruanas.</p>

        <h2>¿Por qué existe?</h2>
        <p>La mayoría de calculadoras disponibles en internet son genéricas, están desactualizadas o no muestran de dónde provienen los números. Perú Calcula nació para resolverlo: cada resultado incluye la norma que lo sustenta, la versión de parámetros utilizada y la fecha de actualización.</p>

        <h2>¿Cómo funciona?</h2>
        <p>Los cálculos se realizan en un backend con las fórmulas y parámetros normativos (UIT, RMV, tasas) actualizados periódicamente. El resultado incluye un desglose y una ficha de auditoría con la fuente normativa.</p>

        <h2>Contacto</h2>
        <p>Para sugerencias, correcciones normativas o colaboraciones: <strong>contacto&#64;perucalcula.pe</strong></p>
      </article>
    </main>
  `,
})
export class AcercaComponent implements OnInit {
  private readonly seo = inject(SeoService);
  ngOnInit() {
    this.seo.set({ title: 'Acerca de Perú Calcula', description: 'Calculadoras laborales, tributarias y financieras para Perú, con fuente normativa visible.', canonical: '/acerca' });
  }
}
