import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { PromotionItem } from '../models/promotion-item';
import { AuthService } from './auth.service';
import { PaginationMeta, normalizePagination } from '../models/api-response';

interface MessageResponse {
  message: string;
}

@Injectable({ providedIn: 'root' })
export class PromotionService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  private get base(): string {
    return `${environment.apiURL}/promotions`;
  }

  private get headers(): HttpHeaders {
    return new HttpHeaders({ 'x-restaurant-id': this.auth.restaurantId ?? '' });
  }

  getAll(): Observable<PromotionItem[]> {
    return this.http.get<any>(this.base, { headers: this.headers }).pipe(map((res) => res.data ?? res));
  }

  getPaginated(page = 1, limit = 10, search = ''): Observable<{ data: PromotionItem[]; meta: PaginationMeta }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    if (search) params = params.set('search', search);
    return this.http.get<any>(this.base, { params, headers: this.headers }).pipe(
      map((res) => ({
        data: res.data ?? res,
        meta: res.pagination ? normalizePagination(res.pagination) : { current_page: page, total_pages: 1, total_items: (res.data ?? res).length, has_next: false, has_prev: false, limit },
      }))
    );
  }

  getById(id: number): Observable<PromotionItem> {
    return this.http.get<any>(`${this.base}/${id}`, { headers: this.headers }).pipe(map((res) => res.data ?? res));
  }

  create(formData: FormData): Observable<PromotionItem> {
    return this.http.post<any>(this.base, formData, { headers: this.headers }).pipe(map((res) => res.data ?? res));
  }

  update(id: number, formData: FormData): Observable<PromotionItem> {
    return this.http.put<any>(`${this.base}/${id}`, formData, { headers: this.headers }).pipe(map((res) => res.data ?? res));
  }

  delete(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.base}/${id}`, { headers: this.headers });
  }
}
