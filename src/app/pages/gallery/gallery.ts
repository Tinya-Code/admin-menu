import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideAlertTriangle,
  LucideChevronLeft,
  LucideChevronRight,
  LucideInbox,
  LucidePencil,
  LucidePlus,
  LucideTrash2,
} from '@lucide/angular';
import { Button } from '../../components/shared/button';
import { ConfirmDialog } from '../../components/shared/confirm-dialog';
import { ImageUploader } from '../../components/shared/image-uploader';
import { Modal } from '../../components/shared/modal';
import { SearchInput } from '../../components/shared/search-input';
import { PaginationMeta } from '../../models/api-response';
import { GalleryForm, Gallery as GalleryModel } from '../../models/gallery';
import { GalleryService } from '../../services/gallery.service';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [
    FormsModule,
    Button,
    Modal,
    ConfirmDialog,
    ImageUploader,
    SearchInput,
    LucidePlus,
    LucideAlertTriangle,
    LucideInbox,
    LucidePencil,
    LucideTrash2,
    LucideChevronLeft,
    LucideChevronRight,
  ],
  templateUrl: './gallery.html',
})
export class Gallery implements OnInit {
  private galleryService = inject(GalleryService);

  protected events = signal<GalleryModel[]>([]);
  protected loading = signal(true);
  protected apiError = signal<string | null>(null);
  protected searchTerm = signal('');

  protected currentPage = signal(1);
  protected pageSize = signal(10);
  protected meta = signal<PaginationMeta | null>(null);

  protected modalOpen = signal(false);
  protected editingEvent = signal<GalleryModel | null>(null);
  protected saving = signal(false);
  protected form: GalleryForm = { name: '', description: '' };

  protected deleteDialogOpen = signal(false);
  protected deletingId = signal<string | null>(null);
  protected deleting = signal(false);

  protected selectedImage: File | null = null;
  protected existingImageUrl = signal<string | null>(null);

  protected isFormValid(): boolean {
    const hasName = (this.form.name ?? '').trim().length > 0;
    const hasImage = !!this.selectedImage || !!this.existingImageUrl();
    return hasName && hasImage;
  }

  ngOnInit(): void {
    this.loadEvents();
  }

  protected loadEvents(): void {
    this.loading.set(true);
    this.apiError.set(null);
    this.galleryService.getAll(this.currentPage(), this.pageSize(), this.searchTerm()).subscribe({
      next: (res) => {
        this.events.set(res.data ?? []);
        this.meta.set(res.meta ?? null);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.apiError.set(
          'No se pudo conectar con el servidor. Verifica que la API esté corriendo.',
        );
      },
    });
  }

  protected onSearch(term: string): void {
    this.searchTerm.set(term);
    this.currentPage.set(1);
    this.loadEvents();
  }

  protected goToPage(page: number): void {
    const m = this.meta();
    if (!m || page < 1 || page > m.total_pages) return;
    this.currentPage.set(page);
    this.loadEvents();
  }

  protected get visiblePages(): number[] {
    const m = this.meta();
    if (!m) return [];
    const pages: number[] = [];
    const total = m.total_pages;
    const current = this.currentPage();
    let start = Math.max(1, current - 2);
    let end = Math.min(total, current + 2);
    if (end - start < 4) {
      if (start === 1) end = Math.min(total, start + 4);
      else start = Math.max(1, end - 4);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  protected openCreate(): void {
    this.editingEvent.set(null);
    this.form = { name: '', description: '' };
    this.selectedImage = null;
    this.existingImageUrl.set(null);
    this.modalOpen.set(true);
  }

  protected openEdit(photo: GalleryModel): void {
    this.editingEvent.set(photo);
    this.form = {
      name: photo.title,
      description: photo.description || '',
    };
    this.selectedImage = null;
    this.existingImageUrl.set(photo.image_url || null);
    this.modalOpen.set(true);
  }

  protected closeModal(): void {
    this.modalOpen.set(false);
  }

  protected onImageChange(file: File | null): void {
    this.selectedImage = file;
  }

  protected onImageDelete(deleted: boolean): void {
    if (deleted) {
      this.existingImageUrl.set(null);
      this.selectedImage = null;
    }
  }

  protected save(): void {
    if (!this.isFormValid()) return;
    this.saving.set(true);

    const formData = new FormData();
    formData.append('title', this.form.name);
    formData.append('description', this.form.description || '');
    if (this.selectedImage) {
      formData.append('image', this.selectedImage);
    } else if (this.editingEvent() && this.existingImageUrl()) {
      formData.append('image_url', this.existingImageUrl()!);
    }

    const request = this.editingEvent()
      ? this.galleryService.update(this.editingEvent()!.id, formData)
      : this.galleryService.create(formData);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.loadEvents();
      },
      error: () => {
        this.saving.set(false);
        this.apiError.set('Error al guardar la imagen. Intenta de nuevo.');
      },
    });
  }

  protected confirmDelete(event: GalleryModel): void {
    this.deletingId.set(event.id);
    this.deleteDialogOpen.set(true);
  }

  protected executeDelete(): void {
    const id = this.deletingId();
    if (!id) return;

    this.deleting.set(true);
    this.galleryService.delete(id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteDialogOpen.set(false);
        this.deletingId.set(null);
        this.loadEvents();
      },
      error: () => {
        this.deleting.set(false);
        this.apiError.set('Error al eliminar la imagen. Intenta de nuevo.');
      },
    });
  }
}
