import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { API_ENDPOINT } from '@constants/api-endpoint.constants';
import { toTableRows, unwrapApiData } from '@shared/helpers';

import { APIService } from './common/api.service';

@Injectable({
  providedIn: 'root',
})
export class ClassesService {
  private readonly apiService = inject(APIService);

  getClasses(): Observable<Record<string, unknown>[]> {
    return this.apiService
      .request<unknown>('GET', API_ENDPOINT.CLASSES.ROOT)
      .pipe(map((response) => toTableRows(unwrapApiData(response.body))));
  }

  getFaculties(): Observable<Record<string, unknown>[]> {
    return this.apiService
      .request<unknown>('GET', API_ENDPOINT.FACULTIES.ROOT)
      .pipe(map((response) => toTableRows(unwrapApiData(response.body))));
  }

  createClass(body: Record<string, unknown>): Observable<unknown> {
    return this.apiService.request<unknown>('POST', API_ENDPOINT.CLASSES.ROOT, { body });
  }

  updateClass(id: string | number, body: Record<string, unknown>): Observable<unknown> {
    return this.apiService.request<unknown>('PUT', API_ENDPOINT.CLASSES.BY_ID(id), { body });
  }

  deleteClass(id: string | number, updatedBy: string): Observable<unknown> {
    return this.apiService.request<unknown>('DELETE', `${API_ENDPOINT.CLASSES.BY_ID(id)}${updatedBy ? `?updatedBy=${encodeURIComponent(updatedBy)}` : ''}`);
  }
}
