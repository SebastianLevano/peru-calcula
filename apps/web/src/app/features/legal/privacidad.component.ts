import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SeoService } from '../../core/seo.service';

@Component({
  selector: 'app-privacidad',
  standalone: true,
  imports: [RouterModule],
  template: `
    <main class="mx-auto max-w-3xl px-4 py-10">
      <nav class="mb-6 text-sm text-ink-500" aria-label="Navegación de contenido">
        <a routerLink="/" class="hover:text-primary-700">Inicio</a>
        <span class="mx-2" aria-hidden="true">/</span>
        <span class="text-ink-700" aria-current="page">Política de privacidad</span>
      </nav>
      <article class="prose prose-stone max-w-none prose-headings:font-display prose-headings:text-ink-900 prose-a:text-primary-700">
        <h1>Política de privacidad</h1>
        <p class="text-sm text-ink-500">Última actualización: junio de 2026</p>

        <h2>1. Responsable del tratamiento</h2>
        <p>Perú Calcula (<code>perucalcula.pe</code>) es el responsable del tratamiento de los datos en el ámbito de la Ley 29733 (Ley de Protección de Datos Personales del Perú) y su reglamento.</p>

        <h2>2. Datos que recopilamos</h2>
        <p><strong>No recopilamos datos personales identificables.</strong> Los inputs de las calculadoras (sueldos, fechas, montos) no se almacenan ni se envían a ningún servidor; el cálculo se realiza en nuestro API y el resultado se devuelve sin asociarlo a ningún usuario.</p>
        <p>Nuestra analítica in-house recopila únicamente:</p>
        <ul>
          <li>Tipo de calculadora utilizada y si el cálculo fue completado.</li>
          <li>Categoría de dispositivo (móvil / desktop / tablet) — derivada del User-Agent, nunca almacenada en crudo.</li>
          <li>País de origen (nivel de país, sin IP ni geolocalización precisa).</li>
        </ul>

        <h2>3. Cookies y almacenamiento local</h2>
        <p>Usamos <code>localStorage</code> únicamente para recordar tu elección de consentimiento. No usamos cookies de seguimiento propias. Si aceptas, Google AdSense puede usar cookies de terceros según su política.</p>

        <h2>4. Publicidad (Google AdSense)</h2>
        <p>Si aceptas el consentimiento, se muestra publicidad de Google AdSense. Google puede usar cookies para personalizar anuncios según tu actividad en otros sitios. Puedes optar por salir en <a href="https://adssettings.google.com" rel="noopener noreferrer" target="_blank">adssettings.google.com</a>.</p>

        <h2>5. Tus derechos (Ley 29733)</h2>
        <p>Tienes derecho a acceder, rectificar, cancelar y oponerte al tratamiento de tus datos. Dado que no almacenamos datos personales identificables, estos derechos aplican principalmente a la analítica agregada. Contáctanos en <strong>contacto&#64;perucalcula.pe</strong>.</p>

        <h2>6. Cambios a esta política</h2>
        <p>Notificaremos cambios relevantes publicando una nueva versión en esta página con la fecha de actualización.</p>
      </article>
    </main>
  `,
})
export class PrivacidadComponent implements OnInit {
  private readonly seo = inject(SeoService);
  ngOnInit() {
    this.seo.set({ title: 'Política de privacidad', description: 'Política de privacidad de Perú Calcula conforme a la Ley 29733.', canonical: '/privacidad' });
  }
}
