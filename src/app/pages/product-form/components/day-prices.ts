import { NgClass } from '@angular/common';
import { Component, computed, model, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucidePencil, LucideTrash2 } from '@lucide/angular';

export interface DayGroupData {
  id?: string;
  days: number[];
  price: number;
}

export interface PriceGroup {
  price: number;
  days: number[];
  items: DayGroupData[];
}

@Component({
  selector: 'app-day-prices',
  standalone: true,
  imports: [ReactiveFormsModule, NgClass, LucidePencil, LucideTrash2],
  templateUrl: './day-prices.html',
})
export class DayPrices {
  protected readonly dayNames = [
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
    'Domingo',
  ];
  protected readonly dayNumberMap = [1, 2, 3, 4, 5, 6, 0];

  dayGroups = model.required<DayGroupData[]>();

  protected priceGroups = computed(() => {
    const groups = this.dayGroups();
    const map = new Map<number, DayGroupData[]>();
    for (const group of groups) {
      const existing = map.get(group.price) || [];
      existing.push(group);
      map.set(group.price, existing);
    }
    return Array.from(map.entries())
      .map(([price, items]) => ({
        price,
        days: items.flatMap((g) => g.days).sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b)),
        items,
      }))
      .sort((a, b) => a.days[0] - b.days[0]);
  });

  protected showForm = signal(false);
  protected editingItem = signal<PriceGroup | null>(null);
  protected confirmDeletePrice = signal<number | null>(null);
  protected overlapWarning = signal<string | null>(null);

  protected form: { days: boolean[]; price: FormControl<number> };

  get formValid(): boolean {
    return this.form.price.valid && this.form.days.some((d) => d);
  }

  constructor() {
    this.form = {
      days: Array(7).fill(false),
      price: new FormControl(0, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(0.01)],
      }),
    };
  }

  openForm(): void {
    this.form = {
      days: Array(7).fill(false),
      price: new FormControl(0, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(0.01)],
      }),
    };
    this.editingItem.set(null);
    this.overlapWarning.set(null);
    this.showForm.set(true);
  }

  onEdit(group: PriceGroup): void {
    const days = Array(7).fill(false);
    for (const dayNum of group.days) {
      const displayIndex = this.dayNumberMap.indexOf(dayNum);
      if (displayIndex !== -1) {
        days[displayIndex] = true;
      }
    }
    this.form = {
      days,
      price: new FormControl(group.price, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(0.01)],
      }),
    };
    this.editingItem.set(group);
    this.overlapWarning.set(null);
    this.showForm.set(true);
  }

  onCancelForm(): void {
    this.editingItem.set(null);
    this.overlapWarning.set(null);
    this.showForm.set(false);
  }

  isDayTaken(displayIndex: number): boolean {
    const dayNumber = this.dayNumberMap[displayIndex];
    const editing = this.editingItem();
    if (editing) {
      return this.dayGroups().some((g) =>
        g.price !== editing.price && g.days.includes(dayNumber),
      );
    }
    return this.dayGroups().some((g) => g.days.includes(dayNumber));
  }

  toggleCheckbox(index: number): void {
    this.form.days[index] = !this.form.days[index];
    this.overlapWarning.set(null);
  }

  onSave(): void {
    if (this.form.price.invalid) return;
    const selected = this.form.days
      .map((c, i) => (c ? this.dayNumberMap[i] : null))
      .filter((d): d is number => d !== null);
    if (selected.length === 0) {
      this.overlapWarning.set('Selecciona al menos un día.');
      return;
    }
    const editing = this.editingItem();
    for (const [i, g] of this.dayGroups().entries()) {
      if (editing && g.price === editing.price) continue;
      if (selected.some((d) => g.days.includes(d))) {
        this.overlapWarning.set('Los días seleccionados se superponen con otro grupo existente.');
        return;
      }
    }
    const newGroup: DayGroupData = {
      days: selected,
      price: this.form.price.value,
    };
    this.dayGroups.update((current) => {
      let updated = [...current];
      if (editing) {
        updated = updated.filter((g) => g.price !== editing.price);
        if (editing.items[0]?.id) newGroup.id = editing.items[0].id;
      }
      updated.push(newGroup);
      return updated;
    });
    this.editingItem.set(null);
    this.overlapWarning.set(null);
    this.showForm.set(false);
  }

  onRequestDelete(price: number): void {
    this.confirmDeletePrice.set(price);
  }

  onConfirmDelete(): void {
    const price = this.confirmDeletePrice();
    if (price === null) return;
    this.dayGroups.update((current) => current.filter((g) => g.price !== price));
    this.confirmDeletePrice.set(null);
  }

  onCancelDelete(): void {
    this.confirmDeletePrice.set(null);
  }

  formatDays(days: number[]): string {
    const names = days
      .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
      .map((d) => this.dayNames[this.dayNumberMap.indexOf(d)])
      .map((name) => name.substring(0, 3));
    return names.join(', ');
  }
}
