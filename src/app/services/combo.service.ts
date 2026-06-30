import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Combo, ComboForm } from '../models/combo';

interface DataResponse<T> {
  data: T;
}

interface MessageResponse {
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ComboService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiURL}/combos`;

  getAll(): Observable<DataResponse<Combo[]>> {
    return this.http.get<DataResponse<Combo[]>>(this.apiUrl);
  }

  getById(id: string): Observable<DataResponse<Combo>> {
    return this.http.get<DataResponse<Combo>>(`${this.apiUrl}/${id}`);
  }

  create(data: ComboForm): Observable<DataResponse<Combo>> {
    return this.http.post<DataResponse<Combo>>(this.apiUrl, data);
  }

  update(id: string, data: ComboForm): Observable<DataResponse<Combo>> {
    return this.http.put<DataResponse<Combo>>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: string): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.apiUrl}/${id}`);
  }
}
