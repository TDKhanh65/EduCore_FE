import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { API_ENDPOINT } from '@constants/api-endpoint.constants';
import { toTableRows, unwrapApiData } from '@shared/helpers';

import { APIService } from './common/api.service';

@Injectable({
  providedIn: 'root',
})
export class ScoresService {
  private readonly apiService = inject(APIService);

  getScores(): Observable<Record<string, unknown>[]> {
    return this.apiService
      .request<unknown>('GET', API_ENDPOINT.SCORES.ROOT)
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
