import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Event, EventForm } from '../models/event';
import { ApiResponse } from '../models/api-response';

interface MessageResponse {
  message: string;
}

@Injectable({ providedIn: 'root' })
export class EventService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiURL}/events`;

  getAll(page: number = 1, limit: number = 10): Observable<ApiResponse<Event[]>> {
    const params = new HttpParams()
      .set('page', page)
      .set('limit', limit)
      .set('order_by', 'date')
      .set('sortDirection', 'ASC');
    return this.http.get<ApiResponse<Event[]>>(this.apiUrl, { params });
  }

  getById(id: string): Observable<ApiResponse<Event>> {
    return this.http.get<ApiResponse<Event>>(`${this.apiUrl}/${id}`);
  }

  create(formData: FormData): Observable<ApiResponse<Event>> {
    return this.http.post<ApiResponse<Event>>(this.apiUrl, formData);
  }

  update(id: string, formData: FormData): Observable<ApiResponse<Event>> {
    return this.http.put<ApiResponse<Event>>(`${this.apiUrl}/${id}`, formData);
  }

  delete(id: string): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.apiUrl}/${id}`);
  }
}
