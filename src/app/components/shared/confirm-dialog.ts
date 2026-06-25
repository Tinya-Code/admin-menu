import { Component, input, output } from '@angular/core';
import { Button } from './button';
import { Modal } from './modal';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [Modal, Button],
  template: `
    <app-modal [open]="open()" [title]="title()" size="sm" (onClose)="onCancel.emit()">
      <p class="text-gray-600 text-sm mb-6">{{ message() }}</p>
      <div class="flex justify-end gap-3">
        <app-button variant="secondary" (onClick)="onCancel.emit()">Cancelar</app-button>
        <app-button [variant]="confirmVariant()" [loading]="loading()" (onClick)="onConfirm.emit()">
          {{ confirmText() }}
        </app-button>
      </div>
    </app-modal>
  `,
})
export class ConfirmDialog {
  readonly open = input(false);
  readonly title = input('Confirmar');
  readonly message = input('¿Estás seguro?');
  readonly confirmText = input('Eliminar');
  readonly confirmVariant = input<'primary' | 'danger'>('danger');
  readonly loading = input(false);
  readonly onConfirm = output<void>();
  readonly onCancel = output<void>();
}
