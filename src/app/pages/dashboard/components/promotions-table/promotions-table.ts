import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe, NgClass } from '@angular/common';
import { ProductService } from '../../../../services/product.service';
import { Promotion } from '../../../../models/promotion';
import { PaginationMeta } from '../../../../models/api-response';
import { SearchInput } from '../../../../components/shared/search-input';
import {
  LucideChevronLeft,
  LucideChevronRight,
  LucideInbox,
  LucideTag,
  LucideTriangleAlert,
  LucideFilter,
} from '@lucide/angular';

@Component({
  selector: 'app-promotions-table',
  standalone: true,
  imports: [DecimalPipe, NgClass, SearchInput, LucideChevronLeft, LucideChevronRight, LucideInbox, LucideTag, LucideTriangleAlert, LucideFilter],
  templateUrl: './promotions-table.html',
})
export class PromotionsTable implements OnInit {
  private productService = inject(ProductService);

  protected promotions = signal<Promotion[]>([]);
  protected meta = signal<PaginationMeta | null>(null);
  protected loading = signal(true);
  protected apiError = signal<string | null>(null);
  protected currentPage = signal(1);
  protected filterActive = signal(false);
  protected searchTerm = signal('');
  protected readonly pageSize = 10;

  protected filteredRows = computed(() => {
    let rows = [...this.promotions()];
    if (this.filterActive()) {
      const now = new Date();
      rows = rows.filter((r) => this.isPromoActive(r, now));
    }
    const term = this.searchTerm().toLowerCase().trim();
    if (term) {
      rows = rows.filter(
        (r) =>
          r.productName.toLowerCase().includes(term) ||
          (r.name ?? '').toLowerCase().includes(term),
      );
    }
    rows.sort((a, b) => {
      const dateA = a.startDatetime ? new Date(a.startDatetime).getTime() : Infinity;
      const dateB = b.startDatetime ? new Date(b.startDatetime).getTime() : Infinity;
      return dateA - dateB;
    });
    return rows;
  });

  ngOnInit(): void {
    this.loadPromotions();
  }

  protected loadPromotions(): void {
    this.loading.set(true);
    this.apiError.set(null);
    this.productService.getPromotions(this.currentPage(), this.pageSize).subscribe({
      next: (res) => {
        this.promotions.set(res.data);
        this.meta.set(res.meta);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.promotions.set([]);
        this.meta.set(null);
      },
    });
  }

  protected goToPage(page: number): void {
    if (page < 1 || !this.meta() || page > this.meta()!.total_pages) return;
    this.currentPage.set(page);
    this.loadPromotions();
  }

  protected toggleFilter(): void {
    this.filterActive.update((v) => !v);
  }

  protected onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  protected isPromoActive(promo: Promotion, _now?: Date | null): boolean {
    if (!promo.startDatetime || !promo.endDatetime) return false;
    const now = new Date();
    const start = new Date(promo.startDatetime);
    const end = new Date(promo.endDatetime);
    return now >= start && now <= end;
  }

  protected formatDate(dateStr: string | null): string {
    if (!dateStr) return 'Sin fecha';
    return new Date(dateStr).toLocaleDateString('es-PE');
  }

  protected parsePrice(price: string): number {
    return parseFloat(price) || 0;
  }
}
