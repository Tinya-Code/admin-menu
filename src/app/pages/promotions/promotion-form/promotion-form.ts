import { Location } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideArrowLeft } from '@lucide/angular';
import { Button } from '../../../components/shared/button';
import { ImageUploader } from '../../../components/shared/image-uploader';
import { PromotionService } from '../../../services/promotion.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-promotion-form',
  standalone: true,
  imports: [ReactiveFormsModule, Button, ImageUploader, LucideArrowLeft],
  templateUrl: './promotion-form.html',
})
export class PromotionForm implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private promotionService = inject(PromotionService);
  private toast = inject(ToastService);
  private location = inject(Location);

  protected loading = signal(true);
  protected saving = signal(false);
  protected pageTitle = signal('');
  protected isEditing = signal(false);
  protected promoForm: FormGroup;

  protected selectedImage: File | null = null;
  protected existingImageUrl = signal<string | null>(null);

  constructor() {
    this.promoForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      basePrice: [0],
      promoPrice: [0, Validators.required],
      startDate: [''],
      endDate: [''],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing.set(true);
      this.pageTitle.set('Editar promoción');
      this.loadPromotion(id);
    } else {
      this.isEditing.set(false);
      this.pageTitle.set('Nueva promoción');
      this.loading.set(false);
    }
  }

  private loadPromotion(id: string): void {
    this.loading.set(true);
    this.promotionService.getById(+id).subscribe({
      next: (promo) => {
        this.existingImageUrl.set(promo.imageUrl);
        this.promoForm.patchValue({
          name: promo.name,
          description: promo.description || '',
          basePrice: promo.basePrice ? +promo.basePrice : 0,
          promoPrice: promo.promoPrice ? +promo.promoPrice : 0,
          startDate: promo.startDate ? promo.startDate.substring(0, 10) : '',
          endDate: promo.endDate ? promo.endDate.substring(0, 10) : '',
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.show('Error al cargar la promoción', 'error');
      },
    });
  }

  protected goBack(): void {
    if (window.history.length > 1) this.location.back();
    else this.router.navigate(['/promotions']);
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

  protected async save(): Promise<void> {
    if (this.promoForm.invalid) {
      this.promoForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);

    try {
      const raw = this.promoForm.value;
      const formData = new FormData();

      formData.append('name', raw.name || '');
      if (raw.description) formData.append('description', raw.description);
      if (raw.basePrice) formData.append('basePrice', raw.basePrice.toString());
      formData.append('promoPrice', raw.promoPrice.toString());
      if (raw.startDate) formData.append('startDate', raw.startDate);
      if (raw.endDate) formData.append('endDate', raw.endDate);

      if (this.selectedImage) {
        formData.append('image', this.selectedImage);
      }

      if (this.isEditing()) {
        const id = this.route.snapshot.paramMap.get('id')!;
        await this.promotionService.update(+id, formData).toPromise();
        this.toast.show('Promoción actualizada', 'success');
      } else {
        await this.promotionService.create(formData).toPromise();
        this.toast.show('Promoción creada', 'success');
      }

      this.router.navigate(['/promotions']);
    } catch (error) {
      this.toast.show('Error al guardar la promoción', 'error');
    } finally {
      this.saving.set(false);
    }
  }
}
