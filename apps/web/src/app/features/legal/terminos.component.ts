import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SeoService } from '../../core/seo.service';

@Component({
  selector: 'app-terminos',
  standalone: true,
  imports: [RouterModule],
  template: `
    <main class="mx-auto max-w-3xl px-4 py-10">
      <nav class="mb-6 text-sm text-ink-500">
        <a routerLink="/" class="hover:text-primary-700">Inicio</a>
        <span class="mx-2" aria-hidden="true">/</span>
        <span class="text-ink-700" aria-current="page">Términos de uso</span>
      </nav>
      <article class="prose prose-stone max-w-none prose-headings:font-display prose-headings:text-ink-900 prose-a:text-primary-700">
        <h1>Términos de uso</h1>
        <p class="text-sm text-ink-500">Última actualización: junio de 2026</p>

        <h2>1. Naturaleza del servicio</h2>
        <p>Perú Calcula ofrece calculadoras laborales, tributarias y financieras con fines informativos y referenciales. Los resultados se basan en la normativa peruana vigente a la fecha indicada en cada cálculo.</p>

        <h2>2. No constituye asesoría profesional</h2>
        <p><strong>Los resultados de las calculadoras son referenciales y no constituyen asesoría legal, tributaria, contable ni financiera.</strong> Para decisiones de negocio o laborales con efectos legales, consulta a un profesional habilitado.</p>

        <h2>3. Exactitud y actualización</h2>
        <p>Nos esforzamos por mantener los parámetros (UIT, RMV, tasas) actualizados. Sin embargo, no garantizamos que el resultado sea exacto en todos los casos particulares, especialmente ante cambios normativos recientes o situaciones atípicas.</p>

        <h2>4. Uso permitido</h2>
        <p>El uso es libre para personas naturales y jurídicas. No está permitido reproducir o redistribuir el contenido de forma sistemática, hacer scraping automatizado, ni incorporar las calculadoras en otros servicios sin autorización escrita.</p>

        <h2>5. Limitación de responsabilidad</h2>
        <p>Perú Calcula no se responsabiliza por daños directos o indirectos derivados del uso de los resultados.</p>
      </article>
    </main>
  `,
})
export class TerminosComponent implements OnInit {
  private readonly seo = inject(SeoService);
  ngOnInit() {
    this.seo.set({ title: 'Términos de uso', description: 'Términos y condiciones de uso de las calculadoras de Perú Calcula.', canonical: '/terminos' });
  }
}
