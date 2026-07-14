import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Combo } from '../models/combo';
import { AuthService } from './auth.service';
import { PaginationMeta, normalizePagination } from '../models/api-response';

interface MessageResponse {
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ComboService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  private get base(): string {
    return `${environment.apiURL}/restaurants/${this.auth.restaurantId}/combos`;
  }

  getAll(): Observable<Combo[]> {
    return this.http.get<any>(this.base).pipe(map((res) => res.data ?? res));
  }

  getPaginated(page = 1, limit = 10, search = ''): Observable<{ data: Combo[]; meta: PaginationMeta }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    if (search) params = params.set('search', search);
    return this.http.get<any>(this.base, { params }).pipe(
      map((res) => ({
        data: res.data ?? res,
        meta: res.pagination ? normalizePagination(res.pagination) : { current_page: page, total_pages: 1, total_items: (res.data ?? res).length, has_next: false, has_prev: false, limit },
      }))
    );
  }

  getById(id: number): Observable<Combo> {
    return this.http.get<any>(`${environment.apiURL}/combos/${id}`).pipe(map((res) => res.data ?? res));
  }

  create(data: { name: string; description?: string; price: number }): Observable<Combo> {
    return this.http.post<any>(`${environment.apiURL}/combos`, { ...data, restaurant_id: this.auth.restaurantId }).pipe(map((res) => res.data ?? res));
  }

  update(id: number, data: { name?: string; description?: string; price?: number }): Observable<Combo> {
    return this.http.patch<any>(`${environment.apiURL}/combos/${id}`, data).pipe(map((res) => res.data ?? res));
  }

  uploadImage(id: number, file: File): Observable<Combo> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${environment.apiURL}/combos/${id}/image`, formData).pipe(map((res) => res.data ?? res));
  }

  delete(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${environment.apiURL}/combos/${id}`);
  }
}
