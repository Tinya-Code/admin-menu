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
    const originalCache = this._cache();
    if (!originalCache) {
      // Si no hay caché, enviamos todo como viene, mapeado a API
      const apiPayload = this.mapUiToApi(data);
      return this.executePut(apiPayload);
    }

    // Convertimos ambos al formato de API para compararlos fácilmente
    const originalApi = this.mapUiToApi(originalCache);
    const updatedApi = this.mapUiToApi(data);

    // Calculamos el diff
    const apiPayload = this.calculateDiff(originalApi, updatedApi);

    // Si el payload está vacío (no hay nada que actualizar), devolvemos un observable exitoso
    if (Object.keys(apiPayload).length === 0) {
      return of(originalCache);
    }

    return this.executePut(apiPayload);
  }

  private executePut(apiPayload: any): Observable<BusinessSettings> {
    return this.http.put<ApiResponse<SettingsResponse>>(this.apiUrl, apiPayload).pipe(
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
        console.error('Error updating settings:', error);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Calcula las diferencias entre el objeto original y el actualizado.
   * Si un valor ha sido vaciado o eliminado, devuelve `null` en lugar de `undefined`,
   * cumpliendo con la regla de backend para eliminar llaves en el deepMerge.
   */
  private calculateDiff(original: any, updated: any): any {
    const diff: any = {};

    const keys = new Set([...Object.keys(original || {}), ...Object.keys(updated || {})]);

    for (const key of keys) {
      const origVal = original ? original[key] : undefined;
      let upVal = updated ? updated[key] : undefined;

      // Tratar cadenas vacías como null para limpiar en base de datos
      if (upVal === '') upVal = null;
      const normalizedOrig = origVal === '' ? null : origVal;

      if (Array.isArray(normalizedOrig) || Array.isArray(upVal)) {
        if (JSON.stringify(normalizedOrig) !== JSON.stringify(upVal)) {
          diff[key] = upVal ?? null;
        }
      } else if (
        typeof normalizedOrig === 'object' && normalizedOrig !== null &&
        typeof upVal === 'object' && upVal !== null
      ) {
        const nestedDiff = this.calculateDiff(normalizedOrig, upVal);
        if (Object.keys(nestedDiff).length > 0) {
          diff[key] = nestedDiff;
        }
      } else {
        if (normalizedOrig !== upVal) {
          // Si el nuevo valor es undefined, asumimos que se quería borrar (null)
          diff[key] = upVal === undefined ? null : upVal;
        }
      }
    }

    return diff;
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
   * Convierte todos los undefined a null y da el formato de campos requeridos (como teléfonos).
   */
  private mapUiToApi(data: Partial<BusinessSettings> | any): any {
    const apiData: any = {};

    const formatPhone = (phone: string | undefined | null) => {
      if (!phone) return null;
      return phone.startsWith('+51') ? phone : `+51${phone}`;
    };

    const getVal = (val: any) => val === undefined || val === '' ? null : val;

    // Mapear campos del restaurant
    apiData.name = getVal(data.name);
    apiData.phone = formatPhone(data.phone);
    apiData.address = getVal(data.address);
    apiData.location_lat = getVal(data.location_lat);
    apiData.location_lng = getVal(data.location_lng);
    apiData.is_active = getVal(data.is_active);

    // Mapear whatsapp_config
    if (data.whatsapp_config) {
      apiData.whatsapp_config = {
        enabled: getVal(data.whatsapp_config.enabled),
        number: formatPhone(data.whatsapp_config.number),
        message_template: getVal(data.whatsapp_config.message_template),
        show_prices: getVal(data.whatsapp_config.show_prices),
        greeting: getVal(data.whatsapp_config.greeting),
        auto_include_restaurant_name: getVal(data.whatsapp_config.auto_include_restaurant_name),
      };
    }

    // Mapear business_config
    if (data.business_config) {
      apiData.business_config = {
        business_hours: getVal(data.business_config.business_hours),
        timezone: getVal(data.business_config.timezone),
        delivery_zones: getVal(data.business_config.delivery_zones),
        social_media: getVal(data.business_config.social_media),
      };
    }

    // Mapear order_config
    if (data.order_config) {
      apiData.order_config = {
        enabled: getVal(data.order_config.enabled),
        max_order_quantity: getVal(data.order_config.max_order_quantity),
        delivery_fee: getVal(data.order_config.delivery_fee),
        payment_methods: getVal(data.order_config.payment_methods),
        accepts_reservations: getVal(data.order_config.accepts_reservations),
        delivery_enabled: getVal(data.order_config.delivery_enabled),
        pickup_enabled: getVal(data.order_config.pickup_enabled),
      };
    }

    // Mapear display_config
    if (data.display_config) {
      apiData.display_config = {
        show_images: getVal(data.display_config.show_images),
        show_descriptions: getVal(data.display_config.show_descriptions),
        show_categories: getVal(data.display_config.show_categories),
        currency: getVal(data.display_config.currency),
        currency_symbol: getVal(data.display_config.currency_symbol),
        theme: getVal(data.display_config.theme),
        colors: getVal(data.display_config.colors),
        language: getVal(data.display_config.language),
        show_availability_badge: getVal(data.display_config.show_availability_badge),
      };
    }

    return apiData;
  }
}
