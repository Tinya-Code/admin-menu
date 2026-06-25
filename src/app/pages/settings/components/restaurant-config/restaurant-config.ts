import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, OnInit, output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { MapPicker } from '../../../../components/map-picker/map-picker';
import { Location, RestaurantConfig as RestaurantConfigModel } from '../../../../models/settings';

@Component({
  selector: 'app-restaurant-config',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MapPicker],
  templateUrl: './restaurant-config.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantConfig implements OnInit {
  config = input<RestaurantConfigModel>({
    name: '',
    slug: '',
    phone: '',
    address: '',
    location: { lat: 0, lng: 0 },
  });

  settingsConfig = input<any>({
    whatsapp_config: {},
    business_config: {},
    order_config: {},
    description: '',
    tags: [],
    logo_url: null,
  });

  configChange = output<any>();
  isValid = output<boolean>();

  private readonly fb = inject(FormBuilder);

  restaurantForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.pattern(/^[0-9+\s()-]{7,20}$/)]],
    address: ['', [Validators.required, Validators.minLength(5)]],
    location: this.fb.group({
      lat: [0, [Validators.required, Validators.min(-90), Validators.max(90)]],
      lng: [0, [Validators.required, Validators.min(-180), Validators.max(180)]],
    }),
  });

  ngOnInit(): void {
    if (this.config()) {
      this.restaurantForm.patchValue(this.config(), { emitEvent: false });
    }

    this.setupFormListeners();
    this.isValid.emit(this.restaurantForm.valid);
  }

  private setupFormListeners(): void {
    this.restaurantForm.valueChanges.subscribe((values) => {
      const isValid = this.restaurantForm.valid;
      this.isValid.emit(isValid);

      // Always emit changes to enable the save button
      this.emitConfigChange(values);
    });
  }

  private emitConfigChange(formValues: any): void {
    const slug = this.generateSlug(formValues.name);

    const payload = {
      restaurant: {
        name: formValues.name,
        slug: slug,
        phone: formValues.phone,
        address: formValues.address,
        location: {
          lat: formValues.location.lat,
          lng: formValues.location.lng,
        },
      },
      settings: {
        ...this.settingsConfig(),
      },
    };

    this.configChange.emit(payload);
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  onLocationChange(location: Location): void {
    this.restaurantForm.patchValue(
      {
        location: { lat: location.lat, lng: location.lng },
      },
      { emitEvent: true },
    );
  }

  getNameErrorMessage(): string {
    const control = this.restaurantForm.get('name');
    if (control?.errors?.['required']) return 'El nombre es requerido';
    if (control?.errors?.['minlength']) return 'El nombre debe tener al menos 2 caracteres';
    return '';
  }

  getPhoneErrorMessage(): string {
    const control = this.restaurantForm.get('phone');
    if (control?.errors?.['pattern']) return 'Formato de teléfono inválido';
    return '';
  }

  getAddressErrorMessage(): string {
    const control = this.restaurantForm.get('address');
    if (control?.errors?.['required']) return 'La dirección es requerida';
    if (control?.errors?.['minlength']) return 'La dirección debe tener al menos 5 caracteres';
    return '';
  }

  getLocationErrorMessage(): string {
    const latControl = this.restaurantForm.get('location.lat');
    const lngControl = this.restaurantForm.get('location.lng');

    if (latControl?.errors?.['required'] || lngControl?.errors?.['required']) {
      return 'La ubicación es requerida';
    }

    if (latControl?.errors?.['min'] || latControl?.errors?.['max']) {
      return 'Latitud inválida';
    }

    if (lngControl?.errors?.['min'] || lngControl?.errors?.['max']) {
      return 'Longitud inválida';
    }

    return '';
  }
}
