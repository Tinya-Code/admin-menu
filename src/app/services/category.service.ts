import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Category, CategoryForm } from '../models/category';
import { PaginationMeta } from '../models/api-response';

interface DataResponse<T> {
  data: T;
}

interface MessageResponse {
  message: string;
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiURL}/categories`;

  getAll(): Observable<DataResponse<Category[]>> {
    return this.http.get<DataResponse<Category[]>>(this.apiUrl);
  }

  getPaginated(page = 1, limit = 10, search = ''): Observable<{ data: Category[]; meta: PaginationMeta }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    if (search) params = params.set('search', search);
    return this.http.get<{ data: Category[]; meta: PaginationMeta }>(this.apiUrl, { params });
  }

  getById(id: string): Observable<DataResponse<Category>> {
    return this.http.get<DataResponse<Category>>(`${this.apiUrl}/${id}`);
  }

  create(data: CategoryForm): Observable<DataResponse<Category>> {
    return this.http.post<DataResponse<Category>>(this.apiUrl, data);
  }

  update(id: string, data: CategoryForm): Observable<DataResponse<Category>> {
    return this.http.put<DataResponse<Category>>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: string): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.apiUrl}/${id}`);
  }
}
