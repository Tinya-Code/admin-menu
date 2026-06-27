import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { ToastService } from '../../services/toast.service';
import { Product } from '../../models/product';
import { Category } from '../../models/category';
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
} from '@lucide/angular';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [Button, ConfirmDialog, SearchInput, LucidePlus, LucideTriangleAlert, LucidePackage, LucideImage, LucidePencil, LucideTrash2],
  templateUrl: './products.html',
})
export class Products implements OnInit {
  private router = inject(Router);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private toast = inject(ToastService);

  protected products = signal<Product[]>([]);
  protected filteredProducts = signal<Product[]>([]);
  protected categories = signal<Category[]>([]);
  protected loading = signal(true);
  protected apiError = signal<string | null>(null);
  protected searchTerm = signal('');

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
        this.categories.set(catRes.data);
        this.productService.getAll().subscribe({
          next: (prodRes) => {
            this.products.set(prodRes.data);
            this.applyFilter();
            this.loading.set(false);
          },
          error: () => {
            this.loading.set(false);
            this.apiError.set('No se pudieron cargar los productos.');
          },
        });
      },
      error: () => {
        this.loading.set(false);
        this.apiError.set('No se pudieron cargar las categorías.');
      },
    });
  }

  protected applyFilter(): void {
    const term = this.searchTerm().toLowerCase();
    if (!term) {
      this.filteredProducts.set(this.products());
      return;
    }
    this.filteredProducts.set(
      this.products().filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          (p.category_id !== null &&
            this.categories().find((c) => c.id === p.category_id)?.name
              .toLowerCase()
              .includes(term))
      )
    );
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
