import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { LogsService } from '@services/logs.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { exportRowsToCsv } from '@shared/helpers';

@Component({
  selector: 'app-logs-page',
  imports: [CommonModule, DataTable],
  templateUrl: './logs.html',
  styleUrl: './logs.css',
})
export class LogsPage {
  private readonly logsService = inject(LogsService);

  readonly refreshKey = input(0);
  readonly rows = signal<Record<string, unknown>[]>([]);
  readonly loading = signal(false);
  readonly message = signal('');
  readonly columns = [
    'CreatedAt',
    'ModuleCode',
    'ActionCode',
    'TableName',
    'RecordId',
    'Description',
    'IpAddress',
    'UserAgent',
    'CreatedBy',
  ];

  constructor() {
    effect(() => {
      this.refreshKey();
      this.loadLogs();
    });
  }

  private loadLogs(): void {
    this.loading.set(true);
    this.message.set('');

    this.logsService
      .getActionLogs()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (rows) => this.rows.set(rows),
        error: () => this.message.set('Không tải được nhật ký thao tác. Vui lòng thử lại sau.'),
      });
  }

  exportCsv(): void {
    exportRowsToCsv('nhat-ky.csv', this.rows(), this.columns);
  }
}
