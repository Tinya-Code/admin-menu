import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const isApiRequest = req.url.startsWith(environment.apiURL);

  if (!isApiRequest) return next(req);

  return from(authService.getIdToken()).pipe(
    switchMap((token) => {
      let cloned = req;
      if (token) {
        cloned = cloned.clone({ headers: cloned.headers.set('Authorization', `Bearer ${token}`) });
      }
      const restaurantId = authService.restaurantId;
      if (restaurantId) {
        cloned = cloned.clone({ headers: cloned.headers.set('X-Restaurant-Id', restaurantId) });
      }
      return next(cloned);
    }),
  );
};
