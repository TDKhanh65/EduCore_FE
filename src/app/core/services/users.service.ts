import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { API_ENDPOINT } from '@constants/api-endpoint.constants';
import { createSearchRequest } from '@core/helpers/search-request.helper';
import { toTableRows, unwrapApiData } from '@shared/helpers';

import { APIService } from './common/api.service';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private readonly apiService = inject(APIService);

  getUsers(searchParams: Record<string, unknown> | null = null): Observable<Record<string, unknown>[]> {
    return this.apiService
      .request<unknown>('POST', API_ENDPOINT.ROLES.SEARCH, { body: createSearchRequest(searchParams) })
      .pipe(map((response) => toTableRows(unwrapApiData(response.body)).map(normalizeRoleRow)));
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

  getRolePermissions(roleId: string | number): Observable<Record<string, unknown>[]> {
    return this.apiService
      .request<unknown>('GET', API_ENDPOINT.ROLES.PERMISSIONS_BY_ROLE(roleId))
      .pipe(map((response) => toTableRows(unwrapApiData(response.body))));
  }

  updateRolePermission(body: Record<string, unknown>): Observable<unknown> {
    return this.apiService.request<unknown>('PUT', API_ENDPOINT.ROLES.PERMISSIONS, { body });
  }

  updateRoleModulePermission(body: Record<string, unknown>): Observable<unknown> {
    return this.apiService.request<unknown>('PUT', API_ENDPOINT.ROLES.MODULE_PERMISSIONS, { body });
  }
}

function normalizeRoleRow(row: Record<string, unknown>): Record<string, unknown> {
  const isActive = row['isActive'] ?? row['IsActive'] ?? row['is_active'] ?? row['Is_Active'];

  return {
    ...row,
    isActive: isActive === undefined || isActive === null || isActive === '' ? true : toBoolean(isActive),
  };
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  const text = String(value).trim().toLowerCase();
  return ['1', 'true', 'yes', 'active', 'đang hoạt động'].includes(text);
}
