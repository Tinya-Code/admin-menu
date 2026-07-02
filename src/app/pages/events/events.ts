import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EventService } from '../../services/event.service';
import { Event, EventForm } from '../../models/event';
import { PaginationMeta } from '../../models/api-response';
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
  LucideChevronLeft,
  LucideChevronRight,
} from '@lucide/angular';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [FormsModule, Button, Modal, ConfirmDialog, SearchInput, LucidePlus, LucideAlertTriangle, LucideInbox, LucidePencil, LucideTrash2, LucideChevronLeft, LucideChevronRight],
  templateUrl: './events.html',
})
export class Events implements OnInit {
  private eventService = inject(EventService);

  protected events = signal<Event[]>([]);
  protected loading = signal(true);
  protected apiError = signal<string | null>(null);
  protected searchTerm = signal('');

  protected currentPage = signal(1);
  protected pageSize = signal(10);
  protected meta = signal<PaginationMeta | null>(null);

  protected modalOpen = signal(false);
  protected editingEvent = signal<Event | null>(null);
  protected saving = signal(false);
  protected form: EventForm = { name: '', description: '', date: '', time: '' };

  protected deleteDialogOpen = signal(false);
  protected deletingId = signal<string | null>(null);
  protected deleting = signal(false);

  protected selectedImage: File | null = null;
  protected imagePreview = signal<string | null>(null);

  protected isFormValid(): boolean {
    const hasName = this.form.name.trim().length > 0;
    const hasDate = this.form.date.trim().length > 0;
    const hasImage = !!this.selectedImage || !!this.editingEvent()?.image_url;
    if (!hasName || !hasDate || !hasImage) return false;
    return !this.isDatePast();
  }

  protected isDatePast(): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(this.form.date + 'T00:00:00');
    return selected < today;
  }

  ngOnInit(): void {
    this.loadEvents();
  }

  protected loadEvents(): void {
    this.loading.set(true);
    this.apiError.set(null);
    this.eventService.getAll(this.currentPage(), this.pageSize()).subscribe({
      next: (res) => {
        this.events.set(res.data ?? []);
        this.meta.set(res.meta ?? null);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.apiError.set('No se pudo conectar con el servidor. Verifica que la API esté corriendo.');
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
    this.form = { name: '', description: '', date: '', time: '' };
    this.selectedImage = null;
    this.imagePreview.set(null);
    this.modalOpen.set(true);
  }

  protected openEdit(event: Event): void {
    this.editingEvent.set(event);
    const dateStr = event.date || '';
    this.form = {
      name: event.name,
      description: event.description || '',
      date: dateStr ? dateStr.substring(0, 10) : '',
      time: dateStr && dateStr.length > 10 ? dateStr.substring(11, 16) : '',
    };
    this.selectedImage = null;
    this.imagePreview.set(event.image_url || null);
    this.modalOpen.set(true);
  }

  protected closeModal(): void {
    this.modalOpen.set(false);
  }

  protected onImageChange(file: File | null): void {
    this.selectedImage = file;
    if (file) {
      this.imagePreview.set(URL.createObjectURL(file));
    } else if (this.editingEvent()) {
      this.imagePreview.set(this.editingEvent()!.image_url || null);
    } else {
      this.imagePreview.set(null);
    }
  }

  protected save(): void {
    if (!this.isFormValid()) return;
    this.saving.set(true);

    const formData = new FormData();
    formData.append('name', this.form.name);
    formData.append('description', this.form.description || '');
    const dateVal = this.form.date && this.form.time
      ? `${this.form.date} ${this.form.time}`
      : this.form.date || '';
    formData.append('date', dateVal);
    if (this.selectedImage) {
      formData.append('image', this.selectedImage);
    } else if (this.editingEvent()?.image_url) {
      formData.append('image_url', this.editingEvent()!.image_url);
    }

    const request = this.editingEvent()
      ? this.eventService.update(this.editingEvent()!.id, formData)
      : this.eventService.create(formData);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.loadEvents();
      },
      error: () => {
        this.saving.set(false);
        this.apiError.set('Error al guardar el evento. Intenta de nuevo.');
      },
    });
  }

  protected confirmDelete(event: Event): void {
    this.deletingId.set(event.id);
    this.deleteDialogOpen.set(true);
  }

  protected executeDelete(): void {
    const id = this.deletingId();
    if (!id) return;

    this.deleting.set(true);
    this.eventService.delete(id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteDialogOpen.set(false);
        this.deletingId.set(null);
        this.loadEvents();
      },
      error: () => {
        this.deleting.set(false);
        this.apiError.set('Error al eliminar el evento. Intenta de nuevo.');
      },
    });
  }

  protected formatDateTime(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr.replace(' ', 'T'));
    const date = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    if (dateStr.length > 10) {
      const time = dateStr.substring(11, 16);
      return `${date} ${time}`;
    }
    return date;
  }
}
