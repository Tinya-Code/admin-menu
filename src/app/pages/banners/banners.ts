import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BannerService } from '../../services/banner.service';
import { ToastService } from '../../services/toast.service';
import { Banner } from '../../models/banner';
import { PaginationMeta } from '../../models/api-response';
import { Button } from '../../components/shared/button';
import { ConfirmDialog } from '../../components/shared/confirm-dialog';
import { SearchInput } from '../../components/shared/search-input';
import {
  LucidePlus,
  LucideTriangleAlert,
  LucideImage,
  LucidePencil,
  LucideTrash2,
  LucideChevronLeft,
  LucideChevronRight,
  LucideToggleLeft,
  LucideToggleRight,
} from '@lucide/angular';

@Component({
  selector: 'app-banners',
  standalone: true,
  imports: [Button, ConfirmDialog, SearchInput, LucidePlus, LucideTriangleAlert, LucideImage, LucidePencil, LucideTrash2, LucideChevronLeft, LucideChevronRight, LucideToggleLeft, LucideToggleRight],
  templateUrl: './banners.html',
})
export class Banners implements OnInit {
  private router = inject(Router);
  private bannerService = inject(BannerService);
  private toast = inject(ToastService);

  protected banners = signal<Banner[]>([]);
  protected meta = signal<PaginationMeta | null>(null);
  protected loading = signal(true);
  protected apiError = signal<string | null>(null);
  protected searchTerm = signal('');
  protected currentPage = signal(1);
  protected readonly pageSize = 10;

  protected deleteDialogOpen = signal(false);
  protected deletingId = signal<string | null>(null);
  protected deleting = signal(false);

  ngOnInit(): void {
    this.loadData();
  }

  protected loadData(): void {
    this.loading.set(true);
    this.apiError.set(null);
    this.loadBanners();
  }

  private loadBanners(): void {
    this.bannerService.getPaginated(this.currentPage(), this.pageSize, this.searchTerm()).subscribe({
      next: (res) => {
        this.banners.set(res.data);
        this.meta.set(res.meta);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.apiError.set('No se pudieron cargar los banners.');
      },
    });
  }

  protected onSearch(term: string): void {
    this.searchTerm.set(term);
    this.currentPage.set(1);
    this.loadBanners();
  }

  protected goToPage(page: number): void {
    if (page < 1 || !this.meta() || page > this.meta()!.total_pages) return;
    this.currentPage.set(page);
    this.loadBanners();
  }

  protected getDisplayEnd(currentPage: number, limit: number, total: number): number {
    return Math.min(currentPage * limit, total);
  }

  protected openCreate(): void {
    this.router.navigate(['/banners/new']);
  }

  protected openEdit(banner: Banner): void {
    this.router.navigate(['/banners', banner.id]);
  }

  protected toggleStatus(banner: Banner): void {
    this.bannerService.toggleStatus(banner.id).subscribe({
      next: (updatedBanner) => {
        this.banners.update((banners) =>
          banners.map((b) => (b.id === updatedBanner.id ? updatedBanner : b))
        );
        this.toast.show(
          updatedBanner.isActive ? 'Banner activado' : 'Banner desactivado',
          'success'
        );
      },
      error: () => {
        this.toast.show('Error al cambiar el estado del banner', 'error');
      },
    });
  }

  protected confirmDelete(banner: Banner): void {
    this.deletingId.set(banner.id);
    this.deleteDialogOpen.set(true);
  }

  protected executeDelete(): void {
    const id = this.deletingId();
    if (!id) return;

    this.deleting.set(true);
    this.bannerService.delete(id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteDialogOpen.set(false);
        this.deletingId.set(null);
        this.toast.show('Banner eliminado', 'success');
        this.loadData();
      },
      error: () => {
        this.deleting.set(false);
        this.toast.show('Error al eliminar el banner', 'error');
      },
    });
  }
}
