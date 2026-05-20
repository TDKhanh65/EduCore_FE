import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { API_ENDPOINT } from '@constants/api-endpoint.constants';
import { toTableRows, unwrapApiData } from '@shared/helpers';

import { APIService } from './common/api.service';

@Injectable({
  providedIn: 'root',
})
export class LogsService {
  private readonly apiService = inject(APIService);

  getActionLogs(): Observable<Record<string, unknown>[]> {
    return this.apiService
      .request<unknown>('GET', API_ENDPOINT.LOGS.ACTIONS)
      .pipe(map((response) => toTableRows(unwrapApiData(response.body))));
  }
}
