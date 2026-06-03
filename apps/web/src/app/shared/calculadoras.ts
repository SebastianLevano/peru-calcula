/**
 * Catálogo único de calculadoras. Fuente de verdad para home, nav del header,
 * footer-sitemap y enlazado interno (SEO). Mantener sincronizado con app.routes.ts.
 */
export type Modulo = 'laboral' | 'tributario' | 'finanzas';

export interface Calculadora {
  slug: string;        // ruta absoluta, p.ej. '/calculadora-cts'
  titulo: string;
  nav: string;         // etiqueta corta para menús
  descripcion: string;
  modulo: Modulo;
  esNueva?: boolean;
}

export const MODULOS: { id: Modulo; label: string }[] = [
  { id: 'laboral',    label: 'Laboral' },
  { id: 'tributario', label: 'Tributario' },
  { id: 'finanzas',   label: 'Finanzas' },
];

export const MODULO_LABEL: Record<Modulo, string> = {
  laboral: 'Laboral', tributario: 'Tributario', finanzas: 'Finanzas',
};

export const CALCULADORAS: Calculadora[] = [
  // Laboral
  { slug: '/calculadora-cts',           nav: 'CTS',            titulo: 'Calculadora de CTS',            descripcion: 'Compensación por Tiempo de Servicios semestral según el D. Leg. 650.', modulo: 'laboral', esNueva: true },
  { slug: '/calculadora-gratificacion', nav: 'Gratificación',  titulo: 'Calculadora de Gratificación',  descripcion: 'Gratificación de julio y diciembre, con bonificación extraordinaria.', modulo: 'laboral' },
  { slug: '/calculadora-vacaciones',    nav: 'Vacaciones',     titulo: 'Calculadora de Vacaciones',     descripcion: 'Vacaciones ordinarias, truncas y pendientes.', modulo: 'laboral' },
  // Tributario
  { slug: '/calculadora-recibos-por-honorarios', nav: 'Recibos por Honorarios', titulo: 'Recibos por Honorarios', descripcion: 'Retención de 4.ª categoría y suspensión, según el art. 74 del TUO de la LIR.', modulo: 'tributario', esNueva: true },
  { slug: '/calculadora-rus',  nav: 'NRUS', titulo: 'Calculadora NRUS', descripcion: 'Cuota mensual del Nuevo RUS (categorías 1 y 2).', modulo: 'tributario' },
  { slug: '/calculadora-rer',  nav: 'RER',  titulo: 'Calculadora RER',  descripcion: 'Renta del Régimen Especial: 1.5% de los ingresos netos.', modulo: 'tributario' },
  { slug: '/calculadora-mype', nav: 'RMT',  titulo: 'Calculadora RMT',  descripcion: 'Régimen MYPE Tributario: pagos a cuenta y renta anual.', modulo: 'tributario' },
  // Finanzas
  { slug: '/simulador-credito-personal',    nav: 'Crédito Personal',   titulo: 'Simulador de Crédito Personal',  descripcion: 'Cuota mensual y cronograma con el sistema francés.', modulo: 'finanzas', esNueva: true },
  { slug: '/calculadora-credito-vehicular', nav: 'Crédito Vehicular',  titulo: 'Crédito Vehicular',              descripcion: 'Simula el financiamiento de tu vehículo.', modulo: 'finanzas' },
  { slug: '/calculadora-hipotecaria',       nav: 'Crédito Hipotecario', titulo: 'Crédito Hipotecario',           descripcion: 'Cuota y cronograma de tu crédito de vivienda.', modulo: 'finanzas' },
  { slug: '/comparador-de-prestamos',       nav: 'Comparador',          titulo: 'Comparador de Préstamos',        descripcion: 'Compara tasas y TCEA entre bancos.', modulo: 'finanzas' },
];

export const porModulo = (m: Modulo): Calculadora[] => CALCULADORAS.filter(c => c.modulo === m);
