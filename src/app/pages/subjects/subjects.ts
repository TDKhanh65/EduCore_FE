import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { SubjectsService } from '@services/subjects.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { EntityForm, EntityFormField } from '@shared/components/entity-form/entity-form';
import { cellValue, exportRowsToCsv } from '@shared/helpers';

@Component({
  selector: 'app-subjects-page',
  imports: [CommonModule, DataTable, EntityForm],
  templateUrl: './subjects.html',
  styleUrl: './subjects.css',
})
export class SubjectsPage {
  private readonly subjectsService = inject(SubjectsService);

  readonly refreshKey = input(0);
  readonly rows = signal<Record<string, unknown>[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly message = signal('');
  readonly columns = ['subjectCode', 'subjectName', 'credits', 'totalLessons', 'isActive'];
  readonly formOpen = signal(false);
  readonly editingRow = signal<Record<string, unknown> | null>(null);
  readonly formFields: EntityFormField[] = [
    { key: 'subjectCode', label: 'Mã môn', type: 'text', required: true },
    { key: 'subjectName', label: 'Tên môn', type: 'text', required: true },
    { key: 'credits', label: 'Tín chỉ', type: 'number', required: true },
    { key: 'totalLessons', label: 'Số tiết', type: 'number', required: true },
    { key: 'isActive', label: 'Trạng thái', type: 'boolean' },
  ];

  constructor() {
    effect(() => {
      this.refreshKey();
      this.loadSubjects();
    });
  }

  private loadSubjects(): void {
    this.loading.set(true);
    this.message.set('');

    this.subjectsService
      .getSubjects()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (rows) => this.rows.set(rows),
        error: () => this.message.set('Không tải được danh sách môn học. Vui lòng thử lại sau.'),
      });
  }

  openCreate(): void {
    this.editingRow.set(null);
    this.formOpen.set(true);
  }

  openEdit(row: Record<string, unknown>): void {
    this.editingRow.set(row);
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
  }

  saveSubject(values: Record<string, unknown>): void {
    const editing = this.editingRow();
    const id = editing ? cellValue(editing, 'id') || cellValue(editing, 'Id') : null;
    const payload = { ...values, [editing ? 'updatedBy' : 'createdBy']: currentActor() };
    const request = editing && id
      ? this.subjectsService.updateSubject(id as string | number, payload)
      : this.subjectsService.createSubject(payload);

    this.saving.set(true);
    this.message.set('');
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.formOpen.set(false);
        this.loadSubjects();
      },
      error: () => this.message.set('Không lưu được môn học. Vui lòng kiểm tra dữ liệu và thử lại.'),
    });
  }

  deleteSubject(row: Record<string, unknown>): void {
    const id = cellValue(row, 'id') || cellValue(row, 'Id');
    if (!id || !confirm('Bạn chắc chắn muốn xóa môn học này?')) {
      return;
    }

    this.loading.set(true);
    this.subjectsService.deleteSubject(id as string | number, currentActor()).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => this.loadSubjects(),
      error: () => this.message.set('Không xóa được môn học. Vui lòng thử lại sau.'),
    });
  }

  exportCsv(): void {
    exportRowsToCsv('mon-hoc.csv', this.rows(), this.columns);
  }
}

function currentActor(): string {
  return 'FE_ADMIN';
}
