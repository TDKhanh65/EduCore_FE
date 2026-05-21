import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { API_ENDPOINT } from '@constants/api-endpoint.constants';
import { createSearchRequest } from '@core/helpers/search-request.helper';
import { toTableRows, unwrapApiData } from '@shared/helpers';

import { APIService } from './common/api.service';

@Injectable({
  providedIn: 'root',
})
export class ClassesService {
  private readonly apiService = inject(APIService);

  getClasses(searchParams: Record<string, unknown> | null = null): Observable<Record<string, unknown>[]> {
    return this.apiService
      .request<unknown>('POST', API_ENDPOINT.CLASSES.SEARCH, { body: createSearchRequest(searchParams) })
      .pipe(map((response) => toTableRows(unwrapApiData(response.body))));
  }

  getFaculties(): Observable<Record<string, unknown>[]> {
    return this.getClasses().pipe(map((rows) => uniqueLookupRows(rows, 'facultyId', 'facultyName', 'facultyCode')));
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

function uniqueLookupRows(rows: Record<string, unknown>[], idKey: string, nameKey: string, codeKey: string): Record<string, unknown>[] {
  const result = new Map<string, Record<string, unknown>>();

  for (const row of rows) {
    const id = row[idKey] ?? row[pascalCase(idKey)];
    if (id === null || id === undefined || id === '') {
      continue;
    }

    const key = String(id);
    if (!result.has(key)) {
      result.set(key, {
        id,
        [idKey]: id,
        [nameKey]: row[nameKey] ?? row[pascalCase(nameKey)],
        [codeKey]: row[codeKey] ?? row[pascalCase(codeKey)],
      });
    }
  }

  return [...result.values()];
}

function pascalCase(key: string): string {
  return `${key.charAt(0).toUpperCase()}${key.slice(1)}`;
}
