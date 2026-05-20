import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { UsersService } from '@services/users.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { EntityForm, EntityFormField } from '@shared/components/entity-form/entity-form';
import { cellValue, exportRowsToCsv } from '@shared/helpers';

@Component({
  selector: 'app-users-page',
  imports: [CommonModule, DataTable, EntityForm],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class UsersPage {
  private readonly usersService = inject(UsersService);

  readonly refreshKey = input(0);
  readonly rows = signal<Record<string, unknown>[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly message = signal('');
  readonly columns = ['id', 'roleName', 'roleCode', 'isActive'];
  readonly formOpen = signal(false);
  readonly editingRow = signal<Record<string, unknown> | null>(null);
  readonly formFields: EntityFormField[] = [
    { key: 'roleName', label: 'Tên quyền', type: 'text', required: true },
    { key: 'roleCode', label: 'Mã quyền', type: 'text', required: true },
    { key: 'isActive', label: 'Trạng thái', type: 'boolean' },
  ];

  constructor() {
    effect(() => {
      this.refreshKey();
      this.loadUsers();
    });
  }

  private loadUsers(): void {
    this.loading.set(true);
    this.message.set('');

    this.usersService
      .getUsers()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (rows) => this.rows.set(rows),
        error: () => this.message.set('Không tải được danh sách vai trò. Vui lòng thử lại sau.'),
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

  saveUserRole(values: Record<string, unknown>): void {
    const editing = this.editingRow();
    const id = editing ? cellValue(editing, 'id') || cellValue(editing, 'Id') : null;
    const payload = { ...values, [editing ? 'updatedBy' : 'createdBy']: 'FE_ADMIN' };
    const request = editing && id
      ? this.usersService.updateUserRole(id as string | number, payload)
      : this.usersService.createUserRole(payload);

    this.saving.set(true);
    this.message.set('');
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.formOpen.set(false);
        this.loadUsers();
      },
      error: () => this.message.set('Không lưu được vai trò. Nếu backend chưa có API role CRUD thì cần viết ở BE.'),
    });
  }

  deleteUserRole(row: Record<string, unknown>): void {
    const id = cellValue(row, 'id') || cellValue(row, 'Id');
    if (!id || !confirm('Bạn chắc chắn muốn xóa vai trò này?')) {
      return;
    }

    this.loading.set(true);
    this.usersService.deleteUserRole(id as string | number).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => this.loadUsers(),
      error: () => this.message.set('Không xóa được vai trò. Nếu backend chưa có API role DELETE thì cần viết ở BE.'),
    });
  }

  exportCsv(): void {
    exportRowsToCsv('vai-tro.csv', this.rows(), this.columns);
  }
}
