import { CommonModule } from '@angular/common';
import { Component, inject, input, OnInit, output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  OrderConfig as OrderConfigModel,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  PaymentMethod,
} from '../../../../models/settings';
import { FeaturesService } from '../../../../services/features.service';

@Component({
  selector: 'app-order-config',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './order-config.html',
})
export class OrderConfig implements OnInit {
  config = input<OrderConfigModel>({
    enabled: true,
    max_order_quantity: 1,
    accepts_reservations: false,
    pickup_enabled: false,
    delivery_enabled: false,
    delivery_fee: 0,
    payment_methods: [],
  });

  configChange = output<OrderConfigModel>();
  isValid = output<boolean>();

  readonly paymentMethods = PAYMENT_METHODS;

  private fb = inject(FormBuilder);
   protected readonly featuresService = inject(FeaturesService);

  orderForm: FormGroup = this.fb.group({
    enabled: [true],
    max_order_quantity: [1, [Validators.required, Validators.min(1)]],
    accepts_reservations: [false],
    pickup_enabled: [false],
    delivery_enabled: [false],
    delivery_fee: [0, [Validators.required, Validators.min(0)]],
    payment_methods: [[]],
  });

  ngOnInit(): void {
    if (this.config()) {
      this.orderForm.patchValue(this.config(), { emitEvent: false });
    }

    this.updateDeliveryFeeDisabled();
    this.setupFormListeners();
    // Emit initial status
    this.isValid.emit(this.orderForm.valid);
  }

  private setupFormListeners(): void {
    this.orderForm.get('delivery_enabled')?.valueChanges.subscribe(() => {
      this.updateDeliveryFeeDisabled();
    });

    this.orderForm.valueChanges.subscribe(() => {
      const isValid = this.orderForm.valid;
      const values = this.orderForm.getRawValue();
      this.isValid.emit(isValid);

      // Always emit changes to enable the save button
      this.configChange.emit({ ...this.config(), ...values } as OrderConfigModel);
    });
  }

  private updateDeliveryFeeDisabled(): void {
    const deliveryFeeControl = this.orderForm.get('delivery_fee');
    if (this.orderForm.get('delivery_enabled')?.value) {
      deliveryFeeControl?.enable();
    } else {
      deliveryFeeControl?.disable();
    }
  }

  get isFormEnabled(): boolean {
    return this.orderForm.get('delivery_enabled')?.value;
  }

  isPaymentMethodSelected(method: PaymentMethod): boolean {
    const selected = this.orderForm.get('payment_methods')?.value || [];
    return selected.includes(method);
  }

  onPaymentMethodChange(method: PaymentMethod, event: any): void {
    const isChecked = typeof event === 'boolean' ? event : event.target.checked;
    const current = this.orderForm.get('payment_methods')?.value || [];
    let updated;

    if (isChecked) {
      updated = [...current, method];
    } else {
      updated = current.filter((m: string) => m !== method);
    }

    this.orderForm.get('payment_methods')?.setValue(updated);
  }

  getPaymentMethodLabel(method: PaymentMethod): string {
    return PAYMENT_METHOD_LABELS[method as keyof typeof PAYMENT_METHOD_LABELS] || method;
  }

  getMaxQuantityErrorMessage(): string {
    const control = this.orderForm.get('max_order_quantity');
    if (control?.errors?.['required']) return 'La cantidad máxima es requerida';
    if (control?.errors?.['min']) return 'Debe ser al menos 1';
    return '';
  }

  getDeliveryFeeErrorMessage(): string {
    const control = this.orderForm.get('delivery_fee');
    if (control?.errors?.['required']) return 'El costo de delivery es requerido';
    if (control?.errors?.['min']) return 'Debe ser mayor o igual a 0';
    return '';
  }
}
