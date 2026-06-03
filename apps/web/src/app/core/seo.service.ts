import { Injectable, inject, DOCUMENT, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';

export interface SeoData {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  jsonLd?: object | object[];
  /** Controla si se generan noindex/nofollow (p.ej. admin). */
  noindex?: boolean;
}

const SITE        = 'Perú Calcula';
const BASE_OG     = 'https://perucalcula.pe';
const DEFAULT_OG_IMAGE = `${BASE_OG}/og-image.png`;

const CALC_PREFIXES = ['/calculadora-', '/simulador-', '/comparador-'];

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title    = inject(Title);
  private readonly meta     = inject(Meta);
  private readonly doc      = inject(DOCUMENT);
  private readonly platform = inject(PLATFORM_ID);

  set(data: SeoData) {
    const fullTitle = `${data.title} | ${SITE}`;
    this.title.setTitle(fullTitle);

    // Robots
    if (data.noindex) {
      this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
    } else {
      this.meta.updateTag({ name: 'robots', content: 'index, follow' });
    }

    // Descripción y OG base
    this.meta.updateTag({ name: 'description',        content: data.description });
    this.meta.updateTag({ property: 'og:title',       content: fullTitle });
    this.meta.updateTag({ property: 'og:description', content: data.description });
    this.meta.updateTag({ property: 'og:site_name',   content: SITE });
    this.meta.updateTag({ property: 'og:type',        content: 'website' });
    this.meta.updateTag({ name: 'twitter:title',       content: fullTitle });
    this.meta.updateTag({ name: 'twitter:description', content: data.description });

    // OG image (usa default si no se especifica)
    const ogImg = data.ogImage ?? DEFAULT_OG_IMAGE;
    this.meta.updateTag({ property: 'og:image',        content: ogImg });
    this.meta.updateTag({ property: 'og:image:width',  content: '1200' });
    this.meta.updateTag({ property: 'og:image:height', content: '630' });
    this.meta.updateTag({ name: 'twitter:image',        content: ogImg });
    this.meta.updateTag({ name: 'twitter:card',         content: 'summary_large_image' });

    // Canonical y og:url
    if (data.canonical) {
      this.setCanonical(data.canonical);
      this.meta.updateTag({ property: 'og:url', content: `${BASE_OG}${data.canonical}` });
    }

    // JSON-LD: combina los explícitos con los auto-generados
    const autoLd = this.buildAutoJsonLd(data);
    const explicit = data.jsonLd
      ? (Array.isArray(data.jsonLd) ? data.jsonLd : [data.jsonLd])
      : [];
    const allLd = [...explicit, ...autoLd];

    if (allLd.length > 0) {
      this.setJsonLd(allLd);
    }
  }

  // ── Auto JSON-LD ─────────────────────────────────────────────────────────

  private buildAutoJsonLd(data: SeoData): object[] {
    const result: object[] = [];
    if (!data.canonical) return result;

    // BreadcrumbList automático para cualquier página con canonical
    const breadcrumb = this.buildBreadcrumb(data.canonical, data.title);
    if (breadcrumb) result.push(breadcrumb);

    // WebApplication para páginas de calculadora
    if (CALC_PREFIXES.some(p => data.canonical!.startsWith(p))) {
      result.push(this.buildWebApplication(data.title, data.description, data.canonical!));
    }

    return result;
  }

  private buildBreadcrumb(path: string, pageTitle: string): object | null {
    if (path === '/') return null;

    const items: object[] = [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_OG },
    ];

    if (path.startsWith('/guias/')) {
      items.push({ '@type': 'ListItem', position: 2, name: 'Guías', item: `${BASE_OG}/guias` });
      items.push({ '@type': 'ListItem', position: 3, name: pageTitle, item: `${BASE_OG}${path}` });
    } else {
      items.push({ '@type': 'ListItem', position: 2, name: pageTitle, item: `${BASE_OG}${path}` });
    }

    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items,
    };
  }

  private buildWebApplication(title: string, description: string, path: string): object {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: title,
      description,
      url: `${BASE_OG}${path}`,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      isAccessibleForFree: true,
      inLanguage: 'es-PE',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'PEN' },
      provider: {
        '@type': 'Organization',
        name: SITE,
        url: BASE_OG,
      },
    };
  }

  // ── Helpers privados ─────────────────────────────────────────────────────

  private setCanonical(path: string) {
    const href = `${BASE_OG}${path}`;
    let link = this.doc.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.rel = 'canonical';
      this.doc.head.appendChild(link);
    }
    link.href = href;
  }

  private setJsonLd(data: object[]) {
    if (isPlatformBrowser(this.platform)) {
      this.doc.querySelectorAll('script[data-seo="json-ld"]').forEach(s => s.remove());
    }
    data.forEach(item => {
      const script = this.doc.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo', 'json-ld');
      script.text = JSON.stringify(item);
      this.doc.head.appendChild(script);
    });
  }
}
