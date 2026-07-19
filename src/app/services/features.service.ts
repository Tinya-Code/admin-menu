import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { RestaurantFeatures } from '../models/features';
import { ApiResponse } from '../models/api-response';

@Injectable({ providedIn: 'root' })
export class FeaturesService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  private features = signal<RestaurantFeatures>({});
  private loaded = signal(false);

  readonly features$ = this.features.asReadonly();
  readonly loaded$ = this.loaded.asReadonly();

  get deliveryOptions(): boolean {
    return this.features().deliveryOptions ?? false;
  }

  load(): Observable<ApiResponse<RestaurantFeatures>> {
    const restaurantId = this.auth.restaurantId;
    return this.http
      .get<ApiResponse<RestaurantFeatures>>(`${environment.apiURL}/restaurants/${restaurantId}/features`)
      .pipe(
        tap((res) => {
          this.features.set(res.data ?? {});
          this.loaded.set(true);
        }),
      );
  }

  isEnabled(key: keyof RestaurantFeatures): boolean {
    return !!this.features()[key];
  }
}
