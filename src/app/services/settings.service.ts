import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response';
import { BusinessSettings, SettingsResponse } from '../models/settings';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/settings`;

  private readonly _cache = signal<BusinessSettings | null>(null);
  private readonly _lastFetchTime = signal<number>(0);

  checkCache(): boolean {
    const CACHE_DURATION = 5 * 60 * 1000;
    const now = Date.now();
    return !!this._cache() && now - this._lastFetchTime() < CACHE_DURATION;
  }

  clearSettingsCache(): void {
    this._cache.set(null);
    this._lastFetchTime.set(0);
  }

  /**
   * Obtener configuración actual
   */
  getBusinessSettings(): Observable<BusinessSettings> {
    if (this.checkCache()) {
      return of(this._cache()!);
    }
    return this.http.get<ApiResponse<SettingsResponse>>(this.apiUrl).pipe(
      map((response) => {
        if (response?.data) {
          const mapped = this.mapApiToUi(response.data);
          this._cache.set(mapped);
          this._lastFetchTime.set(Date.now());
          return mapped;
        }
        return response as any;
      }),
      catchError((error) => {
        console.error('Error fetching settings:', error);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Actualizar configuración (Upsert / Partial Update)
   */
  updateBusinessSettings(data: Partial<BusinessSettings> | any): Observable<BusinessSettings> {
    const apiPayload = this.mapUiToApi(data);

    // Si el payload está vacío (no hay nada que actualizar), devolvemos un observable exitoso "vacío"
    if (Object.keys(apiPayload).length === 0) {
      return this.getBusinessSettings();
    }

    return this.http.post<ApiResponse<SettingsResponse>>(this.apiUrl, apiPayload).pipe(
      map((response) => {
        if (response?.data) {
          return this.mapApiToUi(response.data);
        }
        return response as any;
      }),
      catchError((error) => {
        console.error('Error updating settings:', error);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Mapear datos de la API al formato de la UI
   * Recibe el objeto { restaurant, settings } directamente
   */
  private mapApiToUi(data: SettingsResponse): BusinessSettings {
    return {
      restaurant_id: data.restaurant?.slug || '',
      restaurant_config: data.restaurant,
      whatsapp_config: data.settings?.whatsapp_config,
      business_config: data.settings?.business_config,
      order_config: data.settings?.order_config,
      display_config: data.settings?.display_config,
      description: data.settings?.description,
      tags: data.settings?.tags,
      logo_url: data.settings?.logo_url,
    } as BusinessSettings;
  }

  /**
   * Mapear datos de la UI al formato de la API
   * Implementamos una lógica de filtrado para enviar solo lo que cambió o lo que es necesario.
   */
  private mapUiToApi(data: Partial<BusinessSettings> | any): any {
    const apiData: any = {};

    // Handle special format { restaurant, settings }
    if (data.restaurant && data.settings) {
      apiData.restaurant = data.restaurant;
      apiData.settings = data.settings;
      return apiData;
    }

    // Mapear whatsapp_config
    if (data.whatsapp_config) {
      apiData.whatsapp_config = {
        enabled: data.whatsapp_config.enabled,
        number: data.whatsapp_config.number,
        message_template: data.whatsapp_config.message_template,
        show_prices: data.whatsapp_config.show_prices,
        greeting: data.whatsapp_config.greeting,
        auto_include_restaurant_name: data.whatsapp_config.auto_include_restaurant_name,
      };

      // Limpiar campos undefined
      Object.keys(apiData.whatsapp_config).forEach((key) => {
        if (apiData.whatsapp_config[key] === undefined) {
          delete apiData.whatsapp_config[key];
        }
      });
    }

    // Mapear business_config
    if (data.business_config) {
      apiData.business_config = {
        business_hours: data.business_config.business_hours,
        timezone: data.business_config.timezone,
        delivery_zones: data.business_config.delivery_zones,
        social_media: data.business_config.social_media,
      };
    }

    // Mapear order_config
    if (data.order_config) {
      apiData.order_config = {
        enabled: data.order_config.enabled,
        max_order_quantity: data.order_config.max_order_quantity,
        delivery_fee: data.order_config.delivery_fee,
        payment_methods: data.order_config.payment_methods,
        accepts_reservations: data.order_config.accepts_reservations,
        delivery_enabled: data.order_config.delivery_enabled,
        pickup_enabled: data.order_config.pickup_enabled,
      };

      // Limpiar campos undefined
      Object.keys(apiData.order_config).forEach((key) => {
        if (apiData.order_config[key] === undefined) {
          delete apiData.order_config[key];
        }
      });
    }

    // Mapear display_config
    if (data.display_config) {
      apiData.display_config = {
        show_images: data.display_config.show_images,
        show_descriptions: data.display_config.show_descriptions,
        show_categories: data.display_config.show_categories,
        currency: data.display_config.currency,
        currency_symbol: data.display_config.currency_symbol,
        theme: data.display_config.theme,
        colors: data.display_config.colors,
        language: data.display_config.language,
        show_availability_badge: data.display_config.show_availability_badge,
      };
    }

    return apiData;
  }
}
