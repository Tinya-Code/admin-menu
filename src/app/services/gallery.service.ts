import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response';
import { Gallery } from '../models/gallery';

interface MessageResponse {
  message: string;
}

@Injectable({ providedIn: 'root' })
export class GalleryService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiURL}/gallery`;

  getAll(page: number = 1, limit: number = 10): Observable<ApiResponse<Gallery[]>> {
    const params = new HttpParams()
      .set('page', page)
      .set('limit', limit)
      .set('order_by', 'date')
      .set('sortDirection', 'ASC');
    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((res) => ({
        ...res,
        data: res.data?.data ?? res.data ?? [],
      }))
    );
  }

  getById(id: string): Observable<ApiResponse<Gallery>> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((res) => ({ ...res, data: res.data ?? res }))
    );
  }

  create(formData: FormData): Observable<ApiResponse<Gallery>> {
    return this.http.post<any>(this.apiUrl, formData).pipe(
      map((res) => ({ ...res, data: res.data ?? res }))
    );
  }

  update(id: string, formData: FormData): Observable<ApiResponse<Gallery>> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, formData).pipe(
      map((res) => ({ ...res, data: res.data ?? res }))
    );
  }

  delete(id: string): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.apiUrl}/${id}`);
  }
}
