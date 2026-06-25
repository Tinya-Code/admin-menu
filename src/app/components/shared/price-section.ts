import { Component, input, output } from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-price-section',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <div class="flex items-center justify-between mb-4">
        <div>
          <label class="text-sm font-semibold text-gray-900">Precios especiales</label>
          <p class="text-xs text-gray-400">Promociones o precios por día de la semana</p>
        </div>
        <button
          type="button"
          role="switch"
          [attr.aria-checked]="enabled()"
          class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
          [class.bg-[var(--color-primary)]]="enabled()"
          [class.bg-gray-300]="!enabled()"
          (click)="toggle.emit()"
        >
          <span
            class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm"
            [class.translate-x-6]="enabled()"
            [class.translate-x-1]="!enabled()"
          ></span>
        </button>
      </div>

      @if (enabled() && formArray() && formArray().controls.length > 0) {
        <div class="space-y-4" [formGroup]="formGroup()">
          <div formArrayName="prices">
            @for (group of formArray().controls; track $index) {
              <div
                class="bg-gray-50 rounded-lg border border-gray-200 p-4 relative mb-4"
                [formGroupName]="$index"
              >
                <button
                  type="button"
                  class="absolute top-3 right-3 w-5 h-5 text-gray-400 hover:text-red-500 transition-colors"
                  (click)="remove.emit($index)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
                    <input
                      formControlName="name"
                      placeholder="Ej: Promoción verano"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Precio especial</label>
                    <div class="relative">
                      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        formControlName="price"
                        placeholder="0.00"
                        class="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
                    <select
                      formControlName="ruleType"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent bg-white"
                    >
                      <option value="DAY">Precio por día</option>
                      <option value="PROMOTION">Promoción</option>
                    </select>
                  </div>

                  @if (group.get('ruleType')?.value === 'DAY') {
                    <div class="grid grid-cols-2 gap-2">
                      <div>
                        <label class="block text-xs font-medium text-gray-600 mb-1">Día inicio</label>
                        <input
                          type="number"
                          min="1"
                          max="7"
                          formControlName="startDay"
                          placeholder="1"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-600 mb-1">Día fin</label>
                        <input
                          type="number"
                          min="1"
                          max="7"
                          formControlName="endDay"
                          placeholder="2"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                        />
                      </div>
                    </div>
                  }

                  @if (group.get('ruleType')?.value === 'PROMOTION') {
                    <div class="grid grid-cols-2 gap-2">
                      <div>
                        <label class="block text-xs font-medium text-gray-600 mb-1">Fecha inicio</label>
                        <input
                          type="datetime-local"
                          formControlName="startDate"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-600 mb-1">Fecha fin</label>
                        <input
                          type="datetime-local"
                          formControlName="endDate"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                        />
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          </div>

          <button
            type="button"
            class="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
            (click)="add.emit()"
          >
            + Agregar precio
          </button>
        </div>
      }
    </div>
  `,
})
export class PriceSection {
  readonly enabled = input(false);
  readonly formGroup = input.required<FormGroup>();
  readonly formArray = input.required<FormArray>();
  readonly toggle = output();
  readonly add = output();
  readonly remove = output<number>();
}
