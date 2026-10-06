import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.js';
import { API_URL } from '../config.js';

/**
 * Interceptor qui ajoute le token JWT aux requêtes vers l'API.
 * Déconnecte l'utilisateur en cas de 401 (hors endpoint /login).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const apiUrl = inject(API_URL);

  // Vérifier que l'URL cible bien l'API (protection contre domaine lookalike)
  const isApiRequest = req.url === apiUrl || req.url.startsWith(`${apiUrl}/`);

  if (isApiRequest) {
    const token = auth.getToken();
    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  }

  return next(req).pipe(
    catchError((error: unknown) => {
      // Déconnecter en cas de 401, sauf pour /login
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        req.url !== `${apiUrl}/login`
      ) {
        auth.logout();
      }
      return throwError(() => error);
    }),
  );
};
