import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export interface SeoData {
  title: string;
  description: string;
  canonical?: string;
  jsonLd?: object;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta  = inject(Meta);

  set(data: SeoData) {
    this.title.setTitle(`${data.title} | Perú Calcula`);
    this.meta.updateTag({ name: 'description', content: data.description });
    if (data.canonical) {
      this.meta.updateTag({ rel: 'canonical', href: data.canonical });
    }
  }
}
