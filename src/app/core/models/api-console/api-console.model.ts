export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
export type FieldType = 'text' | 'number' | 'password' | 'boolean' | 'file';
export type FieldLocation = 'path' | 'query' | 'body' | 'formData';
export type EndpointTone = 'neutral' | 'create' | 'update' | 'danger';

export interface ApiField {
  key: string;
  label: string;
  type: FieldType;
  location: FieldLocation;
  placeholder?: string;
  required?: boolean;
}

export interface ApiEndpoint {
  id: string;
  group: string;
  name: string;
  description: string;
  method: HttpMethod;
  path: string;
  fields: ApiField[];
  tone: EndpointTone;
}

export interface ApiResult {
  endpoint: ApiEndpoint;
  status: number;
  statusText: string;
  duration: number;
  body: unknown;
  requestedAt: string;
}

export type ApiFormValues = Record<string, string | number | boolean | File | null>;
