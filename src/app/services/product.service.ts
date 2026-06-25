import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Product } from '../models/product';

interface DataResponse<T> {
  data: T;
}

interface MessageResponse {
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/products`;

  getAll(): Observable<DataResponse<Product[]>> {
    return this.http.get<DataResponse<Product[]>>(this.apiUrl);
  }

  getById(id: number): Observable<DataResponse<Product>> {
    return this.http.get<DataResponse<Product>>(`${this.apiUrl}/${id}`);
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
