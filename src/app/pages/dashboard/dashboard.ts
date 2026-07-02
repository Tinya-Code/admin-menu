import { Component, inject, OnInit, signal } from '@angular/core';
import { CategoryService } from '../../services/category.service';
import { ProductService } from '../../services/product.service';
import { PromotionsTable } from './components/promotions-table/promotions-table';
import {
  LucideDynamicIcon,
  LucideFolderTree,
  LucidePackage,
  LucideClipboardList,
  LucideTriangleAlert,
} from '@lucide/angular';

interface StatCard {
  label: string;
  value: number;
  icon: any;
  color: string;
  bgColor: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [LucideDynamicIcon, LucideFolderTree, LucidePackage, LucideClipboardList, LucideTriangleAlert, PromotionsTable],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private categoryService = inject(CategoryService);
  private productService = inject(ProductService);

  protected stats = signal<StatCard[]>([]);
  protected loading = signal(true);
  protected apiError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadStats();
  }

  protected loadStats(): void {
    this.loading.set(true);
    this.apiError.set(null);
    this.categoryService.getAll().subscribe({
      next: (catRes) => {
        this.productService.getAll().subscribe({
          next: (prodRes) => {
            const categories = catRes.data.length;
            const products = prodRes.data.length;
            const activeProducts = prodRes.data.filter((p) => p.is_active).length;
            const inactiveProducts = products - activeProducts;

            this.stats.set([
              {
                label: 'Categorías',
                value: categories,
                icon: LucideFolderTree,
                color: 'text-blue-600',
                bgColor: 'bg-blue-50',
              },
              {
                label: 'Productos activos',
                value: activeProducts,
                icon: LucidePackage,
                color: 'text-emerald-600',
                bgColor: 'bg-emerald-50',
              },
              {
                label: 'Productos inactivos',
                value: inactiveProducts,
                icon: LucidePackage,
                color: 'text-amber-600',
                bgColor: 'bg-amber-50',
              },
              {
                label: 'Total productos',
                value: products,
                icon: LucideClipboardList,
                color: 'text-purple-600',
                bgColor: 'bg-purple-50',
              },
            ]);
            this.loading.set(false);
          },
          error: () => {
            this.loading.set(false);
            this.apiError.set('No se pudieron cargar los productos. Verifica la conexión con la API.');
          },
        });
      },
      error: () => {
        this.loading.set(false);
        this.apiError.set('No se pudieron cargar las categorías. Verifica la conexión con la API.');
      },
    });
  }
}
