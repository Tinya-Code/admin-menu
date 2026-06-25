import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-settings-actions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings-actions.html',
})
export class SettingsActions {
  hasChanges = input<boolean>(false);
  isValid = input<boolean>(true);
  isSaving = input<boolean>(false);

  save = output<void>();
  cancel = output<void>();

  onSave() {
    if (!this.isSaving() && this.isValid()) {
      this.save.emit();
    }
  }

  onCancel() {
    if (!this.isSaving()) {
      this.cancel.emit();
    }
  }
}
