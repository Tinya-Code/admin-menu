import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Product } from '../models/product';
import { Promotion } from '../models/promotion';
import { ApiResponse, PaginationMeta } from '../models/api-response';

interface DataResponse<T> {
  data: T;
}

interface MessageResponse {
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiURL}/products`;

  getAll(): Observable<DataResponse<Product[]>> {
    return this.http.get<DataResponse<Product[]>>(this.apiUrl);
  }

  getPaginated(page = 1, limit = 10, search = ''): Observable<{ data: Product[]; meta: PaginationMeta }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    if (search) params = params.set('search', search);
    return this.http.get<{ data: Product[]; meta: PaginationMeta }>(this.apiUrl, { params });
  }

  getById(id: number): Observable<DataResponse<Product>> {
    return this.http.get<DataResponse<Product>>(`${this.apiUrl}/${id}`);
  }

  getPromotions(page = 1, limit = 10): Observable<{ data: Promotion[]; meta: PaginationMeta }> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<{ data: Promotion[]; meta: PaginationMeta }>(`${this.apiUrl}/promotions`, { params });
  }

  create(formData: FormData): Observable<DataResponse<Product>> {
    return this.http.post<DataResponse<Product>>(this.apiUrl, formData);
  }

  update(id: number, formData: FormData): Observable<DataResponse<Product>> {
    return this.http.put<DataResponse<Product>>(`${this.apiUrl}/${id}`, formData);
  }

  delete(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.apiUrl}/${id}`);
  }
}
