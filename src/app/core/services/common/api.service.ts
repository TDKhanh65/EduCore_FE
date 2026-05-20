import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { APP_STORAGE } from '@constants/storage.constants';
import { HttpMethod } from '@models/api-console/api-console.model';

@Injectable({
  providedIn: 'root',
})
export class APIService {
  private readonly http = inject(HttpClient);

  request<T>(
    method: HttpMethod,
    url: string,
    options?: {
      body?: unknown;
      headers?: HttpHeaders;
      params?: HttpParams;
    },
  ): Observable<HttpResponse<T>> {
    const headers = options?.headers ?? this.getAuthHeaders();

    return this.http.request<T>(method, `${this.getApiHost()}${url}`, {
      body: options?.body,
      headers,
      params: options?.params,
      observe: 'response',
    });
  }

  private getApiHost(): string {
    if (typeof window !== 'undefined' && window.location.hostname === 'educore-fe.onrender.com') {
      return '';
    }

    return environment.apiHost;
  }

  private getAuthHeaders(): HttpHeaders | undefined {
    if (typeof localStorage === 'undefined') {
      return undefined;
    }

    const token = localStorage.getItem(APP_STORAGE.AUTH_ACCESS_TOKEN);
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
  }
}
