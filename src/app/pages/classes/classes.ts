import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { ClassesService } from '@services/classes.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { EntityForm, EntityFormField, EntityFormOption } from '@shared/components/entity-form/entity-form';
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
  readonly faculties = signal<Record<string, unknown>[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly message = signal('');
  readonly columns = ['classCode', 'className', 'facultyName', 'schoolYear', 'homeroomTeacher'];
  readonly formOpen = signal(false);
  readonly editingRow = signal<Record<string, unknown> | null>(null);
  readonly formFields = computed<EntityFormField[]>(() => [
    { key: 'classCode', label: 'Mã lớp', type: 'text', required: true, readonly: !!this.editingRow() },
    { key: 'className', label: 'Tên lớp', type: 'text', required: true },
    {
      key: 'facultyId',
      label: 'Khoa',
      type: 'select',
      required: true,
      options: this.facultyOptions(),
    },
    { key: 'schoolYear', label: 'Năm học', type: 'text', required: true },
    { key: 'homeroomTeacher', label: 'GVCN', type: 'text' },
    { key: 'isActive', label: 'Trạng thái', type: 'boolean' },
  ]);

  constructor() {
    effect(() => {
      this.refreshKey();
      this.loadClasses();
      this.loadFaculties();
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
        error: () => this.message.set('Không tải được danh sách lớp học.'),
      });
  }

  private loadFaculties(): void {
    this.classesService
      .getFaculties()
      .subscribe({
        next: (rows) => this.faculties.set(rows),
        error: () => this.faculties.set([]),
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
    const originalCode = editing
      ? cellValue(editing, 'classCode') || cellValue(editing, 'ClassCode')
      : values['classCode'];
    const { id: _id, Id: _pascalId, ...editableValues } = values;
    const payload = { ...editableValues, classCode: originalCode, [editing ? 'updatedBy' : 'createdBy']: currentActor() };
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
      error: () => this.message.set('Không lưu được lớp học. Hãy kiểm tra dữ liệu.'),
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
      error: () => this.message.set('Không xóa được lớp học. Hãy chạy lại backend mới nhất rồi thử lại.'),
    });
  }

  exportCsv(): void {
    exportRowsToCsv('lop-hoc.csv', this.rows(), this.columns);
  }

  private facultyOptions(): EntityFormOption[] {
    const source = this.faculties().length ? this.faculties() : this.rows();
    const options = new Map<number, EntityFormOption>();

    for (const item of source) {
      const id = Number(cellValue(item, 'facultyId') || cellValue(item, 'FacultyId') || cellValue(item, 'id') || cellValue(item, 'Id'));
      if (!id || options.has(id)) {
        continue;
      }

      const name = cellValue(item, 'facultyName') || cellValue(item, 'FacultyName') || `Khoa ${id}`;
      const code = cellValue(item, 'facultyCode') || cellValue(item, 'FacultyCode');
      options.set(id, {
        value: id,
        label: code ? `${name} (${code})` : String(name),
      });
    }

    return [...options.values()];
  }
}

function currentActor(): string {
  return 'FE_ADMIN';
}
