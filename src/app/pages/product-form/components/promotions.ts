import { Component, computed, inject, model, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { LucidePencil, LucideTrash2 } from '@lucide/angular';

export interface PromotionData {
  id?: string;
  name: string;
  description: string;
  price: number;
  startDate: string;
  endDate: string;
}

function dateRangeValidator(isEditing: boolean) {
  return (control: AbstractControl): ValidationErrors | null => {
    const startDate = control.get('startDate')?.value;
    const endDate = control.get('endDate')?.value;
    if (!startDate || !endDate) return null;

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (!isEditing && start < now) {
      return { startDateBeforeToday: true };
    }
    if (start > end) {
      return { startDateAfterEndDate: true };
    }
    return null;
  };
}

@Component({
  selector: 'app-promotions',
  standalone: true,
  imports: [ReactiveFormsModule, LucidePencil, LucideTrash2],
  templateUrl: './promotions.html',
})
export class Promotions {
  private fb = inject(FormBuilder);

  promotions = model.required<PromotionData[]>();

  protected sortedPromotions = computed(() =>
    [...this.promotions()].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
  );

  protected showForm = signal(false);
  protected editingItem = signal<PromotionData | null>(null);
  protected confirmDeleteIndex = signal<number | null>(null);
  protected form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      price: [0, [Validators.required, Validators.min(0.01)]],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
    }, { validators: dateRangeValidator(false) });
  }

  openForm(): void {
    this.form.reset({ name: '', description: '', price: 0, startDate: '', endDate: '' });
    this.form.setValidators(dateRangeValidator(false));
    this.form.updateValueAndValidity();
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.editingItem.set(null);
    this.showForm.set(true);
  }

  onEdit(item: PromotionData): void {
    this.form.setValue({
      name: item.name,
      description: item.description,
      price: item.price,
      startDate: item.startDate,
      endDate: item.endDate,
    });
    this.form.setValidators(dateRangeValidator(true));
    this.form.updateValueAndValidity();
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.editingItem.set(item);
    this.showForm.set(true);
  }

  onCancelForm(): void {
    this.editingItem.set(null);
    this.showForm.set(false);
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.value;
    const promo: PromotionData = {
      name: raw.name,
      description: raw.description,
      price: raw.price,
      startDate: raw.startDate,
      endDate: raw.endDate,
    };
    const editing = this.editingItem();
    const editingIdx = editing !== null ? this.promotions().indexOf(editing) : -1;
    this.promotions.update((current) => {
      const updated = [...current];
      if (editingIdx !== -1) {
        const existing = current[editingIdx];
        if (existing.id) promo.id = existing.id;
        updated[editingIdx] = promo;
      } else {
        updated.push(promo);
      }
      return updated;
    });
    this.editingItem.set(null);
    this.showForm.set(false);
  }

  onRequestDelete(item: PromotionData): void {
    const idx = this.promotions().indexOf(item);
    if (idx !== -1) this.confirmDeleteIndex.set(idx);
  }

  onConfirmDelete(): void {
    const idx = this.confirmDeleteIndex();
    if (idx === null) return;
    this.promotions.update((current) => current.filter((_, i) => i !== idx));
    this.confirmDeleteIndex.set(null);
  }

  onCancelDelete(): void {
    this.confirmDeleteIndex.set(null);
  }

  formatDate(value: string): string {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
