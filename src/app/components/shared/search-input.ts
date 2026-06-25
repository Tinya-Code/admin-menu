import { Component, input, output, model } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="relative">
      <svg
        class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        [ngModel]="searchTerm()"
        (ngModelChange)="searchTerm.set($event); onSearch.emit($event)"
        [placeholder]="placeholder()"
        class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm
               focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent
               placeholder:text-gray-400 transition-all"
        type="text"
      />
    </div>
  `,
})
export class SearchInput {
  readonly placeholder = input('Buscar...');
  readonly searchTerm = model('');
  readonly onSearch = output<string>();
}
