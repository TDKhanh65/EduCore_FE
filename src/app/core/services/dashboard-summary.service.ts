import { inject, Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';

import { API_ENDPOINT } from '@constants/api-endpoint.constants';
import { createSearchRequest } from '@core/helpers/search-request.helper';
import { toRecord, toTableRows, unwrapApiData } from '@shared/helpers';

import { APIService } from './common/api.service';

@Injectable({
  providedIn: 'root',
})
export class DashboardSummaryService {
  private readonly apiService = inject(APIService);

  getSummary(): Observable<Record<string, unknown> | null> {
    return forkJoin({
      summary: this.apiService
        .request<unknown>('GET', API_ENDPOINT.DASHBOARD.SUMMARY)
        .pipe(map((response) => toRecord(unwrapApiData(response.body)) ?? {})),
      scores: this.apiService
        .request<unknown>('POST', API_ENDPOINT.SCORES.SEARCH, { body: createSearchRequest() })
        .pipe(
          map((response) => toTableRows(unwrapApiData(response.body))),
          catchError(() => of([])),
        ),
    }).pipe(
      map(({ summary, scores }) => ({
        ...summary,
        WarningCount: countAcademicWarnings(scores),
      })),
    );
  }
}

function countAcademicWarnings(scores: Record<string, unknown>[]): number {
  return scores.filter(hasAcademicWarning).length;
}

function hasAcademicWarning(score: Record<string, unknown>): boolean {
  const averageScore = numberValue(score, 'AverageScore', 'averageScore');
  const attendanceScore = numberValue(score, 'AttendanceScore', 'attendanceScore');
  const midtermScore = numberValue(score, 'MidtermScore', 'midtermScore');
  const finalScore = numberValue(score, 'FinalScore', 'finalScore');
  const gradeLetter = stringValue(score, 'GradeLetter', 'gradeLetter').toUpperCase();

  return averageScore < 5
    || attendanceScore < 5
    || midtermScore < 5
    || finalScore < 5
    || gradeLetter === 'F';
}

function numberValue(record: Record<string, unknown>, ...keys: string[]): number {
  const value = readValue(record, keys);
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : 10;
}

function stringValue(record: Record<string, unknown>, ...keys: string[]): string {
  const value = readValue(record, keys);
  return value === null || value === undefined ? '' : String(value).trim();
}

function readValue(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (key in record) {
      return record[key];
    }

    const matchedKey = Object.keys(record).find((item) => item.toLowerCase() === key.toLowerCase());
    if (matchedKey) {
      return record[matchedKey];
    }
  }

  return undefined;
}
