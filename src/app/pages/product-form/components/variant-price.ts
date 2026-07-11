import { Component, computed, model, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucidePencil, LucideTrash2 } from '@lucide/angular';

export interface PriceRangeData {
  id?: string;
  quantity: number;
  unit: string;
  price: number | null;
  bonus: string;
  sort_order: number;
  is_default: boolean;
}

@Component({
  selector: 'app-variant-price',
  standalone: true,
  imports: [ReactiveFormsModule, LucidePencil, LucideTrash2],
  templateUrl: './variant-price.html',
})
export class VariantPrice {
  protected readonly units = [
    'unidad',
    'kg',
    'lt',
    'botella',
    '1 jarra',
    '1/2 jarra',
    '1/2 litro',
    '1 litro',
    '2 litros',
    '3 litros',
  ];

  private readonly pluralMap: Record<string, string> = {
    unidad: 'unidades',
    kg: 'kgs',
    lt: 'lts',
    botella: 'botellas',
    '1 jarra': '1 jarra',
    '1/2 jarra': '1/2 jarra',
  };

  priceRanges = model.required<PriceRangeData[]>();

  protected sortedRanges = computed(() =>
    [...this.priceRanges()].sort((a, b) => a.sort_order - b.sort_order),
  );

  protected showForm = signal(false);
  protected editingItem = signal<PriceRangeData | null>(null);
  protected confirmDeleteIndex = signal<number | null>(null);

  protected form = {
    quantity: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0.01)],
    }),
    unit: new FormControl('unidad', { nonNullable: true }),
    price: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0.01)],
    }),
    bonus: new FormControl('', { nonNullable: true }),
    is_default: new FormControl(false, { nonNullable: true }),
  };

  get formValid(): boolean {
    return this.form.quantity.valid && this.form.price.valid;
  }

  openForm(): void {
    this.form.quantity.setValue(1);
    this.form.unit.setValue('unidad');
    this.form.price.setValue(null);
    this.form.bonus.setValue('');
    this.form.is_default.setValue(false);
    this.editingItem.set(null);
    this.showForm.set(true);
  }

  onEdit(item: PriceRangeData): void {
    this.form.quantity.setValue(item.quantity);
    this.form.unit.setValue(item.unit);
    this.form.price.setValue(item.price);
    this.form.bonus.setValue(item.bonus);
    this.form.is_default.setValue(item.is_default);
    this.editingItem.set(item);
    this.showForm.set(true);
  }

  onCancelForm(): void {
    this.editingItem.set(null);
    this.showForm.set(false);
  }

  onSave(): void {
    if (this.form.quantity.invalid || this.form.price.invalid) return;

    const range: PriceRangeData = {
      quantity: this.form.quantity.value,
      unit: this.form.unit.value,
      price: this.form.price.value,
      bonus: this.form.bonus.value,
      sort_order: this.priceRanges().length,
      is_default: this.form.is_default.value,
    };

    this.priceRanges.update((current) => {
      const updated = [...current];
      const editing = this.editingItem();
      if (editing) {
        const idx = current.indexOf(editing);
        range.id = editing.id;
        range.sort_order = editing.sort_order;
        updated[idx] = range;
      } else {
        updated.push(range);
      }
      return updated;
    });

    this.editingItem.set(null);
    this.showForm.set(false);
  }

  onRequestDelete(item: PriceRangeData): void {
    const idx = this.priceRanges().indexOf(item);
    if (idx !== -1) this.confirmDeleteIndex.set(idx);
  }

  onConfirmDelete(): void {
    const idx = this.confirmDeleteIndex();
    if (idx === null) return;
    this.priceRanges.update((current) => current.filter((_, i) => i !== idx));
    this.confirmDeleteIndex.set(null);
  }

  onCancelDelete(): void {
    this.confirmDeleteIndex.set(null);
  }

  formatUnit(quantity: number, unit: string): string {
    const display = quantity === 1 ? unit : (this.pluralMap[unit] ?? unit);
    return display;
  }
}
