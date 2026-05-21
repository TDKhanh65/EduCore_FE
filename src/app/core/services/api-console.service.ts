import { HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';

import { APP_STORAGE } from '@constants/storage.constants';
import { ApiEndpoint, ApiFormValues, ApiResult } from '@models/api-console/api-console.model';
import { buildApiBody, buildApiParams, buildApiPath, createApiResult, extractToken } from '@shared/helpers';

import { APIService } from './common/api.service';

@Injectable({
  providedIn: 'root',
})
export class ApiConsoleService {
  private readonly apiService = inject(APIService);

  getStoredToken(): string {
    return this.hasStorage() ? localStorage.getItem(APP_STORAGE.AUTH_ACCESS_TOKEN) ?? '' : '';
  }

  getStoredUser(): Record<string, unknown> | null {
    if (!this.hasStorage()) {
      return null;
    }

    const user = localStorage.getItem(APP_STORAGE.AUTH_USER);
    try {
      return user ? JSON.parse(user) as Record<string, unknown> : null;
    } catch {
      this.clearToken();
      return null;
    }
  }

  saveToken(token: string): void {
    if (this.hasStorage()) {
      localStorage.setItem(APP_STORAGE.AUTH_ACCESS_TOKEN, token);
    }
  }

  saveUser(user: unknown): void {
    if (this.hasStorage()) {
      localStorage.setItem(APP_STORAGE.AUTH_USER, JSON.stringify(user));
    }
  }

  clearToken(): void {
    if (this.hasStorage()) {
      localStorage.removeItem(APP_STORAGE.AUTH_ACCESS_TOKEN);
      localStorage.removeItem(APP_STORAGE.AUTH_USER);
    }
  }

  send(endpoint: ApiEndpoint, values: ApiFormValues, token: string, startedAt: number): Observable<{ ok: boolean; result: ApiResult; token?: string }> {
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

    return this.apiService
      .request<unknown>(endpoint.method, buildApiPath(endpoint, values), {
        body: buildApiBody(endpoint, values),
        headers,
        params: buildApiParams(endpoint, values),
      })
      .pipe(
        map((response: HttpResponse<unknown>) => ({
          ok: true,
          result: createApiResult(endpoint, response.status, response.statusText, performance.now() - startedAt, response.body),
          token: extractToken(response.body) ?? undefined,
        })),
        catchError((error: HttpErrorResponse) =>
          of({
            ok: false,
            result: createApiResult(endpoint, error.status || 0, error.statusText || 'Request failed', performance.now() - startedAt, error.error ?? error.message),
          }),
        ),
      );
  }

  private hasStorage(): boolean {
    return typeof localStorage !== 'undefined';
  }
}
