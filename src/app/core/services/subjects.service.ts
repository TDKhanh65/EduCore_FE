import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { API_ENDPOINT } from '@constants/api-endpoint.constants';
import { createSearchRequest } from '@core/helpers/search-request.helper';
import { toTableRows, unwrapApiData } from '@shared/helpers';

import { APIService } from './common/api.service';

@Injectable({
  providedIn: 'root',
})
export class SubjectsService {
  private readonly apiService = inject(APIService);

  getSubjects(searchParams: Record<string, unknown> | null = null): Observable<Record<string, unknown>[]> {
    return this.apiService
      .request<unknown>('POST', API_ENDPOINT.SUBJECTS.SEARCH, { body: createSearchRequest(searchParams) })
      .pipe(map((response) => toTableRows(unwrapApiData(response.body))));
  }

  createSubject(body: Record<string, unknown>): Observable<unknown> {
    return this.apiService.request<unknown>('POST', API_ENDPOINT.SUBJECTS.ROOT, { body });
  }

  updateSubject(id: string | number, body: Record<string, unknown>): Observable<unknown> {
    return this.apiService.request<unknown>('PUT', API_ENDPOINT.SUBJECTS.BY_ID(id), { body });
  }

  deleteSubject(id: string | number, updatedBy: string): Observable<unknown> {
    return this.apiService.request<unknown>('DELETE', `${API_ENDPOINT.SUBJECTS.BY_ID(id)}${updatedBy ? `?updatedBy=${encodeURIComponent(updatedBy)}` : ''}`);
  }
}
