import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Category, CategoryForm } from '../models/category';
import { PaginationMeta, normalizePagination } from '../models/api-response';
import { AuthService } from './auth.service';

interface MessageResponse {
  message: string;
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  private get base(): string {
    return `${environment.apiURL}/restaurants/${this.auth.restaurantId}/categories`;
  }

  getAll(): Observable<Category[]> {
    return this.http.get<any>(this.base).pipe(map((res) => res.data ?? res));
  }

  getPaginated(page = 1, limit = 10, search = ''): Observable<{ data: Category[]; meta: PaginationMeta }> {
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

  getById(id: string): Observable<Category> {
    return this.http.get<any>(`${environment.apiURL}/categories/${id}`).pipe(map((res) => res.data ?? res));
  }

  create(data: CategoryForm): Observable<Category> {
    return this.http.post<any>(`${environment.apiURL}/categories`, { ...data, restaurant_id: this.auth.restaurantId }).pipe(map((res) => res.data ?? res));
  }

  update(id: string, data: CategoryForm): Observable<Category> {
    return this.http.patch<any>(`${environment.apiURL}/categories/${id}`, data).pipe(map((res) => res.data ?? res));
  }

  delete(id: string): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${environment.apiURL}/categories/${id}`);
  }
}
