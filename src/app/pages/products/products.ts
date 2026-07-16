import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { ToastService } from '../../services/toast.service';
import { Product } from '../../models/product';
import { Category } from '../../models/category';
import { PaginationMeta } from '../../models/api-response';
import { Button } from '../../components/shared/button';
import { ConfirmDialog } from '../../components/shared/confirm-dialog';
import { SearchInput } from '../../components/shared/search-input';
import {
  LucidePlus,
  LucideTriangleAlert,
  LucidePackage,
  LucideImage,
  LucidePencil,
  LucideTrash2,
  LucideChevronLeft,
  LucideChevronRight,
  LucideStar,
} from '@lucide/angular';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [Button, ConfirmDialog, SearchInput, LucidePlus, LucideTriangleAlert, LucidePackage, LucideImage, LucidePencil, LucideTrash2, LucideChevronLeft, LucideChevronRight, LucideStar],
  templateUrl: './products.html',
})
export class Products implements OnInit {
  private router = inject(Router);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private toast = inject(ToastService);

  protected products = signal<Product[]>([]);
  protected categories = signal<Category[]>([]);
  protected meta = signal<PaginationMeta | null>(null);
  protected loading = signal(true);
  protected apiError = signal<string | null>(null);
  protected searchTerm = signal('');
  protected currentPage = signal(1);
  protected readonly pageSize = 10;

  protected deleteDialogOpen = signal(false);
  protected deletingId = signal<number | null>(null);
  protected deleting = signal(false);

  ngOnInit(): void {
    this.loadData();
  }

  protected loadData(): void {
    this.loading.set(true);
    this.apiError.set(null);
    this.categoryService.getAll().subscribe({
      next: (catRes) => {
        this.categories.set(catRes);
        this.loadProducts();
      },
      error: () => {
        this.loading.set(false);
        this.apiError.set('No se pudieron cargar las categorías.');
      },
    });
  }

  private loadProducts(): void {
    this.productService.getPaginated(this.currentPage(), this.pageSize, this.searchTerm()).subscribe({
      next: (res) => {
        this.products.set(res.data);
        this.meta.set(res.meta);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.apiError.set('No se pudieron cargar los productos.');
      },
    });
  }

  protected onSearch(term: string): void {
    this.searchTerm.set(term);
    this.currentPage.set(1);
    this.loadProducts();
  }

  protected goToPage(page: number): void {
    if (page < 1 || !this.meta() || page > this.meta()!.total_pages) return;
    this.currentPage.set(page);
    this.loadProducts();
  }

  getCategoryName(id: string | null): string {
    if (!id) return '—';
    return this.categories().find((c) => c.id === id)?.name || '—';
  }

  protected openCreate(): void {
    this.router.navigate(['/products/new']);
  }

  protected openEdit(product: Product): void {
    this.router.navigate(['/products', product.id]);
  }

  protected confirmDelete(product: Product): void {
    this.deletingId.set(product.id);
    this.deleteDialogOpen.set(true);
  }

  protected executeDelete(): void {
    const id = this.deletingId();
    if (!id) return;

    this.deleting.set(true);
    this.productService.delete(id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteDialogOpen.set(false);
        this.deletingId.set(null);
        this.toast.show('Producto eliminado', 'success');
        this.loadData();
      },
      error: () => {
        this.deleting.set(false);
        this.toast.show('Error al eliminar el producto', 'error');
      },
    });
  }
}
