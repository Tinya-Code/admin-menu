import { Component, HostListener, input, output, signal } from '@angular/core';
import { LucideCheck, LucideChevronDown, LucideFilter } from '@lucide/angular';

export interface FilterOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-filter-select',
  standalone: true,
  imports: [LucideFilter, LucideCheck, LucideChevronDown],
  template: `
    <div class="relative" (click)="$event.stopPropagation()">
      <button
        type="button"
        (click)="toggle()"
        class="w-full flex items-center gap-2 pl-3 pr-2 py-2 border border-gray-300 rounded-lg text-sm
               hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent
               transition-all text-left"
      >
        <svg lucideFilter class="w-4 h-4 text-gray-400 shrink-0"></svg>
        <span class="flex-1 truncate" [class.text-gray-400]="!selectedLabel()">
          {{ selectedLabel() || placeholder() }}
        </span>
        <svg
          lucideChevronDown
          class="w-4 h-4 text-gray-400 shrink-0 transition-transform"
          [class.rotate-180]="open()"
        ></svg>
      </button>

      @if (open()) {
        <div
          class="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          @for (opt of options(); track opt.value) {
            <button
              type="button"
              (click)="select(opt.value)"
              class="w-full flex items-center gap-2 px-3 py-2 text-sm text-left
                     hover:bg-gray-50 transition-colors"
              [class.bg-[var(--color-primary)]/5]="opt.value === selectedValue()"
              [class.font-medium]="opt.value === selectedValue()"
            >
              <span class="flex-1 truncate" [class.text-[var(--color-primary)]]="opt.value === selectedValue()">
                {{ opt.label }}
              </span>
              @if (opt.value === selectedValue()) {
                <svg lucideCheck class="w-4 h-4 text-[var(--color-primary)] shrink-0"></svg>
              }
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class FilterSelect {
  readonly placeholder = input('Filtrar...');
  readonly options = input<FilterOption[]>([]);
  readonly selectedValue = input('');
  readonly onFilter = output<string>();

  protected open = signal(false);

  protected selectedLabel(): string {
    const val = this.selectedValue();
    if (!val) return '';
    return this.options().find((o) => o.value === val)?.label || '';
  }

  protected toggle(): void {
    this.open.update((v) => !v);
  }

  protected select(value: string): void {
    this.onFilter.emit(value);
    this.open.set(false);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.open.set(false);
  }
}
