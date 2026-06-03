import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FeatureFlagsService {
  private readonly flags = environment.featureFlags;

  isEnabled(feature: keyof typeof environment.featureFlags): boolean {
    return this.flags[feature] ?? false;
  }
}
