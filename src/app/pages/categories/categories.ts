import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../services/category.service';
import { Category, CategoryForm } from '../../models/category';
import { Button } from '../../components/shared/button';
import { Modal } from '../../components/shared/modal';
import { ConfirmDialog } from '../../components/shared/confirm-dialog';
import { SearchInput } from '../../components/shared/search-input';
import {
  LucidePlus,
  LucideAlertTriangle,
  LucideInbox,
  LucidePencil,
  LucideTrash2,
} from '@lucide/angular';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [FormsModule, Button, Modal, ConfirmDialog, SearchInput, LucidePlus, LucideAlertTriangle, LucideInbox, LucidePencil, LucideTrash2],
  templateUrl: './categories.html',
})
export class Categories implements OnInit {
  private categoryService = inject(CategoryService);

  protected categories = signal<Category[]>([]);
  protected filteredCategories = signal<Category[]>([]);
  protected loading = signal(true);
  protected apiError = signal<string | null>(null);
  protected searchTerm = signal('');

  protected modalOpen = signal(false);
  protected editingCategory = signal<Category | null>(null);
  protected saving = signal(false);
  protected form: CategoryForm = { name: '', description: '', block_id: '', sort_order: 0 };

  protected deleteDialogOpen = signal(false);
  protected deletingId = signal<string | null>(null);
  protected deleting = signal(false);

  blockOptions = signal([
    { id: 'block-1', label: 'Bloque 1' },
    { id: 'block-2', label: 'Bloque 2' },
    { id: 'block-3', label: 'Bloque 3' },
    { id: 'block-4', label: 'Bloque 4' },
    { id: 'block-5', label: 'Bloque 5' },
    { id: 'block-6', label: 'Bloque 6' },
    { id: 'block-7', label: 'Bloque 7' }
  ]);

  ngOnInit(): void {
    this.loadCategories();
  }

  protected loadCategories(): void {
    this.loading.set(true);
    this.apiError.set(null);
    this.categoryService.getAll().subscribe({
      next: (res) => {
        this.categories.set(res.data);
        this.applyFilter();
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.apiError.set('No se pudo conectar con el servidor. Verifica que la API esté corriendo.');
      },
    });
  }

  protected applyFilter(): void {
    const term = this.searchTerm().toLowerCase();
    if (!term) {
      this.filteredCategories.set(this.categories());
      return;
    }
    this.filteredCategories.set(
      this.categories().filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.description.toLowerCase().includes(term)
      )
    );
  }

  protected openCreate(): void {
    this.editingCategory.set(null);
    this.form = { name: '', description: '', block_id: '', sort_order: 0 };
    this.modalOpen.set(true);
  }

  protected openEdit(category: Category): void {
    this.editingCategory.set(category);
    this.form = {
      name: category.name,
      description: category.description,
      block_id: category.block_id,
      sort_order: category.sort_order,
    };
    this.modalOpen.set(true);
  }

  protected closeModal(): void {
    this.modalOpen.set(false);
  }

  protected save(): void {
    if (!this.form.name.trim() || !this.form.block_id.trim()) return;
    this.saving.set(true);

    const request = this.editingCategory()
      ? this.categoryService.update(this.editingCategory()!.id, this.form)
      : this.categoryService.create(this.form);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.loadCategories();
      },
      error: () => {
        this.saving.set(false);
        this.apiError.set('Error al guardar la categoría. Intenta de nuevo.');
      },
    });
  }

  protected confirmDelete(category: Category): void {
    this.deletingId.set(category.id);
    this.deleteDialogOpen.set(true);
  }

  protected executeDelete(): void {
    const id = this.deletingId();
    if (!id) return;

    this.deleting.set(true);
    this.categoryService.delete(id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteDialogOpen.set(false);
        this.deletingId.set(null);
        this.loadCategories();
      },
      error: () => {
        this.deleting.set(false);
        this.apiError.set('Error al eliminar la categoría. Intenta de nuevo.');
      },
    });
  }

  protected getBlockLabel(blockId: string): string {
    return this.blockOptions().find((b) => b.id === blockId)?.label ?? blockId;
  }
}
