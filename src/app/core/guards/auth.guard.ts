import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Wait if Firebase Auth is still initializing state from IndexedDB
  if (auth.isLoading()) {
    let waited = 0;
    while (auth.isLoading() && waited < 2500) {
      await new Promise((r) => setTimeout(r, 50));
      waited += 50;
    }
  }

  if (auth.isAuthenticated()) {
    return true;
  }

  // Not authenticated, redirect to /login
  return router.parseUrl('/login');
};
