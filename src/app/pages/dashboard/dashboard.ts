import { Component, inject, OnInit, signal } from '@angular/core';
import { CategoryService } from '../../services/category.service';
import { ProductService } from '../../services/product.service';

interface StatCard {
  label: string;
  value: number;
  icon: string;
  color: string;
  bgColor: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
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
                icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>',
                color: 'text-blue-600',
                bgColor: 'bg-blue-50',
              },
              {
                label: 'Productos activos',
                value: activeProducts,
                icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>',
                color: 'text-emerald-600',
                bgColor: 'bg-emerald-50',
              },
              {
                label: 'Productos inactivos',
                value: inactiveProducts,
                icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>',
                color: 'text-amber-600',
                bgColor: 'bg-amber-50',
              },
              {
                label: 'Total productos',
                value: products,
                icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>',
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
