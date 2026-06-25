import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ProductPrice } from '../models/product-price';

interface DataResponse<T> {
  data: T;
}

interface MessageResponse {
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ProductPriceService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiURL}/product-prices`;

  getByProductId(productId: number): Observable<DataResponse<ProductPrice[]>> {
    return this.http.get<DataResponse<ProductPrice[]>>(`${this.apiUrl}?product_id=${productId}`);
  }

  create(data: Partial<ProductPrice>): Observable<DataResponse<ProductPrice>> {
    return this.http.post<DataResponse<ProductPrice>>(this.apiUrl, data);
  }

  update(id: number, data: Partial<ProductPrice>): Observable<DataResponse<ProductPrice>> {
    return this.http.put<DataResponse<ProductPrice>>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.apiUrl}/${id}`);
  }
}
