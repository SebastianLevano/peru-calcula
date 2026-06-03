import { Injectable, inject, DOCUMENT, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';

export interface SeoData {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  jsonLd?: object | object[];
}

const SITE    = 'Perú Calcula';
const BASE_OG = 'https://perucalcula.pe';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title    = inject(Title);
  private readonly meta     = inject(Meta);
  private readonly doc      = inject(DOCUMENT);
  private readonly platform = inject(PLATFORM_ID);

  set(data: SeoData) {
    const fullTitle = `${data.title} | ${SITE}`;
    this.title.setTitle(fullTitle);

    this.meta.updateTag({ name: 'description',                    content: data.description });
    this.meta.updateTag({ property: 'og:title',                   content: fullTitle });
    this.meta.updateTag({ property: 'og:description',             content: data.description });
    this.meta.updateTag({ property: 'og:site_name',               content: SITE });
    this.meta.updateTag({ name: 'twitter:title',                   content: fullTitle });
    this.meta.updateTag({ name: 'twitter:description',             content: data.description });

    if (data.ogImage) {
      this.meta.updateTag({ property: 'og:image', content: data.ogImage });
      this.meta.updateTag({ name: 'twitter:image', content: data.ogImage });
    }

    if (data.canonical) {
      this.setCanonical(data.canonical);
      this.meta.updateTag({ property: 'og:url', content: `${BASE_OG}${data.canonical}` });
    }

    if (data.jsonLd) {
      this.setJsonLd(data.jsonLd);
    }
  }

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

  private setJsonLd(data: object | object[]) {
    const items = Array.isArray(data) ? data : [data];
    // Limpia los scripts previos para evitar duplicados en navegación SPA
    if (isPlatformBrowser(this.platform)) {
      this.doc.querySelectorAll('script[data-seo="json-ld"]').forEach(s => s.remove());
    }
    items.forEach(item => {
      const script = this.doc.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo', 'json-ld');
      script.text = JSON.stringify(item);
      this.doc.head.appendChild(script);
    });
  }
}
