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
import { BannerService } from '../../services/banner.service';
import { ToastService } from '../../services/toast.service';
import { LucideArrowLeft } from '@lucide/angular';

@Component({
  selector: 'app-banner-form',
  standalone: true,
  imports: [ReactiveFormsModule, Button, ImageUploader, LucideArrowLeft],
  templateUrl: './banner-form.html',
})
export class BannerForm implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private bannerService = inject(BannerService);
  private toast = inject(ToastService);
  private location = inject(Location);

  protected loading = signal(true);
  protected saving = signal(false);
  protected pageTitle = signal('');
  protected isEditing = signal(false);
  protected bannerForm: FormGroup;

  protected selectedImage: File | null = null;
  protected existingImageUrl = signal<string | null>(null);

  constructor() {
    this.bannerForm = this.fb.group({
      title: ['', Validators.maxLength(255)],
      isActive: [true],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing.set(true);
      this.pageTitle.set('Editar banner');
      this.loadBanner(id);
    } else {
      this.isEditing.set(false);
      this.pageTitle.set('Nuevo banner');
      this.loading.set(false);
    }
  }

  private loadBanner(id: string): void {
    this.loading.set(true);
    this.bannerService.getById(id).subscribe({
      next: (bannerRes) => {
        const banner = bannerRes;
        this.existingImageUrl.set(banner.imageUrl);
        this.bannerForm.patchValue({
          title: banner.title,
          isActive: banner.isActive,
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.show('Error al cargar el banner', 'error');
      },
    });
  }

  protected goBack(): void {
    if (window.history.length > 1) this.location.back();
    else this.router.navigate(['/banners']);
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
    const c = this.bannerForm.get('isActive');
    c?.setValue(!c?.value);
  }

  protected async save(): Promise<void> {
    if (this.bannerForm.invalid) {
      this.bannerForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);

    try {
      const raw = this.bannerForm.value;
      const formData = new FormData();
      formData.append('title', raw.title || '');
      formData.append('isActive', raw.isActive ? 'true' : 'false');

      if (this.selectedImage) {
        formData.append('image', this.selectedImage);
      } else if (this.isEditing()) {
        formData.append('imageUrl', this.existingImageUrl() ?? '');
      }

      if (this.isEditing()) {
        const id = this.route.snapshot.paramMap.get('id')!;
        await this.bannerService.update(id, formData).toPromise();
        this.toast.show('Banner actualizado', 'success');
      } else {
        await this.bannerService.create(formData).toPromise();
        this.toast.show('Banner creado', 'success');
      }

      this.router.navigate(['/banners']);
    } catch (error) {
      this.toast.show('Error al guardar el banner', 'error');
    } finally {
      this.saving.set(false);
    }
  }
}
