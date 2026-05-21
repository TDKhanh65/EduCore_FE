import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { ApiConsoleService } from '@services/api-console.service';
import { PermissionService } from '@services/permission.service';
import { UsersService } from '@services/users.service';
import { EntityForm, EntityFormField } from '@shared/components/entity-form/entity-form';
import { cellValue, exportRowsToCsv } from '@shared/helpers';

interface PermissionModule {
  moduleId: number;
  moduleCode: string;
  moduleName: string;
  permissions: Record<string, unknown>[];
}

@Component({
  selector: 'app-users-page',
  imports: [CommonModule, EntityForm],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class UsersPage {
  private readonly usersService = inject(UsersService);
  private readonly authService = inject(ApiConsoleService);
  private readonly permissionService = inject(PermissionService);

  readonly refreshKey = input(0);
  readonly rows = signal<Record<string, unknown>[]>([]);
  readonly selectedRole = signal<Record<string, unknown> | null>(null);
  readonly permissions = signal<Record<string, unknown>[]>([]);
  readonly loading = signal(false);
  readonly permissionsLoading = signal(false);
  readonly saving = signal(false);
  readonly message = signal('');
  readonly permissionMessage = signal('');
  readonly columns = ['id', 'roleName', 'roleCode', 'isActive'];
  readonly canCreate = computed(() => this.permissionService.has('ROLE_CREATE'));
  readonly canEdit = computed(() => this.permissionService.has('ROLE_UPDATE'));
  readonly canDelete = computed(() => this.permissionService.has('ROLE_DELETE'));
  readonly formOpen = signal(false);
  readonly editingRow = signal<Record<string, unknown> | null>(null);
  readonly formFields: EntityFormField[] = [
    { key: 'roleName', label: 'Tên quyền', type: 'text', required: true },
    { key: 'roleCode', label: 'Mã quyền', type: 'text', required: true },
    { key: 'isActive', label: 'Trạng thái', type: 'boolean' },
  ];

  readonly permissionModules = computed<PermissionModule[]>(() => {
    const modules = new Map<number, PermissionModule>();

    for (const permission of this.permissions()) {
      const moduleId = Number(readValue(permission, 'moduleId') ?? readValue(permission, 'ModuleId'));
      if (!moduleId) {
        continue;
      }

      if (!modules.has(moduleId)) {
        modules.set(moduleId, {
          moduleId,
          moduleCode: displayValue(readValue(permission, 'moduleCode') ?? readValue(permission, 'ModuleCode')),
          moduleName: displayValue(readValue(permission, 'moduleName') ?? readValue(permission, 'ModuleName')),
          permissions: [],
        });
      }

      modules.get(moduleId)!.permissions.push(permission);
    }

    return [...modules.values()];
  });

  constructor() {
    effect(() => {
      this.refreshKey();
      this.loadUsers();
      const selected = this.selectedRole();
      if (selected) {
        this.loadPermissions(selected);
      }
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

  openPermissions(row: Record<string, unknown>): void {
    this.selectedRole.set(row);
    this.loadPermissions(row);
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
      error: () => this.message.set('Không lưu được vai trò. Backend hiện chỉ có API tạo vai trò và API phân quyền.'),
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
      error: () => this.message.set('Không xóa được vai trò. Backend hiện chưa có API DELETE role.'),
    });
  }

  exportCsv(): void {
    exportRowsToCsv('vai-tro.csv', this.rows(), this.columns);
  }

  roleId(row: Record<string, unknown>): number {
    return Number(readValue(row, 'id') ?? readValue(row, 'Id'));
  }

  roleName(row: Record<string, unknown> | null): string {
    return row ? displayValue(readValue(row, 'roleName') ?? readValue(row, 'RoleName')) : '';
  }

  roleCode(row: Record<string, unknown> | null): string {
    return row ? displayValue(readValue(row, 'roleCode') ?? readValue(row, 'RoleCode')) : '';
  }

  displayStatus(row: Record<string, unknown>): string {
    return toBoolean(readValue(row, 'isActive') ?? readValue(row, 'IsActive')) ? 'Đang hoạt động' : 'Tạm dừng';
  }

  permissionName(permission: Record<string, unknown>): string {
    return displayValue(
      readValue(permission, 'functionName')
        ?? readValue(permission, 'FunctionName')
        ?? readValue(permission, 'functionCode')
        ?? readValue(permission, 'FunctionCode'),
    );
  }

  permissionCode(permission: Record<string, unknown>): string {
    return displayValue(readValue(permission, 'functionCode') ?? readValue(permission, 'FunctionCode'));
  }

  isAllowed(permission: Record<string, unknown>): boolean {
    return toBoolean(
      readValue(permission, 'isAllow')
        ?? readValue(permission, 'IsAllow')
        ?? readValue(permission, 'isAllowed')
        ?? readValue(permission, 'IsAllowed'),
    );
  }

  isModuleAllowed(module: PermissionModule): boolean {
    return module.permissions.length > 0 && module.permissions.every((permission) => this.isAllowed(permission));
  }

  updatePermission(permission: Record<string, unknown>, event: Event): void {
    const selectedRole = this.selectedRole();
    const roleId = selectedRole ? this.roleId(selectedRole) : 0;
    const moduleId = Number(readValue(permission, 'moduleId') ?? readValue(permission, 'ModuleId'));
    const functionId = Number(readValue(permission, 'functionId') ?? readValue(permission, 'FunctionId'));
    const isAllow = (event.target as HTMLInputElement).checked;

    if (!roleId || !moduleId || !functionId) {
      this.permissionMessage.set('Không xác định được quyền cần cập nhật.');
      return;
    }

    this.permissionMessage.set('');
    this.usersService.updateRolePermission({
      roleId,
      moduleId,
      functionId,
      isAllow,
      updatedByUserId: this.currentUserId(),
    }).subscribe({
      next: () => this.patchPermission(moduleId, functionId, isAllow),
      error: () => this.permissionMessage.set('Không cập nhật được quyền. Hãy kiểm tra tài khoản admin hoặc backend.'),
    });
  }

  updateModulePermission(module: PermissionModule, event: Event): void {
    const selectedRole = this.selectedRole();
    const roleId = selectedRole ? this.roleId(selectedRole) : 0;
    const isAllow = (event.target as HTMLInputElement).checked;

    if (!roleId || !module.moduleId) {
      this.permissionMessage.set('Không xác định được module cần cập nhật.');
      return;
    }

    this.permissionMessage.set('');
    this.usersService.updateRoleModulePermission({
      roleId,
      moduleId: module.moduleId,
      isAllow,
      updatedByUserId: this.currentUserId(),
    }).subscribe({
      next: () => this.patchModule(module.moduleId, isAllow),
      error: () => this.permissionMessage.set('Không cập nhật được quyền module. Hãy kiểm tra tài khoản admin hoặc backend.'),
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

  private loadPermissions(row: Record<string, unknown>): void {
    const roleId = this.roleId(row);
    if (!roleId) {
      this.permissionMessage.set('Không tìm thấy roleId để tải phân quyền.');
      return;
    }

    this.permissionsLoading.set(true);
    this.permissionMessage.set('');
    this.usersService
      .getRolePermissions(roleId)
      .pipe(finalize(() => this.permissionsLoading.set(false)))
      .subscribe({
        next: (rows) => this.permissions.set(rows),
        error: () => this.permissionMessage.set('Không tải được ma trận phân quyền cho vai trò này.'),
      });
  }

  private patchPermission(moduleId: number, functionId: number, isAllow: boolean): void {
    this.permissions.update((rows) =>
      rows.map((row) => {
        const rowModuleId = Number(readValue(row, 'moduleId') ?? readValue(row, 'ModuleId'));
        const rowFunctionId = Number(readValue(row, 'functionId') ?? readValue(row, 'FunctionId'));
        return rowModuleId === moduleId && rowFunctionId === functionId ? { ...row, isAllow, IsAllow: isAllow } : row;
      }),
    );
  }

  private patchModule(moduleId: number, isAllow: boolean): void {
    this.permissions.update((rows) =>
      rows.map((row) => {
        const rowModuleId = Number(readValue(row, 'moduleId') ?? readValue(row, 'ModuleId'));
        return rowModuleId === moduleId ? { ...row, isAllow, IsAllow: isAllow } : row;
      }),
    );
  }

  private currentUserId(): number {
    const user = this.authService.getStoredUser();
    return Number((user && (readValue(user, 'id') ?? readValue(user, 'Id') ?? readValue(user, 'userId') ?? readValue(user, 'UserId'))) || 1);
  }
}

function readValue(row: Record<string, unknown>, key: string): unknown {
  if (key in row) {
    return row[key];
  }

  const matchedKey = Object.keys(row).find((item) => item.toLowerCase() === key.toLowerCase());
  return matchedKey ? row[matchedKey] : undefined;
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return String(value);
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  const text = String(value ?? '').trim().toLowerCase();
  return ['1', 'true', 'yes', 'active', 'đang hoạt động'].includes(text);
}
