import { HttpParams } from '@angular/common/http';

import { ApiEndpoint, ApiFormValues, ApiResult } from '@models/api-console/api-console.model';

export function buildApiPath(endpoint: ApiEndpoint, values: ApiFormValues): string {
  let path = endpoint.path;
  for (const field of endpoint.fields.filter((item) => item.location === 'path')) {
    path = path.replace(`{${field.key}}`, encodeURIComponent(String(values[field.key] ?? '')));
  }

  return path;
}

export function buildApiParams(endpoint: ApiEndpoint, values: ApiFormValues): HttpParams | undefined {
  let params = new HttpParams();
  for (const field of endpoint.fields.filter((item) => item.location === 'query')) {
    const value = values[field.key];
    if (value !== undefined && value !== null && value !== '') {
      params = params.set(field.key, String(value));
    }
  }

  return params.keys().length ? params : undefined;
}

export function buildApiBody(endpoint: ApiEndpoint, values: ApiFormValues): Record<string, unknown> | FormData | null {
  const formFields = endpoint.fields.filter((field) => field.location === 'formData');
  if (formFields.length) {
    const formData = new FormData();
    for (const field of formFields) {
      const value = values[field.key];
      if (value instanceof File) {
        formData.append(field.key, value);
      }
    }
    return formData;
  }

  const payload: Record<string, unknown> = {};
  for (const field of endpoint.fields.filter((item) => item.location === 'body')) {
    const value = values[field.key];
    if (value !== undefined && value !== null && value !== '') {
      payload[field.key] = field.type === 'number' ? Number(value) : value;
    }
  }

  return Object.keys(payload).length ? payload : null;
}

export function createApiResult(endpoint: ApiEndpoint, status: number, statusText: string, duration: number, body: unknown): ApiResult {
  return {
    endpoint,
    status,
    statusText,
    duration: Math.round(duration),
    body,
    requestedAt: new Date().toLocaleTimeString('vi-VN'),
  };
}

export function extractToken(body: unknown): string | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const record = body as Record<string, unknown>;
  const token = record['token'] || record['accessToken'] || record['jwt'];
  return typeof token === 'string' ? token : null;
}

export function toTableRows(body: unknown): Record<string, unknown>[] {
  if (Array.isArray(body)) {
    return body.filter(isRecord);
  }

  if (isRecord(body)) {
    const firstArray = Object.values(body).find(Array.isArray);
    if (Array.isArray(firstArray)) {
      return firstArray.filter(isRecord);
    }
  }

  return [];
}

export function prettyJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}
