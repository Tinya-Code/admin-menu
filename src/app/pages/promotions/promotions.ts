import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PromotionService } from '../../services/promotion.service';
import { PromotionItem } from '../../models/promotion-item';
import { Button } from '../../components/shared/button';
import { ConfirmDialog } from '../../components/shared/confirm-dialog';
import { SearchInput } from '../../components/shared/search-input';
import { Table, TableColumn } from '../../components/shared/table';
import {
  LucidePlus,
  LucideAlertTriangle,
  LucidePencil,
  LucideTrash2,
} from '@lucide/angular';

@Component({
  selector: 'app-promotions',
  standalone: true,
  imports: [Button, ConfirmDialog, SearchInput, Table, LucidePlus, LucideAlertTriangle, LucidePencil, LucideTrash2],
  templateUrl: './promotions.html',
})
export class Promotions implements OnInit {
  private router = inject(Router);
  private promotionService = inject(PromotionService);

  protected promotions = signal<PromotionItem[]>([]);
  protected loading = signal(true);
  protected apiError = signal<string | null>(null);
  protected searchTerm = signal('');

  protected columns: TableColumn[] = [
    { key: 'image', header: 'Promoción', width: '80px' },
    { key: 'name', header: 'Nombre' },
    { key: 'prices', header: 'Precios', align: 'center', width: '180px' },
    { key: 'dates', header: 'Vigencia' },
    { key: 'actions', header: 'Acciones', align: 'center', width: '120px' },
  ];

  protected rowKey = (row: PromotionItem) => row.id;

  protected deleteDialogOpen = signal(false);
  protected deletingId = signal<number | null>(null);
  protected deleting = signal(false);

  ngOnInit(): void {
    this.loadPromotions();
  }

  protected loadPromotions(): void {
    this.loading.set(true);
    this.apiError.set(null);
    this.promotionService.getPaginated(1, 100, this.searchTerm()).subscribe({
      next: (res) => {
        this.promotions.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.apiError.set('No se pudieron cargar las promociones.');
      },
    });
  }

  protected onSearch(term: string): void {
    this.searchTerm.set(term);
    this.loadPromotions();
  }

  protected formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-PE');
  }

  protected openCreate(): void {
    this.router.navigate(['/promotions/new']);
  }

  protected openEdit(promo: PromotionItem): void {
    this.router.navigate(['/promotions', promo.id]);
  }

  protected confirmDelete(promo: PromotionItem): void {
    this.deletingId.set(promo.id);
    this.deleteDialogOpen.set(true);
  }

  protected executeDelete(): void {
    const id = this.deletingId();
    if (id === null) return;

    this.deleting.set(true);
    this.promotionService.delete(id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteDialogOpen.set(false);
        this.deletingId.set(null);
        this.loadPromotions();
      },
      error: () => {
        this.deleting.set(false);
        this.apiError.set('Error al eliminar la promoción. Intenta de nuevo.');
      },
    });
  }
}
