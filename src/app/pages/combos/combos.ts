import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ComboService } from '../../services/combo.service';
import { Combo, ComboForm } from '../../models/combo';
import { Button } from '../../components/shared/button';
import { Modal } from '../../components/shared/modal';
import { ConfirmDialog } from '../../components/shared/confirm-dialog';
import { SearchInput } from '../../components/shared/search-input';
import { ImageUploader } from '../../components/shared/image-uploader';
import {
  LucidePlus,
  LucideAlertTriangle,
  LucideInbox,
  LucidePencil,
  LucideTrash2,
} from '@lucide/angular';

@Component({
  selector: 'app-combos',
  standalone: true,
  imports: [FormsModule, Button, Modal, ConfirmDialog, SearchInput, ImageUploader, LucidePlus, LucideAlertTriangle, LucideInbox, LucidePencil, LucideTrash2],
  templateUrl: './combos.html',
})
export class Combos implements OnInit {
  private comboService = inject(ComboService);

  protected combos = signal<Combo[]>([]);
  protected filteredCombos = signal<Combo[]>([]);
  protected loading = signal(true);
  protected apiError = signal<string | null>(null);
  protected searchTerm = signal('');

  protected modalOpen = signal(false);
  protected editingCombo = signal<Combo | null>(null);
  protected saving = signal(false);
  protected form: ComboForm = { name: '', description: '', price: 0 };
  protected selectedImage: File | null = null;
  protected existingImageUrl = signal<string | null>(null);
  protected modalKey = signal(0);

  protected deleteDialogOpen = signal(false);
  protected deletingId = signal<number | null>(null);
  protected deleting = signal(false);

  ngOnInit(): void {
    this.loadCombos();
  }

  protected loadCombos(): void {
    this.loading.set(true);
    this.apiError.set(null);
    this.comboService.getAll().subscribe({
      next: (res) => {
        this.combos.set(res);
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
      this.filteredCombos.set(this.combos());
      return;
    }
    this.filteredCombos.set(
      this.combos().filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.description.toLowerCase().includes(term)
      )
    );
  }

  protected openCreate(): void {
    this.editingCombo.set(null);
    this.form = { name: '', description: '', price: 0 };
    this.selectedImage = null;
    this.existingImageUrl.set(null);
    this.modalKey.update((k) => k + 1);
    this.modalOpen.set(true);
  }

  protected openEdit(combo: Combo): void {
    this.editingCombo.set(combo);
    this.form = {
      name: combo.name,
      description: combo.description,
      price: combo.price,
    };
    this.selectedImage = null;
    this.existingImageUrl.set(combo.image_url || null);
    this.modalOpen.set(true);
  }

  protected closeModal(): void {
    this.modalOpen.set(false);
  }

  protected onImageChange(file: File | null): void {
    this.selectedImage = file;
  }

  protected save(): void {
    if (!this.form.name.trim()) return;
    this.saving.set(true);

    const body: { name: string; description?: string; price: number } = {
      name: this.form.name,
      price: this.form.price,
    };
    if (this.form.description) {
      body.description = this.form.description;
    }

    const request = this.editingCombo()
      ? this.comboService.update(this.editingCombo()!.id, body)
      : this.comboService.create(body);

    request.subscribe({
      next: (saved) => {
        if (this.selectedImage && saved.id) {
          this.comboService.uploadImage(saved.id, this.selectedImage).subscribe({
            next: () => {
              this.saving.set(false);
              this.closeModal();
              this.loadCombos();
            },
            error: () => {
              this.saving.set(false);
              this.closeModal();
              this.loadCombos();
            },
          });
        } else {
          this.saving.set(false);
          this.closeModal();
          this.loadCombos();
        }
      },
      error: () => {
        this.saving.set(false);
        this.apiError.set('Error al guardar el combo. Intenta de nuevo.');
      },
    });
  }

  protected confirmDelete(combo: Combo): void {
    this.deletingId.set(combo.id);
    this.deleteDialogOpen.set(true);
  }

  protected executeDelete(): void {
    const id = this.deletingId();
    if (id === null) return;

    this.deleting.set(true);
    this.comboService.delete(id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteDialogOpen.set(false);
        this.deletingId.set(null);
        this.loadCombos();
      },
      error: () => {
        this.deleting.set(false);
        this.apiError.set('Error al eliminar el combo. Intenta de nuevo.');
      },
    });
  }
}
