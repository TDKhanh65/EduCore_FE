import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { API_ENDPOINT } from '@constants/api-endpoint.constants';
import { createSearchRequest } from '@core/helpers/search-request.helper';
import { toTableRows, unwrapApiData } from '@shared/helpers';

import { APIService } from './common/api.service';

@Injectable({
  providedIn: 'root',
})
export class ScoresService {
  private readonly apiService = inject(APIService);

  getScores(searchParams: Record<string, unknown> | null = null): Observable<Record<string, unknown>[]> {
    return this.apiService
      .request<unknown>('POST', API_ENDPOINT.SCORES.SEARCH, { body: createSearchRequest(searchParams) })
      .pipe(map((response) => toTableRows(unwrapApiData(response.body))));
  }

  getSemesters(): Observable<Record<string, unknown>[]> {
    return this.getScores().pipe(map((rows) => uniqueLookupRows(rows, 'semesterId', 'semesterCode', 'schoolYear')));
  }

  getStudents(): Observable<Record<string, unknown>[]> {
    return this.apiService
      .request<unknown>('POST', API_ENDPOINT.STUDENTS.SEARCH, { body: createSearchRequest() })
      .pipe(map((response) => toTableRows(unwrapApiData(response.body))));
  }

  getSubjects(): Observable<Record<string, unknown>[]> {
    return this.apiService
      .request<unknown>('POST', API_ENDPOINT.SUBJECTS.SEARCH, { body: createSearchRequest() })
      .pipe(map((response) => toTableRows(unwrapApiData(response.body))));
  }

  createScore(body: Record<string, unknown>): Observable<unknown> {
    return this.apiService.request<unknown>('POST', API_ENDPOINT.SCORES.ROOT, { body });
  }

  updateScore(id: string | number, body: Record<string, unknown>): Observable<unknown> {
    return this.apiService.request<unknown>('PUT', API_ENDPOINT.SCORES.BY_ID(id), { body });
  }

  deleteScore(id: string | number): Observable<unknown> {
    return this.apiService.request<unknown>('DELETE', API_ENDPOINT.SCORES.BY_ID(id));
  }
}

function uniqueLookupRows(rows: Record<string, unknown>[], idKey: string, codeKey: string, labelKey: string): Record<string, unknown>[] {
  const result = new Map<string, Record<string, unknown>>();

  for (const row of rows) {
    const id = row[idKey] ?? row[pascalCase(idKey)];
    const code = row[codeKey] ?? row[pascalCase(codeKey)];
    const keyValue = id ?? code;
    if (keyValue === null || keyValue === undefined || keyValue === '') {
      continue;
    }

    const key = String(keyValue);
    if (!result.has(key)) {
      result.set(key, {
        id: id ?? keyValue,
        [idKey]: id ?? keyValue,
        [codeKey]: code ?? keyValue,
        [labelKey]: row[labelKey] ?? row[pascalCase(labelKey)],
      });
    }
  }

  return [...result.values()];
}

function pascalCase(key: string): string {
  return `${key.charAt(0).toUpperCase()}${key.slice(1)}`;
}
