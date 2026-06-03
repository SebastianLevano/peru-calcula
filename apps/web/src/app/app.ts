import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LayoutComponent } from './shared/layout/layout.component';
import { ConsentBannerComponent } from './shared/components/consent-banner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LayoutComponent, ConsentBannerComponent],
  template: `
    <app-layout>
      <router-outlet />
    </app-layout>
    <app-consent-banner />
  `,
})
export class App {}
