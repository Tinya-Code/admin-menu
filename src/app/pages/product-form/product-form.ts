import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { ToastService } from '../../services/toast.service';
import { Category } from '../../models/category';
import { Button } from '../../components/shared/button';
import { ImageUploader } from '../../components/shared/image-uploader';

interface DayGroupData {
  id?: string;
  startDay: number;
  endDay: number;
  price: number;
}

interface PromotionData {
  id?: string;
  name: string;
  price: number;
  startDate: string;
  endDate: string;
}

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [ReactiveFormsModule, Button, ImageUploader],
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

  protected readonly dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  protected loading = signal(true);
  protected saving = signal(false);
  protected pageTitle = signal('');
  protected isEditing = signal(false);
  protected categories = signal<Category[]>([]);
  protected productForm: FormGroup;

  protected selectedImage: File | null = null;
  protected existingImageUrl = signal<string | null>(null);

  protected showDayPrices = signal(false);
  protected showPromotions = signal(false);

  protected dayGroups = signal<DayGroupData[]>([]);
  protected showDayGroupForm = signal(false);
  protected editingDayGroupIndex = signal<number | null>(null);
  protected confirmDeleteDayIndex = signal<number | null>(null);
  protected dayOverlapWarning = signal<string | null>(null);

  protected promotions = signal<PromotionData[]>([]);
  protected showPromotionForm = signal(false);
  protected editingPromotionIndex = signal<number | null>(null);
  protected confirmDeletePromoIndex = signal<number | null>(null);

  protected dayGroupForm: { days: boolean[]; price: FormControl<number> };
  protected promotionForm: FormGroup;

  get dayGroupFormValid(): boolean {
    return this.dayGroupForm.price.valid && this.dayGroupForm.days.some(d => d);
  }

  constructor() {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(255)]],
      description: ['', Validators.maxLength(1000)],
      categoryId: [null],
      basePrice: [0, [Validators.required, Validators.min(0.01)]],
      status: [true],
    });

    this.dayGroupForm = {
      days: Array(7).fill(false),
      price: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0.01)] }),
    };

    this.promotionForm = this.fb.group({
      name: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0.01)]],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.categoryService.getAll().subscribe({
      next: (res) => this.categories.set(res.data),
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
        const product = prodRes.data;
        this.existingImageUrl.set(product.image_url);
        this.productForm.patchValue({
          name: product.name,
          description: product.description,
          categoryId: product.category_id,
          basePrice: product.price,
          status: product.is_active,
        });

        const dayPrices: DayGroupData[] = [];
        const promos: PromotionData[] = [];
        for (const p of (product.prices ?? [])) {
          if (p.rule_type === 'DAY') {
            dayPrices.push({ id: p.id, startDay: p.start_day ?? 1, endDay: p.end_day ?? 7, price: p.price });
          } else {
            promos.push({ id: p.id, name: 'Promoción', price: p.price, startDate: p.start_datetime ?? '', endDate: p.end_datetime ?? '' });
          }
        }
        if (dayPrices.length > 0) this.showDayPrices.set(true);
        if (promos.length > 0) this.showPromotions.set(true);
        this.dayGroups.set(dayPrices);
        this.promotions.set(promos);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); this.toast.show('Error al cargar el producto', 'error'); },
    });
  }

  protected goBack(): void {
    if (window.history.length > 1) this.location.back();
    else this.router.navigate(['/products']);
  }

  protected onImageChange(file: File | null): void { this.selectedImage = file; }

  protected toggleStatus(): void {
    const c = this.productForm.get('status');
    c?.setValue(!c?.value);
  }

  protected toggleDayPrices(): void {
    this.showDayPrices.set(!this.showDayPrices());
    if (!this.showDayPrices()) this.dayGroups.set([]);
    this.cancelDayGroupForm();
  }

  protected togglePromotions(): void {
    this.showPromotions.set(!this.showPromotions());
    if (!this.showPromotions()) this.promotions.set([]);
    this.cancelPromotionForm();
  }

  protected openDayGroupForm(): void {
    this.dayGroupForm = {
      days: Array(7).fill(false),
      price: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0.01)] }),
    };
    this.editingDayGroupIndex.set(null);
    this.dayOverlapWarning.set(null);
    this.showDayGroupForm.set(true);
  }

  protected editDayGroup(index: number): void {
    const group = this.dayGroups()[index];
    const days = Array(7).fill(false);
    for (let i = group.startDay - 1; i < group.endDay; i++) days[i] = true;
    this.dayGroupForm = {
      days,
      price: new FormControl(group.price, { nonNullable: true, validators: [Validators.required, Validators.min(0.01)] }),
    };
    this.editingDayGroupIndex.set(index);
    this.dayOverlapWarning.set(null);
    this.showDayGroupForm.set(true);
  }

  protected cancelDayGroupForm(): void {
    this.showDayGroupForm.set(false);
    this.editingDayGroupIndex.set(null);
    this.dayOverlapWarning.set(null);
  }

  protected isDayTaken(day: number): boolean {
    const editingIdx = this.editingDayGroupIndex();
    return this.dayGroups().some((g, i) =>
      editingIdx !== null && i === editingIdx ? false : day >= g.startDay && day <= g.endDay
    );
  }

  protected toggleDayCheckbox(index: number): void {
    this.dayGroupForm.days[index] = !this.dayGroupForm.days[index];
    this.dayOverlapWarning.set(null);
  }

  protected saveDayGroup(): void {
    if (this.dayGroupForm.price.invalid) return;
    const selected = this.dayGroupForm.days
      .map((c, i) => c ? i + 1 : null)
      .filter((d): d is number => d !== null);
    if (selected.length === 0) { this.dayOverlapWarning.set('Selecciona al menos un día.'); return; }
    const min = Math.min(...selected), max = Math.max(...selected);
    const editingIdx = this.editingDayGroupIndex();
    for (const [i, g] of this.dayGroups().entries()) {
      if (editingIdx !== null && i === editingIdx) continue;
      if (min <= g.endDay && max >= g.startDay) {
        this.dayOverlapWarning.set('Los días seleccionados se superponen con otro grupo existente.');
        return;
      }
    }
    const group: DayGroupData = { startDay: min, endDay: max, price: this.dayGroupForm.price.value };
    if (editingIdx !== null) {
      const existing = this.dayGroups()[editingIdx];
      if (existing.id) group.id = existing.id;
      this.dayGroups.update(list => { const n = [...list]; n[editingIdx] = group; return n; });
    } else {
      this.dayGroups.update(list => [...list, group]);
    }
    this.cancelDayGroupForm();
  }

  protected requestDeleteDay(index: number): void { this.confirmDeleteDayIndex.set(index); }

  protected confirmDeleteDay(): void {
    const idx = this.confirmDeleteDayIndex();
    if (idx === null) return;
    this.dayGroups.update(list => list.filter((_, i) => i !== idx));
    this.confirmDeleteDayIndex.set(null);
  }

  protected cancelDeleteDay(): void { this.confirmDeleteDayIndex.set(null); }

  protected openPromotionForm(): void {
    this.promotionForm.reset({ name: '', price: 0, startDate: '', endDate: '' });
    this.editingPromotionIndex.set(null);
    this.showPromotionForm.set(true);
  }

  protected editPromotion(index: number): void {
    const promo = this.promotions()[index];
    this.promotionForm.setValue({ name: promo.name, price: promo.price, startDate: promo.startDate, endDate: promo.endDate });
    this.editingPromotionIndex.set(index);
    this.showPromotionForm.set(true);
  }

  protected cancelPromotionForm(): void { this.showPromotionForm.set(false); this.editingPromotionIndex.set(null); }

  protected savePromotion(): void {
    if (this.promotionForm.invalid) return;
    const raw = this.promotionForm.value;
    const promo: PromotionData = { name: raw.name, price: raw.price, startDate: raw.startDate, endDate: raw.endDate };
    const editingIdx = this.editingPromotionIndex();
    if (editingIdx !== null) {
      const existing = this.promotions()[editingIdx];
      if (existing.id) promo.id = existing.id;
      this.promotions.update(list => { const n = [...list]; n[editingIdx] = promo; return n; });
    } else {
      this.promotions.update(list => [...list, promo]);
    }
    this.cancelPromotionForm();
  }

  protected requestDeletePromo(index: number): void { this.confirmDeletePromoIndex.set(index); }

  protected confirmDeletePromo(): void {
    const idx = this.confirmDeletePromoIndex();
    if (idx === null) return;
    this.promotions.update(list => list.filter((_, i) => i !== idx));
    this.confirmDeletePromoIndex.set(null);
  }

  protected cancelDeletePromo(): void { this.confirmDeletePromoIndex.set(null); }

  protected formatDate(value: string): string {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  protected formatDayRange(start: number, end: number): string {
    if (start === end) return this.dayNames[start - 1];
    return `${this.dayNames[start - 1]} - ${this.dayNames[end - 1]}`;
  }

  protected async save(): Promise<void> {
    if (this.productForm.invalid) { this.productForm.markAllAsTouched(); return; }
    this.saving.set(true);

    try {
      const raw = this.productForm.value;
      const formData = new FormData();
      formData.append('name', raw.name);
      formData.append('description', raw.description || '');
      formData.append('category_id', raw.categoryId ?? '');
      formData.append('price', String(raw.basePrice));
      formData.append('is_active', raw.status ? '1' : '0');
      if (this.selectedImage) formData.append('image', this.selectedImage);

      // Build prices array as JSON
      const prices: any[] = [];
      for (const group of this.dayGroups()) {
        const entry: any = { price: group.price, rule_type: 'DAY', start_day: group.startDay, end_day: group.endDay };
        if (group.id) entry.id = group.id;
        prices.push(entry);
      }
      for (const promo of this.promotions()) {
        const entry: any = {
          price: promo.price,
          rule_type: 'PROMOTION',
          start_datetime: promo.startDate ? promo.startDate.replace('T', ' ') + ':00' : null,
          end_datetime: promo.endDate ? promo.endDate.replace('T', ' ') + ':00' : null,
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
