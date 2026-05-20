import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { API_ENDPOINT } from '@constants/api-endpoint.constants';
import { toTableRows, unwrapApiData } from '@shared/helpers';

import { APIService } from './common/api.service';
import { ClassesService } from './classes.service';

@Injectable({
  providedIn: 'root',
})
export class StudentsService {
  private readonly apiService = inject(APIService);
  private readonly classesService = inject(ClassesService);

  getStudents(): Observable<Record<string, unknown>[]> {
    return this.apiService
      .request<unknown>('GET', API_ENDPOINT.STUDENTS.ROOT)
      .pipe(map((response) => toTableRows(unwrapApiData(response.body))));
  }

  getClasses(): Observable<Record<string, unknown>[]> {
    return this.classesService.getClasses();
  }

  createStudent(body: Record<string, unknown>): Observable<unknown> {
    return this.apiService.request<unknown>('POST', API_ENDPOINT.STUDENTS.ROOT, { body });
  }

  updateStudent(id: string | number, body: Record<string, unknown>): Observable<unknown> {
    return this.apiService.request<unknown>('PUT', API_ENDPOINT.STUDENTS.BY_ID(id), { body });
  }

  deleteStudent(id: string | number, updatedBy: string): Observable<unknown> {
    return this.apiService.request<unknown>('DELETE', `${API_ENDPOINT.STUDENTS.BY_ID(id)}${updatedBy ? `?updatedBy=${encodeURIComponent(updatedBy)}` : ''}`);
  }
}
