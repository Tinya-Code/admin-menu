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
  private readonly apiUrl = `${environment.apiURL}/business-settings`;

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

    return this.http.put<ApiResponse<SettingsResponse>>(this.apiUrl, apiPayload).pipe(
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
   * Recibe la estructura plana de business-settings
   * Los configs vienen como strings JSON, los parsea
   */
  private mapApiToUi(data: SettingsResponse): BusinessSettings {
    return {
      restaurant_id: data.restaurant_id || '',
      name: data.name || '',
      phone: typeof data.phone === 'string' ? data.phone.replace(/^\+51\s?/, '') : '',
      address: data.address || '',
      location_lat: Number(data.location_lat) || 0,
      location_lng: Number(data.location_lng) || 0,
      is_active: data.is_active === true || (data.is_active as any) === 1,
      whatsapp_config: (() => {
        const parsed = this.parseJsonConfig(data.whatsapp_config, {
          enabled: false,
          number: '',
          message_template: '',
          show_prices: true,
          greeting: '',
          auto_include_restaurant_name: true,
        });
        return {
          ...parsed,
          number: (parsed.number || '').replace(/^\+51/, ''),
        };
      })(),
      business_config: this.parseJsonConfig(data.business_config, {
        business_hours: {} as any,
        timezone: '',
        delivery_zones: [],
        social_media: {},
      }),
      order_config: this.parseJsonConfig(data.order_config, {
        enabled: false,
        max_order_quantity: 10,
        delivery_fee: 0,
        payment_methods: [],
        accepts_reservations: false,
        delivery_enabled: false,
        pickup_enabled: false,
      }),
      display_config: this.parseJsonConfig(data.display_config, {
        show_images: true,
        show_descriptions: true,
        show_categories: true,
        currency: '',
        currency_symbol: '',
        theme: 'light' as const,
        colors: { primary: '', secondary: '' },
        language: '',
        show_availability_badge: true,
      }),
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  private parseJsonConfig<T>(value: any, fallback: T): T {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as T;
      } catch {
        return fallback;
      }
    }
    return (value as T) || fallback;
  }

  /**
   * Mapear datos de la UI al formato de la API
   * Envía estructura plana con campos del restaurant + configs
   */
  private mapUiToApi(data: Partial<BusinessSettings> | any): any {
    const apiData: any = {};

    // Mapear campos del restaurant
    if (data.name !== undefined) apiData.name = data.name;
    if (data.phone !== undefined) {
      const phone = data.phone || '';
      apiData.phone = phone.startsWith('+51') ? phone : `+51${phone}`;
    }
    if (data.address !== undefined) apiData.address = data.address;
    if (data.location_lat !== undefined) apiData.location_lat = data.location_lat;
    if (data.location_lng !== undefined) apiData.location_lng = data.location_lng;
    if (data.is_active !== undefined) apiData.is_active = data.is_active;

    // Mapear whatsapp_config
    if (data.whatsapp_config) {
      apiData.whatsapp_config = {
        enabled: data.whatsapp_config.enabled,
        number: data.whatsapp_config.number?.startsWith('+51')
          ? data.whatsapp_config.number
          : `+51${data.whatsapp_config.number}`,
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
