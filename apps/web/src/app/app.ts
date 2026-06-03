import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConsentBannerComponent } from './shared/components/consent-banner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ConsentBannerComponent],
  template: `
    <router-outlet />
    <app-consent-banner />
  `,
})
export class App {}
