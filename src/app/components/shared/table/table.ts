import { NgTemplateOutlet } from '@angular/common';
import { Component, contentChild, input, signal, TemplateRef } from '@angular/core';
import { LucideImage, LucideInbox } from '@lucide/angular';
import { Modal } from '../modal';

export interface TableColumn {
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [NgTemplateOutlet, LucideInbox, LucideImage, Modal],
  templateUrl: './table.html',
})
export class Table {
  readonly data = input<any[]>([]);
  readonly columns = input<TableColumn[]>([]);
  readonly loading = input(false);
  readonly emptyTitle = input('No hay registros');
  readonly emptySubtitle = input('Crea tu primer registro para empezar');
  readonly rowKey = input<(row: any) => any>((row) => row.id);
  readonly imageUrlField = input('image_url');
  readonly nameField = input('name');

  readonly cellTemplate = contentChild<TemplateRef<any>>('cell');
  readonly mobileCardTemplate = contentChild<TemplateRef<any>>('mobileCard');

  protected imagePreviewOpen = signal(false);
  protected imagePreviewUrl = signal('');
  protected imagePreviewName = signal('');

  protected get hasImageColumn(): boolean {
    return this.columns().some((col) => col.key === 'image');
  }

  protected openImagePreview(url: string, name: string): void {
    this.imagePreviewUrl.set(url);
    this.imagePreviewName.set(name);
    this.imagePreviewOpen.set(true);
  }

  protected closeImagePreview(): void {
    this.imagePreviewOpen.set(false);
  }

  protected getImageUrl(row: any): string | null {
    return row[this.imageUrlField()] || null;
  }

  protected getRowName(row: any): string {
    return row[this.nameField()] || '';
  }
}
