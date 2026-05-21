import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { StudentsService } from '@services/students.service';
import { PermissionService } from '@services/permission.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { EntityForm, EntityFormField } from '@shared/components/entity-form/entity-form';
import { cellValue, exportRowsToCsv } from '@shared/helpers';

@Component({
  selector: 'app-students-page',
  imports: [CommonModule, FormsModule, DataTable, EntityForm],
  templateUrl: './students.html',
  styleUrl: './students.css',
})
export class StudentsPage {
  private readonly studentsService = inject(StudentsService);
  private readonly permissionService = inject(PermissionService);

  readonly refreshKey = input(0);
  readonly rows = signal<Record<string, unknown>[]>([]);
  readonly classes = signal<Record<string, unknown>[]>([]);
  readonly searchQuery = signal('');
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly message = signal('');
  readonly columns = ['personCode', 'fullName', 'email', 'classCode', 'isActive'];
  readonly canCreate = computed(() => this.permissionService.has('STUDENT_CREATE'));
  readonly canEdit = computed(() => this.permissionService.has('STUDENT_UPDATE'));
  readonly canDelete = computed(() => this.permissionService.has('STUDENT_DELETE'));
  readonly formOpen = signal(false);
  readonly editingRow = signal<Record<string, unknown> | null>(null);
  readonly filteredRows = computed(() => this.rows());

  readonly formFields = computed<EntityFormField[]>(() => [
    ...(this.editingRow()
      ? [{ key: 'personCode', label: 'Mã sinh viên', type: 'text', readonly: true } satisfies EntityFormField]
      : []),
    { key: 'fullName', label: 'Họ tên', type: 'text', required: true },
    ...(this.editingRow()
      ? [{ key: 'email', label: 'Email', type: 'text', readonly: true } satisfies EntityFormField]
      : []),
    {
      key: 'classId',
      label: 'Lớp',
      type: 'select',
      required: true,
      options: this.classes().map((item) => ({
        value: Number(cellValue(item, 'id') || cellValue(item, 'Id')),
        label: `${cellValue(item, 'classCode') || cellValue(item, 'ClassCode')} - ${cellValue(item, 'className') || cellValue(item, 'ClassName')}`,
      })),
    },
    { key: 'isActive', label: 'Trạng thái', type: 'boolean' },
  ]);

  constructor() {
    effect(() => {
      this.refreshKey();
      this.searchQuery.set('');
      this.loadStudents();
      this.loadClasses();
    });
  }

  searchStudents(): void {
    this.loadStudents(this.searchQuery());
  }

  resetSearch(reload = true): void {
    this.searchQuery.set('');
    if (reload) {
      this.loadStudents();
    }
  }

  private loadStudents(keyword = ''): void {
    this.loading.set(true);
    this.message.set('');

    this.studentsService
      .getStudents({ keyword: keyword.trim() })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (rows) => this.rows.set(rows),
        error: () => this.message.set('Không tải được danh sách sinh viên.'),
      });
  }

  private loadClasses(): void {
    this.studentsService
      .getClasses()
      .subscribe({ next: (rows) => this.classes.set(rows) });
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

  saveStudent(values: Record<string, unknown>): void {
    const editing = this.editingRow();
    const id = editing ? cellValue(editing, 'id') || cellValue(editing, 'Id') : null;
    const { personCode: _personCode, email: _email, id: _id, Id: _pascalId, ...editableValues } = values;
    const payload = { ...editableValues, [editing ? 'updatedBy' : 'createdBy']: currentActor() };
    const request = editing && id
      ? this.studentsService.updateStudent(id as string | number, payload)
      : this.studentsService.createStudent(payload);

    this.saving.set(true);
    this.message.set('');
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.formOpen.set(false);
        this.loadStudents();
        this.loadClasses();
      },
      error: () => this.message.set('Không lưu được sinh viên. Hãy kiểm tra dữ liệu.'),
    });
  }

  deleteStudent(row: Record<string, unknown>): void {
    const id = cellValue(row, 'id') || cellValue(row, 'Id');
    if (!id || !confirm('Bạn chắc chắn muốn xóa sinh viên này?')) {
      return;
    }

    this.loading.set(true);
    this.studentsService
      .deleteStudent(id as string | number, currentActor())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => this.loadStudents(),
        error: () => this.message.set('Không xóa được sinh viên. Hãy chạy lại backend mới nhất rồi thử lại.'),
      });
  }

  exportCsv(): void {
    exportRowsToCsv('sinh-vien.xlsx', this.filteredRows(), this.columns);
  }
}

function currentActor(): string {
  return 'FE_ADMIN';
}
