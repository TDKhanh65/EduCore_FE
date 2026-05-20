import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { API_ENDPOINT } from '@constants/api-endpoint.constants';
import { toTableRows, unwrapApiData } from '@shared/helpers';

import { APIService } from './common/api.service';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private readonly apiService = inject(APIService);

  getUsers(): Observable<Record<string, unknown>[]> {
    return this.apiService
      .request<unknown>('GET', API_ENDPOINT.ROLES.ROOT)
      .pipe(map((response) => toTableRows(unwrapApiData(response.body))));
  }

  createUserRole(body: Record<string, unknown>): Observable<unknown> {
    return this.apiService.request<unknown>('POST', API_ENDPOINT.ROLES.ROOT, { body });
  }

  updateUserRole(id: string | number, body: Record<string, unknown>): Observable<unknown> {
    return this.apiService.request<unknown>('PUT', API_ENDPOINT.ROLES.BY_ID(id), { body });
  }

  deleteUserRole(id: string | number): Observable<unknown> {
    return this.apiService.request<unknown>('DELETE', API_ENDPOINT.ROLES.BY_ID(id));
  }
}
