import { Component, input, model, OnDestroy, OnInit, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';

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
        (ngModelChange)="onInput($event)"
        [placeholder]="placeholder()"
        class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm
               focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent
               placeholder:text-gray-400 transition-all"
        type="text"
      />
    </div>
  `,
})
export class SearchInput implements OnInit, OnDestroy {
  readonly placeholder = input('Buscar...');
  readonly searchTerm = model('');
  readonly onSearch = output<string>();

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe((value) => {
        this.searchTerm.set(value);
        this.onSearch.emit(value);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected onInput(value: string): void {
    this.searchSubject.next(value);
  }
}
