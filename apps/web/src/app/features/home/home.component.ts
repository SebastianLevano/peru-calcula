import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SeoService } from '../../core/seo.service';

interface Calculadora {
  slug:        string;
  titulo:      string;
  descripcion: string;
  modulo:      'laboral' | 'tributario' | 'finanzas';
  esNueva?:   boolean;
}

const CALCULADORAS: Calculadora[] = [
  // Laboral
  { slug: '/calculadora-cts',           titulo: 'Calculadora de CTS',           descripcion: 'Calcula tu CTS semestral según el D.Leg. 650.',                      modulo: 'laboral',    esNueva: true },
  { slug: '/calculadora-gratificacion', titulo: 'Calculadora de Gratificación',  descripcion: 'Gratificación de julio y diciembre (ordinaria + bonificación).',      modulo: 'laboral' },
  { slug: '/calculadora-vacaciones',    titulo: 'Calculadora de Vacaciones',     descripcion: 'Vacaciones ordinarias, truncas y pendientes.',                        modulo: 'laboral' },
  // Tributario
  { slug: '/calculadora-recibos-por-honorarios', titulo: 'Recibos por Honorarios', descripcion: 'Retención 4ta categoría y suspensión. Según art. 74 TUO LIR.', modulo: 'tributario', esNueva: true },
  { slug: '/calculadora-rus',           titulo: 'Calculadora NRUS',              descripcion: 'Cuota mensual para el Nuevo RUS (categorías 1 y 2).',                 modulo: 'tributario' },
  { slug: '/calculadora-rer',           titulo: 'Calculadora RER',               descripcion: 'Impuesto a la renta del Régimen Especial (1.5% ingresos netos).',     modulo: 'tributario' },
  { slug: '/calculadora-mype',          titulo: 'Calculadora RMT',               descripcion: 'Régimen MYPE Tributario: pagos a cuenta y renta anual.',              modulo: 'tributario' },
  // Finanzas
  { slug: '/simulador-credito-personal',    titulo: 'Simulador Crédito Personal',   descripcion: 'Cuota mensual y cronograma con sistema francés.',  modulo: 'finanzas', esNueva: true },
  { slug: '/calculadora-credito-vehicular', titulo: 'Crédito Vehicular',            descripcion: 'Simula tu financiamiento vehicular.',              modulo: 'finanzas' },
  { slug: '/calculadora-hipotecaria',       titulo: 'Crédito Hipotecario',          descripcion: 'Cuota y cronograma de tu crédito de vivienda.',    modulo: 'finanzas' },
  { slug: '/comparador-de-prestamos',       titulo: 'Comparador de Préstamos',      descripcion: 'Compara tasas y TCEA entre bancos.',               modulo: 'finanzas' },
];

const MODULO_COLOR: Record<string, string> = {
  laboral:    'bg-blue-50 text-blue-700 border-blue-200',
  tributario: 'bg-amber-50 text-amber-700 border-amber-200',
  finanzas:   'bg-green-50 text-green-700 border-green-200',
};
const MODULO_LABEL: Record<string, string> = { laboral: 'Laboral', tributario: 'Tributario', finanzas: 'Finanzas' };

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <main>
      <!-- Hero -->
      <section class="bg-gradient-to-br from-blue-700 to-blue-900 text-white py-20 px-4">
        <div class="max-w-4xl mx-auto text-center space-y-5">
          <h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight">Perú Calcula</h1>
          <p class="text-xl text-blue-100 max-w-2xl mx-auto">
            Calculadoras financieras, laborales y tributarias según normativa peruana.
            Gratis, sin registro, con fuente y fecha normativa.
          </p>
          <div class="flex flex-wrap justify-center gap-3 text-sm text-blue-200">
            <span>✓ Cálculos correctos y auditables</span>
            <span>✓ Fuente normativa visible</span>
            <span>✓ Sin publicidad intrusiva</span>
          </div>
        </div>
      </section>

      <!-- Calculadoras -->
      <section class="max-w-5xl mx-auto py-14 px-4 space-y-10">
        @for (modulo of modulos; track modulo) {
          <div>
            <h2 class="text-lg font-semibold text-gray-700 mb-4 uppercase tracking-wide">{{ MODULO_LABEL[modulo] }}</h2>
            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              @for (calc of byModulo(modulo); track calc.slug) {
                <a [routerLink]="calc.slug"
                   class="group relative bg-white rounded-xl border border-gray-200 p-5 shadow-sm
                          hover:border-blue-400 hover:shadow-md transition-all focus:outline-none
                          focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  @if (calc.esNueva) {
                    <span class="absolute top-3 right-3 text-xs font-medium px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">MVP</span>
                  }
                  <span class="inline-block text-xs font-medium px-2 py-0.5 rounded-full border mb-3 {{ MODULO_COLOR[calc.modulo] }}">
                    {{ MODULO_LABEL[calc.modulo] }}
                  </span>
                  <h3 class="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{{ calc.titulo }}</h3>
                  <p class="mt-1 text-sm text-gray-500 line-clamp-2">{{ calc.descripcion }}</p>
                </a>
              }
            </div>
          </div>
        }
      </section>
    </main>
  `,
})
export class HomeComponent implements OnInit {
  private readonly seo = inject(SeoService);

  readonly MODULO_LABEL = MODULO_LABEL;
  readonly MODULO_COLOR = MODULO_COLOR;
  readonly modulos = ['laboral', 'tributario', 'finanzas'] as const;

  ngOnInit() {
    this.seo.set({
      title: 'Calculadoras Financieras, Laborales y Tributarias para Perú',
      description: 'Calcula tu CTS, gratificación, recibos por honorarios, NRUS, créditos y más. Según normativa peruana, gratis y sin registro.',
    });
  }

  byModulo(modulo: string) {
    return CALCULADORAS.filter(c => c.modulo === modulo);
  }
}
