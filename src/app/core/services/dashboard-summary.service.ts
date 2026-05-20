import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { API_ENDPOINT } from '@constants/api-endpoint.constants';
import { toRecord, unwrapApiData } from '@shared/helpers';

import { APIService } from './common/api.service';

@Injectable({
  providedIn: 'root',
})
export class DashboardSummaryService {
  private readonly apiService = inject(APIService);

  getSummary(): Observable<Record<string, unknown> | null> {
    return this.apiService
      .request<unknown>('GET', API_ENDPOINT.DASHBOARD.SUMMARY)
      .pipe(map((response) => toRecord(unwrapApiData(response.body))));
  }
}
