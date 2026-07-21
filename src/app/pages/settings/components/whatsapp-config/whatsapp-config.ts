import { CommonModule } from '@angular/common';
import { Component, inject, input, OnInit, output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  WHATSAPP_MESSAGE_MAX_LENGTH,
  WhatsAppConfig as WhatsAppConfigModel,
} from '../../../../models/settings';

@Component({
  selector: 'app-whatsapp-config',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './whatsapp-config.html',
})
export class WhatsAppConfig implements OnInit {
  config = input<WhatsAppConfigModel>({
    enabled: false,
    number: '',
    message_template: '',
    show_prices: true,
    greeting: '',
    auto_include_restaurant_name: true,
  });

  configChange = output<WhatsAppConfigModel>();
  isValid = output<boolean>();

  readonly maxLength = WHATSAPP_MESSAGE_MAX_LENGTH;
  private fb = inject(FormBuilder);

  whatsappForm: FormGroup = this.fb.group({
    enabled: [false],
    number: ['', [Validators.required, Validators.pattern(/^[9]\d{8}$/)]],
    message_template: ['', [Validators.required, Validators.maxLength(this.maxLength)]],
    show_prices: [true],
    greeting: [''],
    auto_include_restaurant_name: [true],
  });

  ngOnInit(): void {
    if (this.config()) {
      this.whatsappForm.patchValue(this.config(), { emitEvent: false });
    }

    this.setupFormListeners();
    // Emit initial status
    this.isValid.emit(this.whatsappForm.valid);
  }

  private setupFormListeners(): void {
    this.whatsappForm.valueChanges.subscribe(() => {
      const isValid = this.whatsappForm.valid;
      const values = this.whatsappForm.getRawValue();
      this.isValid.emit(isValid);

      // Always emit changes to enable the save button
      this.configChange.emit({ ...this.config(), ...values } as WhatsAppConfigModel);
    });
  }

  // Formatear número de WhatsApp
  onNumberInput(event: any): void {
    let value = event.target.value;

    // Remover caracteres no numéricos
    value = value.replace(/\D/g, '');

    // Limitar a 9 dígitos
    value = value.slice(0, 9);

    // Actualizar el valor
    this.whatsappForm.get('number')?.setValue(value, { emitEvent: false });
  }

  // Obtener mensaje de error para número
  getNumberErrorMessage(): string {
    const control = this.whatsappForm.get('number');

    if (control?.errors?.['required']) {
      return 'El número de WhatsApp es requerido';
    }

    if (control?.errors?.['pattern']) {
      return 'El número debe comenzar con 9 y tener 9 dígitos';
    }

    return '';
  }

  // Obtener mensaje de error para plantilla
  getMessageErrorMessage(): string {
    const control = this.whatsappForm.get('message_template');

    if (control?.errors?.['required']) {
      return 'La plantilla de mensaje es requerida';
    }

    if (control?.errors?.['maxlength']) {
      return `La plantilla no debe exceder los ${this.maxLength} caracteres`;
    }

    return '';
  }

  // Obtener conteo de caracteres
  getCharacterCount(): number {
    return this.whatsappForm.get('message_template')?.value?.length || 0;
  }
}
