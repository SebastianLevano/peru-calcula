import { Component, Input, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ConsentService } from '../../core/consent.service';
import { FeatureFlagsService } from '../../core/feature-flags.service';
import { environment } from '../../../environments/environment';

/**
 * Slot de publicidad CLS-safe (ADR-19). Activo en F4.
 * Solo renderiza el anuncio si: feature flag adsEnabled + consentimiento aceptado.
 * El espacio físico se reserva siempre para evitar layout shift.
 */
@Component({
  selector: 'app-ads-slot',
  standalone: true,
  template: `
    <div
      [class]="containerClass"
      [attr.aria-hidden]="!shouldShowAd"
      data-slot="ads">

      @if (shouldShowAd && adsEnabled) {
        <ins class="adsbygoogle"
             style="display:block"
             [attr.data-ad-client]="adsenseClientId"
             [attr.data-ad-slot]="adSlotId"
             data-ad-format="auto"
             data-full-width-responsive="true">
        </ins>
      }
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

  get containerClass(): string {
    const heights: Record<string, string> = {
      banner:  'h-[90px]',
      sidebar: 'h-[250px]',
      inline:  'h-[100px]',
    };
    return `block w-full ${heights[this.size] ?? heights['banner']} overflow-hidden`;
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platform) && this.shouldShowAd) {
      // Activa el anuncio AdSense después de que el DOM se haya renderizado
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch {
        // AdSense no disponible aún — se intentará cuando se inicialice el script
      }
    }
  }
}
