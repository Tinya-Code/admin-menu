import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import {
  LucideBuilding,
  LucideClipboardList,
  LucideDynamicIcon,
  LucideMapPin,
  LucideMessageCircle,
} from '@lucide/angular';
import { Subject, takeUntil } from 'rxjs';

import { BusinessSettings } from '../../models/settings';
import { SettingsService } from '../../services/settings.service';
import { ToastService } from '../../services/toast.service';
import { BusinessConfig } from './components/business-config/business-config';
import { OrderConfig } from './components/order-config/order-config';
import { RestaurantConfig } from './components/restaurant-config/restaurant-config';
import { WhatsAppConfig } from './components/whatsapp-config/whatsapp-config';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [
    CommonModule,
    RestaurantConfig,
    WhatsAppConfig,
    OrderConfig,
    BusinessConfig,
    LucideDynamicIcon,
  ],
  templateUrl: './settings-page.html',
})
export class SettingsPage implements OnInit, OnDestroy {
  private settingsService = inject(SettingsService);
  private toastService = inject(ToastService);
  private destroy$ = new Subject<void>();

  // Tab configuration for template
  readonly tabs = [
    { id: 'restaurant', label: 'Restaurante', icon: LucideMapPin },
    { id: 'whatsapp', label: 'WhatsApp', icon: LucideMessageCircle },
    { id: 'order', label: 'Órdenes', icon: LucideClipboardList },
    { id: 'business', label: 'Negocio', icon: LucideBuilding },
  ];

  // Signals for reactive state management
  currentSettings = signal<BusinessSettings | null>(null);
  loading = signal(false);
  saving = signal(false);
  hasUnsavedChanges = signal(false);
  hasChanges = computed(() => this.hasUnsavedChanges());
  activeTab = signal('restaurant');

  // Tab validation signals
  tabValidation = signal<{
    restaurant: boolean;
    whatsapp: boolean;
    order: boolean;
    business: boolean;
    [key: string]: boolean;
  }>({
    restaurant: false,
    whatsapp: false,
    order: false,
    business: false,
  });

  ngOnInit(): void {
    this.loadSettings();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadSettings(): void {
    const isCached = this.settingsService.checkCache();
    if (!isCached) {
      this.loading.set(true);
    }

    this.settingsService
      .getBusinessSettings()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response) {
            this.currentSettings.set(response);
          } else {
            this.toastService.error('Error al cargar la configuración');
          }
          this.loading.set(false);
        },
        error: () => {
          this.toastService.error('Error al cargar la configuración');
          this.loading.set(false);
        },
      });
  }

  switchTab(tabId: string): void {
    this.activeTab.set(tabId);
  }

  onTabValidation(tabId: string, isValid: boolean): void {
    this.tabValidation.update((current: any) => ({
      ...current,
      [tabId]: isValid,
    }));
  }

  onConfigChange(section: keyof BusinessSettings, config: any): void {
    const settings = this.currentSettings();
    if (!settings) return;

    // Handle restaurant-config special format
    if (section === 'restaurant_config' && config.restaurant && config.settings) {
      const previousRestaurant = settings.restaurant_config;
      const isRestaurantDifferent = !this.isEqual(previousRestaurant, config.restaurant);

      if (!isRestaurantDifferent) return;

      this.currentSettings.set({
        ...settings,
        restaurant_config: config.restaurant,
      });
      this.hasUnsavedChanges.set(true);
      return;
    }

    const previous = settings[section];
    const isDifferent = !this.isEqual(previous, config);

    if (!isDifferent) return;
    this.currentSettings.set({
      ...settings,
      [section]: config,
    });
    this.hasUnsavedChanges.set(true);
  }

  // Computed signals for derived state
  restaurantConfig = computed(() => {
    const settings = this.currentSettings();
    return (
      settings?.restaurant_config || {
        name: '',
        slug: '',
        phone: '',
        address: '',
        location: { lat: 0, lng: 0 },
      }
    );
  });

  settingsConfig = computed(() => {
    const settings = this.currentSettings();
    return {
      whatsapp_config: settings?.whatsapp_config || {},
      business_config: settings?.business_config || {},
      order_config: settings?.order_config || {},
      description: settings?.description || '',
      tags: settings?.tags || [],
      logo_url: settings?.logo_url || null,
    };
  });

  whatsappConfig = computed(() => {
    const settings = this.currentSettings();
    return (
      settings?.whatsapp_config || {
        enabled: false,
        number: '',
        message_template: '',
        show_prices: true,
        greeting: '',
        auto_include_restaurant_name: true,
      }
    );
  });

  orderConfig = computed(() => {
    const settings = this.currentSettings();
    return (
      settings?.order_config || {
        enabled: false,
        max_order_quantity: 1,
        delivery_fee: 0,
        payment_methods: [],
        accepts_reservations: false,
        pickup_enabled: false,
        delivery_enabled: false,
      }
    );
  });

  businessConfig = computed(() => {
    const settings = this.currentSettings();
    return (
      settings?.business_config || {
        business_hours: {
          monday: { open: '09:00', close: '22:00', isOpen: false },
          tuesday: { open: '09:00', close: '22:00', isOpen: false },
          wednesday: { open: '09:00', close: '22:00', isOpen: false },
          thursday: { open: '09:00', close: '22:00', isOpen: false },
          friday: { open: '09:00', close: '23:00', isOpen: false },
          saturday: { open: '10:00', close: '23:00', isOpen: false },
          sunday: { open: '10:00', close: '20:00', isOpen: false },
        },
        timezone: 'America/Lima',
        delivery_zones: [],
        social_media: {
          facebook: '',
          instagram: '',
          tiktok: '',
        },
      }
    );
  });

  saveSettings(): void {
    if (!this.isFormValid()) {
      this.showError('Corrige los errores antes de guardar');
      return;
    }

    const settings = this.currentSettings();
    if (!settings || !this.hasUnsavedChanges()) return;

    this.saving.set(true);

    // Build the payload in the expected format
    const payload = {
      restaurant: settings.restaurant_config || {
        name: '',
        slug: '',
        phone: '',
        address: '',
        location: { lat: 0, lng: 0 },
      },
      settings: {
        whatsapp_config: settings.whatsapp_config,
        business_config: settings.business_config,
        order_config: settings.order_config,
        description: settings.description || '',
        tags: settings.tags || [],
        logo_url: settings.logo_url || null,
      },
    };

    this.settingsService
      .updateBusinessSettings(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (configRes) => {
          this.toastService.success('Cambios guardados correctamente');
          this.currentSettings.set(configRes);
          this.hasUnsavedChanges.set(false);
          this.saving.set(false);
          this.settingsService.clearSettingsCache();
        },
        error: () => {
          this.showError('Ocurrió un error al guardar los cambios');
          this.saving.set(false);
        },
      });
  }

  cancelChanges(): void {
    if (this.hasUnsavedChanges()) {
      if (!confirm('¿Descartar cambios?')) {
        return;
      }
    }
    this.loadSettings();
    this.hasUnsavedChanges.set(false);
  }

  // Computed signals for template access
  isLoading = computed(() => this.loading());
  isSaving = computed(() => this.saving());
  isCurrentTabValid = computed(() => {
    const tab = this.activeTab();
    return this.tabValidation()[tab];
  });
  canSave = computed(() => this.hasChanges() && this.isCurrentTabValid() && !this.saving());
  canCancel = computed(() => this.hasChanges() && !this.saving());

  isFormValid(): boolean {
    const validation = this.tabValidation();
    return Object.values(validation).every((v) => v);
  }

  private showError(message: string): void {
    this.toastService.error(message);
  }

  isEqual(a: any, b: any): boolean {
    return JSON.stringify(this.sortObject(a)) === JSON.stringify(this.sortObject(b));
  }

  sortObject(obj: any): any {
    if (Array.isArray(obj)) return obj.map(this.sortObject.bind(this));

    if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj)
        .sort()
        .reduce((result: any, key) => {
          result[key] = this.sortObject(obj[key]);
          return result;
        }, {});
    }

    return obj;
  }
}
