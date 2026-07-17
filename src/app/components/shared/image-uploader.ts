import { Component, input, output, signal, ViewChild, ElementRef, OnChanges, SimpleChanges } from '@angular/core';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

@Component({
  selector: 'app-image-uploader',
  standalone: true,
  template: `
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Imagen del producto</label>

      <input
        #fileInput
        type="file"
        accept="image/jpeg,image/png,image/webp"
        class="hidden"
        (change)="onFileSelected($event)"
      />

      @if (previewUrl()) {
        <!-- Preview card -->
        <div class="bg-gray-50 rounded-xl border border-gray-200 p-4">
          <div class="flex items-start gap-4">
            <div class="w-24 h-24 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-white">
              <img [src]="previewUrl()" alt="Preview" class="w-full h-full object-cover" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">{{ fileName() }}</p>
              <p class="text-xs text-gray-500 mt-0.5">{{ fileSize() }}</p>
              <div class="flex gap-2 mt-3">
                <button
                  type="button"
                  class="text-xs text-[var(--color-primary)] font-medium hover:underline"
                  (click)="openFilePicker()"
                >
                  Reemplazar
                </button>
                <button
                  type="button"
                  class="text-xs text-red-600 font-medium hover:underline"
                  (click)="remove()"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      } @else if (currentUrl() && !deleted()) {
        <!-- Existing image -->
        <div class="bg-gray-50 rounded-xl border border-gray-200 p-4">
          <div class="flex items-start gap-4">
            <div class="w-24 h-24 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-white">
              <img [src]="currentUrl()" alt="Imagen actual" class="w-full h-full object-cover" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-500">Imagen actual</p>
              <div class="flex gap-2 mt-2">
                <button
                  type="button"
                  class="text-xs text-[var(--color-primary)] font-medium hover:underline"
                  (click)="openFilePicker()"
                >
                  Reemplazar
                </button>
                <button
                  type="button"
                  class="text-xs text-red-600 font-medium hover:underline"
                  (click)="removeExisting()"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      } @else {
        <!-- Drop zone -->
        <div
          class="relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors hover:border-[var(--color-primary)]"
          [class.border-red-300]="!!error()"
          [class.border-gray-300]="!error()"
          [class.bg-red-50]="!!error()"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
          (click)="openFilePicker()"
        >
          <svg class="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p class="text-sm text-gray-600 font-medium">Arrastra una imagen o haz clic para seleccionar</p>
          <p class="text-xs text-gray-400 mt-1">PNG, JPG, WebP — Máx 5 MB</p>
        </div>
      }

      @if (error()) {
        <p class="text-xs text-red-600 mt-1.5 flex items-center gap-1">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {{ error() }}
        </p>
      }
    </div>
  `,
})
export class ImageUploader implements OnChanges {
  readonly currentUrl = input<string | null>(null);
  readonly onFileChange = output<File | null>();
  readonly onDelete = output<boolean>();

  @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;

  protected previewUrl = signal<string | null>(null);
  protected fileName = signal('');
  protected fileSize = signal('');
  protected error = signal<string | null>(null);
  protected selectedFile: File | null = null;
  protected deleted = signal(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentUrl']) {
      this.previewUrl.set(null);
      this.fileName.set('');
      this.fileSize.set('');
      this.error.set(null);
      this.selectedFile = null;
      this.deleted.set(false);
      this.onFileChange.emit(null);
    }
  }

  private validate(file: File): boolean {
    this.error.set(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      this.error.set('Formato no válido. Usa JPG, PNG o WebP.');
      return false;
    }
    if (file.size > MAX_SIZE) {
      this.error.set('La imagen supera los 5 MB.');
      return false;
    }
    return true;
  }

  protected openFilePicker(): void {
    if (this.fileInputRef?.nativeElement) {
      this.fileInputRef.nativeElement.value = '';
    }
    this.fileInputRef?.nativeElement.click();
  }

  protected onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.setFile(file);
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'copy';
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    this.setFile(file);
  }

  private setFile(file: File): void {
    if (!this.validate(file)) return;

    this.selectedFile = file;
    this.fileName.set(file.name);
    this.fileSize.set(this.formatSize(file.size));
    this.previewUrl.set(URL.createObjectURL(file));
    this.onFileChange.emit(file);
  }

  protected remove(): void {
    URL.revokeObjectURL(this.previewUrl() || '');
    this.selectedFile = null;
    this.previewUrl.set(null);
    this.fileName.set('');
    this.fileSize.set('');
    this.error.set(null);
    this.onFileChange.emit(null);
  }

  protected removeExisting(): void {
    this.deleted.set(true);
    this.onDelete.emit(true);
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
