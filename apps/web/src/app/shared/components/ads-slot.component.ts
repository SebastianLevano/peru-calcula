import { Component, Input, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ConsentService } from '../../core/consent.service';
import { FeatureFlagsService } from '../../core/feature-flags.service';
import { environment } from '../../../environments/environment';

/**
 * Slot de publicidad CLS-safe (ADR-19). Etiqueta "Publicidad" visible, separado
 * visualmente del contenido de confianza mediante hairline y fondo paper.
 *
 * ZONAS PERMITIDAS (nunca entre formulario y ResultCard):
 *   - Después del ResultCard
 *   - Páginas de guías
 *   - Footer / entre secciones informativas
 */
@Component({
  selector: 'app-ads-slot',
  standalone: true,
  template: `
    <div class="border-t border-line bg-paper" data-slot="ads">
      <p class="px-3 pt-2 text-[10px] font-medium uppercase tracking-widest text-ink-500">Publicidad</p>
      <div [class]="reserveClass" [attr.aria-hidden]="!shouldShowAd">
        @if (shouldShowAd && adsEnabled) {
          <ins class="adsbygoogle block"
               style="display:block"
               [attr.data-ad-client]="adsenseClientId"
               [attr.data-ad-slot]="adSlotId"
               data-ad-format="auto"
               data-full-width-responsive="true">
          </ins>
        }
      </div>
    </div>
  `,
})
export class AdsSlotComponent implements OnInit {
  @Input() size: 'banner' | 'sidebar' | 'inline' = 'banner';
  @Input() adSlotId = '';

  private readonly consent  = inject(ConsentService);
  private readonly flags    = inject(FeatureFlagsService);
  private readonly platform = inject(PLATFORM_ID);

  readonly adsenseClientId = environment.adsense?.clientId ?? '';
  readonly adsEnabled      = environment.adsense?.enabled ?? false;

  get shouldShowAd(): boolean {
    return this.flags.isEnabled('adsEnabled')
        && this.consent.hasConsented
        && this.adsEnabled
        && !!this.adsenseClientId;
  }

  get reserveClass(): string {
    const heights: Record<string, string> = {
      banner:  'h-[90px]',
      sidebar: 'h-[250px]',
      inline:  'h-[100px]',
    };
    return `w-full overflow-hidden ${heights[this.size] ?? heights['banner']}`;
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platform) && this.shouldShowAd) {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch { /* AdSense no disponible aún */ }
    }
  }
}
