import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Product } from '../models/product';
import { ProductPrice, PriceRange } from '../models/product-price';
import { Promotion } from '../models/promotion';
import { PaginationMeta, normalizePagination } from '../models/api-response';

interface MessageResponse {
  message: string;
}

function defaultsPrice(p: any): ProductPrice {
  return {
    ...p,
    price: String(p.price),
    startDay: p.startDay ?? null,
    endDay: p.endDay ?? null,
    startDatetime: p.startDatetime ?? null,
    endDatetime: p.endDatetime ?? null,
    ruleType: p.ruleType,
  };
}

function defaultsRange(r: any): PriceRange {
  return {
    ...r,
    quantity: String(r.quantity),
    price: String(r.price),
    bonus: r.bonus ?? null,
    isDefault: r.isDefault ?? false,
  };
}

function defaultsProduct(p: any): Product {
  return {
    ...p,
    price: p.price ?? null,
    isActive: p.isActive ?? true,
    isRecommended: p.isRecommended ?? p.is_recommended ?? p.isRecomended ?? p.is_recomended ?? false,
    categoryId: p.categoryId ?? null,
    imageUrl: p.imageUrl ?? null,
    imagePublicId: p.imagePublicId ?? null,
    prices: (p.prices ?? []).map(defaultsPrice),
    priceRanges: (p.priceRanges ?? []).map(defaultsRange),
  };
}

function defaultsPromotion(p: any, price: any): Promotion {
  return {
    id: String(price.id),
    productId: String(p.id),
    price: String(price.price),
    name: price.name ?? p.name,
    description: price.description ?? null,
    startDay: price.startDay ?? null,
    endDay: price.endDay ?? null,
    startDatetime: price.startDatetime ?? null,
    endDatetime: price.endDatetime ?? null,
    ruleType: price.ruleType,
    productName: p.name,
    productPrice: String(p.price),
    productImage: p.image_url ?? null,
  };
}

function fallbackMeta(page: number, total: number, limit: number): PaginationMeta {
  return {
    current_page: page,
    total_pages: 1,
    total_items: total,
    has_next: false,
    has_prev: false,
    limit,
  };
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiURL}/products`;

  getAll(): Observable<Product[]> {
    return this.http.get<any>(this.apiUrl).pipe(map((res) => (res.data ?? res).map(defaultsProduct)));
  }

  getPaginated(page = 1, limit = 10, search = '', category = ''): Observable<{ data: Product[]; meta: PaginationMeta }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    if (search) params = params.set('search', search);
    if (category) params = params.set('category', category);
    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((res) => ({
        data: (res.data ?? []).map(defaultsProduct),
        meta: res.pagination ? normalizePagination(res.pagination) : fallbackMeta(page, (res.data ?? []).length, limit),
      }))
    );
  }

  getById(id: number): Observable<Product> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(map((res) => defaultsProduct(res.data ?? res)));
  }

  getPromotions(page = 1, limit = 10): Observable<{ data: Promotion[]; meta: PaginationMeta }> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<any>(`${this.apiUrl}/promotions`, { params }).pipe(
      map((res) => {
        const items = res.data?.data ?? res.data ?? [];
        const promotions: Promotion[] = [];
        for (const p of items) {
          for (const price of (p.prices ?? [])) {
            promotions.push(defaultsPromotion(p, price));
          }
        }
        const pagination = res.pagination ?? res.data?.pagination;
        return {
          data: promotions,
          meta: pagination ? normalizePagination(pagination) : fallbackMeta(page, promotions.length, limit),
        };
      })
    );
  }

  create(formData: FormData): Observable<Product> {
    return this.http.post<any>(this.apiUrl, formData).pipe(map((res) => defaultsProduct(res.data ?? res)));
  }

  update(id: number, formData: FormData): Observable<Product> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, formData).pipe(map((res) => defaultsProduct(res.data ?? res)));
  }

  delete(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.apiUrl}/${id}`);
  }
}
