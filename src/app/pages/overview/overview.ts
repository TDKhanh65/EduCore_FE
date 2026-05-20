import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { DashboardSummaryService } from '@services/dashboard-summary.service';

interface SummaryMetric {
  key: string;
  label: string;
  value: number | string;
  helper: string;
  tone: string;
}

@Component({
  selector: 'app-overview-page',
  imports: [CommonModule],
  templateUrl: './overview.html',
  styleUrl: './overview.css',
})
export class OverviewPage {
  private readonly summaryService = inject(DashboardSummaryService);

  readonly refreshKey = input(0);
  readonly menuSelected = output<string>();
  readonly loading = signal(false);
  readonly message = signal('');
  readonly summary = signal<Record<string, unknown> | null>(null);

  readonly summaryMetrics = computed<SummaryMetric[]>(() => {
    const info = this.summary() ?? {};

    return [
      { key: 'StudentCount', label: 'Tổng sinh viên', value: valueOf(info, 'StudentCount'), helper: 'Đang theo học', tone: 'students' },
      { key: 'ClassCount', label: 'Lớp học', value: valueOf(info, 'ClassCount'), helper: 'Đang hoạt động', tone: 'classes' },
      { key: 'SubjectCount', label: 'Môn học', value: valueOf(info, 'SubjectCount'), helper: 'Học phần', tone: 'subjects' },
      { key: 'WarningCount', label: 'Cảnh báo', value: valueOf(info, 'WarningCount'), helper: 'Cần xử lý', tone: 'warnings' },
    ];
  });

  constructor() {
    effect(() => {
      this.refreshKey();
      this.loadSummary();
    });
  }

  private loadSummary(): void {
    this.loading.set(true);
    this.message.set('');

    this.summaryService
      .getSummary()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (summary) => this.summary.set(summary),
        error: () => this.message.set('Không tải được tổng quan. Vui lòng thử lại sau.'),
      });
  }
}

function valueOf(record: Record<string, unknown>, key: string): number | string {
  const matchedKey = Object.keys(record).find((item) => item.toLowerCase() === key.toLowerCase());
  const value = matchedKey ? record[matchedKey] : 0;
  return typeof value === 'number' || typeof value === 'string' ? value : 0;
}
