import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { API_ENDPOINT } from '@constants/api-endpoint.constants';
import { createSearchRequest } from '@core/helpers/search-request.helper';
import { toTableRows, unwrapApiData } from '@shared/helpers';

import { APIService } from './common/api.service';

@Injectable({
  providedIn: 'root',
})
export class LogsService {
  private readonly apiService = inject(APIService);

  getActionLogs(searchParams: Record<string, unknown> | null = null): Observable<Record<string, unknown>[]> {
    return this.apiService
      .request<unknown>('POST', API_ENDPOINT.LOGS.ACTIONS, { body: createSearchRequest(searchParams) })
      .pipe(map((response) => toTableRows(unwrapApiData(response.body))));
  }
}
