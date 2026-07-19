import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Banner } from '../models/banner';
import { PaginationMeta, normalizePagination } from '../models/api-response';

interface MessageResponse {
  message: string;
}

function defaultsBanner(b: any): Banner {
  return {
    ...b,
    id: String(b.id),
    restaurantId: String(b.restaurantId),
    title: b.title ?? '',
    imageUrl: b.imageUrl ?? null,
    isActive: b.isActive ?? true,
    createdAt: b.createdAt ?? b.created_at ?? null,
    updatedAt: b.updatedAt ?? b.updated_at ?? null,
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
export class BannerService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiURL}/banners`;

  getPaginated(page = 1, limit = 10, search = ''): Observable<{ data: Banner[]; meta: PaginationMeta }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    if (search) params = params.set('search', search);
    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((res) => ({
        data: (res.data ?? []).map(defaultsBanner),
        meta: res.meta ? normalizePagination(res.meta) : fallbackMeta(page, (res.data ?? []).length, limit),
      }))
    );
  }

  getById(id: string): Observable<Banner> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(map((res) => defaultsBanner(res.data ?? res)));
  }

  create(formData: FormData): Observable<Banner> {
    return this.http.post<any>(this.apiUrl, formData).pipe(map((res) => defaultsBanner(res.data ?? res)));
  }

  update(id: string, formData: FormData): Observable<Banner> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, formData).pipe(map((res) => defaultsBanner(res.data ?? res)));
  }

  toggleStatus(id: string): Observable<Banner> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/toggle`, {}).pipe(map((res) => defaultsBanner(res.data ?? res)));
  }

  delete(id: string): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.apiUrl}/${id}`);
  }

  uploadImage(id: string, file: File): Observable<Banner> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.apiUrl}/${id}/image`, formData).pipe(map((res) => defaultsBanner(res.data ?? res)));
  }
}
