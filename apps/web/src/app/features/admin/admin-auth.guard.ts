import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminAuthService } from './admin-auth.service';

export const adminAuthGuard: CanActivateFn = () => {
  const auth   = inject(AdminAuthService);
  const router = inject(Router);

  if (auth.autenticado()) return true;

  const token = auth.getAccessToken();
  if (token) { auth['autenticado'].set(true); return true; }

  return router.createUrlTree(['/admin/login']);
};
