import { Location } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Button } from '../../components/shared/button';
import { ImageUploader } from '../../components/shared/image-uploader';
import { Category } from '../../models/category';
import { CategoryService } from '../../services/category.service';
import { ProductService } from '../../services/product.service';
import { ToastService } from '../../services/toast.service';
import { DayPrices, DayGroupData } from './components/day-prices';
import { Promotions, PromotionData } from './components/promotions';
import { VariantPrice, PriceRangeData } from './components/variant-price';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [ReactiveFormsModule, Button, ImageUploader, DayPrices, Promotions, VariantPrice],
  templateUrl: './product-form.html',
})
export class ProductForm implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private toast = inject(ToastService);
  private location = inject(Location);

  protected loading = signal(true);
  protected saving = signal(false);
  protected pageTitle = signal('');
  protected isEditing = signal(false);
  protected categories = signal<Category[]>([]);
  protected productForm: FormGroup;

  protected selectedImage: File | null = null;
  protected existingImageUrl = signal<string | null>(null);

  protected dayGroups = signal<DayGroupData[]>([]);

  protected promotions = signal<PromotionData[]>([]);

  protected priceRanges = signal<PriceRangeData[]>([]);

  constructor() {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(255)]],
      description: ['', Validators.maxLength(1000)],
      categoryId: [null],
      priceType: ['fixed', Validators.required],
      basePrice: [null, [Validators.min(0.01)]],
      status: [true],
      isRecommended: [false],
    });

    this.productForm.get('priceType')!.valueChanges.subscribe((type: string) => {
      const basePriceCtrl = this.productForm.get('basePrice');
      if (type === 'fixed') {
        basePriceCtrl!.setValidators([Validators.required, Validators.min(0.01)]);
      } else {
        basePriceCtrl!.clearValidators();
        basePriceCtrl!.setValue(null);
      }
      basePriceCtrl!.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    this.categoryService.getAll().subscribe({
      next: (res) => this.categories.set(res),
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing.set(true);
      this.pageTitle.set('Editar producto');
      this.loadProduct(Number(id));
    } else {
      this.isEditing.set(false);
      this.pageTitle.set('Nuevo producto');
      this.loading.set(false);
    }
  }

  private loadProduct(id: number): void {
    this.loading.set(true);
    this.productService.getById(id).subscribe({
      next: (prodRes) => {
        const product = prodRes;
        this.existingImageUrl.set(product.imageUrl);
        const hasPriceRanges = product.priceRanges && product.priceRanges.length > 0;
        this.productForm.patchValue({
          name: product.name,
          description: product.description,
          categoryId: product.categoryId,
          priceType: hasPriceRanges ? 'variable' : 'fixed',
          basePrice: product.price ? Number(product.price) : null,
          status: product.isActive,
          isRecommended: product.isRecommended ?? false,
        });

        const dayPrices: DayGroupData[] = [];
        const promos: PromotionData[] = [];
        for (const p of product.prices ?? []) {
          if (p.ruleType === 'DAY') {
            const start = p.startDay ?? 1;
            const end = p.endDay ?? 7;
            const days: number[] = [];
            for (let d = start; d <= end; d++) {
              days.push(d === 7 ? 0 : d);
            }
            dayPrices.push({
              id: String(p.id),
              days,
              price: Number(p.price),
            });
          } else {
            promos.push({
              id: String(p.id),
              name: p.name ?? 'Promoción',
              price: Number(p.price),
              startDate: p.startDatetime ?? '',
              endDate: p.endDatetime ?? '',
            });
          }
        }
        this.dayGroups.set(dayPrices);
        this.promotions.set(promos);

        const ranges: PriceRangeData[] = (product.priceRanges ?? []).map(
          (r: any) => ({
            id: r.id,
            quantity: Number(r.quantity),
            unit: r.unit,
            price: Number(r.price),
            bonus: r.bonus ?? '',
            sort_order: r.sort_order ?? 0,
            is_default: r.isDefault ?? false,
          })
        );
        this.priceRanges.set(ranges);

        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.show('Error al cargar el producto', 'error');
      },
    });
  }

  protected goBack(): void {
    if (window.history.length > 1) this.location.back();
    else this.router.navigate(['/products']);
  }

  protected onImageChange(file: File | null): void {
    this.selectedImage = file;
  }

  protected onImageDelete(deleted: boolean): void {
    if (deleted) {
      this.existingImageUrl.set(null);
      this.selectedImage = null;
    }
  }

  protected toggleStatus(): void {
    const c = this.productForm.get('status');
    c?.setValue(!c?.value);
  }

  protected toggleRecommended(): void {
    const c = this.productForm.get('isRecommended');
    c?.setValue(!c?.value);
  }

  protected async save(): Promise<void> {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);

    try {
      const raw = this.productForm.value;
      const formData = new FormData();
      formData.append('name', raw.name);
      formData.append('description', raw.description || '');
      formData.append('category_id', raw.categoryId ?? '');
      formData.append('is_active', raw.status ? 'true' : 'false');
      formData.append('is_recommended', raw.isRecommended ? 'true' : 'false');
      formData.append('is_recomended', raw.isRecommended ? 'true' : 'false');

      if (raw.priceType === 'fixed') {
        formData.append('price', String(raw.basePrice ?? 0));
        formData.append('price_ranges', JSON.stringify([]));
      } else {
        formData.append('price', '0');
        const priceRangesPayload = this.priceRanges().map((r, i) => {
          const entry: any = {
            quantity: r.quantity,
            unit: r.unit,
            price: r.price,
            bonus: r.bonus || null,
            sort_order: i,
            is_default: r.is_default ? 1 : 0,
          };
          if (r.id) entry.id = r.id;
          return entry;
        });
        formData.append('price_ranges', JSON.stringify(priceRangesPayload));
      }
      if (this.selectedImage) {
        formData.append('image', this.selectedImage);
      } else if (this.isEditing()) {
        formData.append('image_url', this.existingImageUrl() ?? '');
      }

      // Build prices array as JSON
      const prices: any[] = [];
      for (const group of this.dayGroups()) {
        for (const dayNum of group.days) {
          const entry: any = {
            price: group.price,
            rule_type: 'DAY',
            start_day: dayNum === 0 ? 7 : dayNum,
            end_day: dayNum === 0 ? 7 : dayNum,
          };
          if (group.id) entry.id = group.id;
          prices.push(entry);
        }
      }
      for (const promo of this.promotions()) {
        const entry: any = {
          name: promo.name,
          price: promo.price,
          rule_type: 'PROMOTION',
          start_datetime: promo.startDate ? promo.startDate.replace('T', ' ') + (promo.startDate.includes(':00') ? '' : ':00') : null,
          end_datetime: promo.endDate ? promo.endDate.replace('T', ' ') + (promo.endDate.includes(':00') ? '' : ':00') : null,
        };
        if (promo.id) entry.id = promo.id;
        prices.push(entry);
      }
      formData.append('prices', JSON.stringify(prices));

      const productId = this.route.snapshot.paramMap.get('id');
      if (productId) {
        await new Promise<void>((resolve, reject) => {
          this.productService.update(Number(productId), formData).subscribe({
            next: () => resolve(),
            error: (err) => reject(err),
          });
        });
      } else {
        await new Promise<void>((resolve, reject) => {
          this.productService.create(formData).subscribe({
            next: () => resolve(),
            error: (err) => reject(err),
          });
        });
      }

      this.toast.show(this.isEditing() ? 'Producto actualizado' : 'Producto creado', 'success');
      this.router.navigate(['/products']);
    } catch {
      this.toast.show('Error al guardar el producto', 'error');
    } finally {
      this.saving.set(false);
    }
  }
}
