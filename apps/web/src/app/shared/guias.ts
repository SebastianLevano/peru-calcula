/**
 * Catálogo estático de guías publicadas (metadatos SEO: slug, título, módulo).
 * El CUERPO de cada guía vive en la DB; aquí solo guardamos lo necesario para el
 * enlazado interno (footer, "guías relacionadas", CTA desde calculadora) de modo
 * que los links se rendericen siempre — también en prerender, sin depender del API.
 * Mantener sincronizado con SeedGuias.cs.
 */
import type { Modulo } from './calculadoras';

export interface GuiaRef {
  slug: string;
  titulo: string;
  modulo: Modulo;
  destacada?: boolean; // aparece en el footer-sitemap
}

export const GUIAS: GuiaRef[] = [
  { slug: 'como-calcular-cts-peru',                  titulo: '¿Cómo calcular tu CTS? Guía completa',                                  modulo: 'laboral',    destacada: true },
  { slug: 'gratificacion-julio-diciembre-peru',      titulo: 'Gratificación de julio y diciembre: guía completa',                     modulo: 'laboral',    destacada: true },
  { slug: 'vacaciones-ordinarias-truncas-peru',      titulo: 'Vacaciones en Perú: ordinarias, truncas y pendientes',                  modulo: 'laboral' },
  { slug: 'recibos-honorarios-retencion-suspension', titulo: 'Recibos por honorarios: retención y suspensión de cuarta categoría',     modulo: 'tributario', destacada: true },
  { slug: 'nuevo-rus-categorias-cuotas',             titulo: 'Nuevo RUS: categorías, cuotas y quién puede acogerse',                   modulo: 'tributario' },
  { slug: 'regimen-especial-renta-rer',              titulo: 'Régimen Especial de Renta (RER): quiénes pueden acogerse y cuánto pagan', modulo: 'tributario' },
  { slug: 'regimen-mype-tributario-rmt',             titulo: 'Régimen MYPE Tributario (RMT): pagos a cuenta y renta anual',            modulo: 'tributario' },
  { slug: 'tcea-que-es-como-calcular',               titulo: '¿Qué es la TCEA y cómo compararla entre bancos?',                       modulo: 'finanzas',   destacada: true },
];

export const guiaPorSlug = (slug: string): GuiaRef | undefined =>
  GUIAS.find(g => g.slug === slug);

export const guiasDestacadas = (): GuiaRef[] => GUIAS.filter(g => g.destacada);

/** Hasta `n` guías del mismo módulo, excluyendo la actual; rellena con otras si faltan. */
export const guiasRelacionadas = (slug: string, n = 2): GuiaRef[] => {
  const actual = guiaPorSlug(slug);
  const mismoModulo = GUIAS.filter(g => g.slug !== slug && (!actual || g.modulo === actual.modulo));
  const resto       = GUIAS.filter(g => g.slug !== slug && !mismoModulo.includes(g));
  return [...mismoModulo, ...resto].slice(0, n);
};
