import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { ClassesService } from '@services/classes.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { EntityForm, EntityFormField } from '@shared/components/entity-form/entity-form';
import { cellValue, exportRowsToCsv } from '@shared/helpers';

@Component({
  selector: 'app-classes-page',
  imports: [CommonModule, DataTable, EntityForm],
  templateUrl: './classes.html',
  styleUrl: './classes.css',
})
export class ClassesPage {
  private readonly classesService = inject(ClassesService);

  readonly refreshKey = input(0);
  readonly rows = signal<Record<string, unknown>[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly message = signal('');
  readonly columns = ['classCode', 'className', 'facultyName', 'schoolYear', 'homeroomTeacher'];
  readonly formOpen = signal(false);
  readonly editingRow = signal<Record<string, unknown> | null>(null);
  readonly formFields: EntityFormField[] = [
    { key: 'classCode', label: 'Mã lớp', type: 'text', required: true },
    { key: 'className', label: 'Tên lớp', type: 'text', required: true },
    { key: 'facultyId', label: 'Khoa ID', type: 'number', required: true },
    { key: 'schoolYear', label: 'Năm học', type: 'text', required: true },
    { key: 'homeroomTeacher', label: 'GVCN', type: 'text' },
    { key: 'isActive', label: 'Trạng thái', type: 'boolean' },
  ];

  constructor() {
    effect(() => {
      this.refreshKey();
      this.loadClasses();
    });
  }

  private loadClasses(): void {
    this.loading.set(true);
    this.message.set('');

    this.classesService
      .getClasses()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (rows) => this.rows.set(rows),
        error: () => this.message.set('Không tải được danh sách lớp học. Vui lòng thử lại sau.'),
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

  saveClass(values: Record<string, unknown>): void {
    const editing = this.editingRow();
    const id = editing ? cellValue(editing, 'id') || cellValue(editing, 'Id') : null;
    const payload = { ...values, [editing ? 'updatedBy' : 'createdBy']: currentActor() };
    const request = editing && id
      ? this.classesService.updateClass(id as string | number, payload)
      : this.classesService.createClass(payload);

    this.saving.set(true);
    this.message.set('');
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.formOpen.set(false);
        this.loadClasses();
      },
      error: () => this.message.set('Không lưu được lớp học. Vui lòng kiểm tra dữ liệu và thử lại.'),
    });
  }

  deleteClass(row: Record<string, unknown>): void {
    const id = cellValue(row, 'id') || cellValue(row, 'Id');
    if (!id || !confirm('Bạn chắc chắn muốn xóa lớp học này?')) {
      return;
    }

    this.loading.set(true);
    this.classesService.deleteClass(id as string | number, currentActor()).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => this.loadClasses(),
      error: () => this.message.set('Không xóa được lớp học. Vui lòng thử lại sau.'),
    });
  }

  exportCsv(): void {
    exportRowsToCsv('lop-hoc.csv', this.rows(), this.columns);
  }
}

function currentActor(): string {
  return 'FE_ADMIN';
}
