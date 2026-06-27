import { NgClass } from '@angular/common';
import { Component, computed, model, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucidePencil, LucideTrash2 } from '@lucide/angular';

export interface DayGroupData {
  id?: string;
  days: number[];
  price: number;
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

  protected sortedDayGroups = computed(() =>
    [...this.dayGroups()].sort((a, b) => {
      const firstDay = (d: number) => (d === 0 ? 7 : d);
      return firstDay(a.days[0]) - firstDay(b.days[0]);
    })
  );

  protected showForm = signal(false);
  protected editingItem = signal<DayGroupData | null>(null);
  protected confirmDeleteIndex = signal<number | null>(null);
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

  onEdit(item: DayGroupData): void {
    const days = Array(7).fill(false);
    for (const dayNum of item.days) {
      const displayIndex = this.dayNumberMap.indexOf(dayNum);
      if (displayIndex !== -1) {
        days[displayIndex] = true;
      }
    }
    this.form = {
      days,
      price: new FormControl(item.price, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(0.01)],
      }),
    };
    this.editingItem.set(item);
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
    return this.dayGroups().some((g) =>
      editing !== null && g === editing ? false : g.days.includes(dayNumber),
    );
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
    const editingIdx = editing !== null ? this.dayGroups().indexOf(editing) : -1;
    for (const [i, g] of this.dayGroups().entries()) {
      if (editingIdx !== -1 && i === editingIdx) continue;
      if (selected.some((d) => g.days.includes(d))) {
        this.overlapWarning.set('Los días seleccionados se superponen con otro grupo existente.');
        return;
      }
    }
    const group: DayGroupData = {
      days: selected,
      price: this.form.price.value,
    };
    this.dayGroups.update((current) => {
      const updated = [...current];
      if (editingIdx !== -1) {
        const existing = current[editingIdx];
        if (existing.id) group.id = existing.id;
        updated[editingIdx] = group;
      } else {
        updated.push(group);
      }
      return updated;
    });
    this.editingItem.set(null);
    this.overlapWarning.set(null);
    this.showForm.set(false);
  }

  onRequestDelete(item: DayGroupData): void {
    const idx = this.dayGroups().indexOf(item);
    if (idx !== -1) this.confirmDeleteIndex.set(idx);
  }

  onConfirmDelete(): void {
    const idx = this.confirmDeleteIndex();
    if (idx === null) return;
    this.dayGroups.update((current) => current.filter((_, i) => i !== idx));
    this.confirmDeleteIndex.set(null);
  }

  onCancelDelete(): void {
    this.confirmDeleteIndex.set(null);
  }

  formatDays(days: number[]): string {
    const names = days
      .sort((a, b) => a - b || (a === 0 ? -1 : 1))
      .map((d) => this.dayNames[this.dayNumberMap.indexOf(d)])
      .map((name) => name.substring(0, 3));
    return names.join(', ');
  }
}
