import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoading()) {
    let waited = 0;
    while (auth.isLoading() && waited < 2500) {
      await new Promise((r) => setTimeout(r, 50));
      waited += 50;
    }
  }

  if (auth.canAccessAdmin()) {
    return true;
  }

  return router.parseUrl('/dashboard');
};

export const superAdminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoading()) {
    let waited = 0;
    while (auth.isLoading() && waited < 2500) {
      await new Promise((r) => setTimeout(r, 50));
      waited += 50;
    }
  }

  if (auth.isSuperAdmin()) {
    return true;
  }

  return router.parseUrl('/dashboard');
};
