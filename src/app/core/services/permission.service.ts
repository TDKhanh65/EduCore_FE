import { Injectable, inject } from '@angular/core';

import { ApiConsoleService } from './api-console.service';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  private readonly authService = inject(ApiConsoleService);

  has(permission: string): boolean {
    const user = this.authService.getStoredUser();
    const roleCode = this.readText(user, 'roleCode') || this.readText(user, 'RoleCode');
    if (roleCode.toUpperCase() === 'ADMIN') {
      return true;
    }

    return this.permissions().has(permission.toUpperCase());
  }

  private permissions(): Set<string> {
    const user = this.authService.getStoredUser();
    const rawPermissions = user ? this.readValue(user, 'permissions') ?? this.readValue(user, 'Permissions') : [];
    const permissions = Array.isArray(rawPermissions) ? rawPermissions : [];

    return new Set(permissions.map((permission) => String(permission).trim().toUpperCase()).filter(Boolean));
  }

  private readText(row: Record<string, unknown> | null, key: string): string {
    const value = row ? this.readValue(row, key) : '';
    return String(value ?? '').trim();
  }

  private readValue(row: Record<string, unknown>, key: string): unknown {
    if (key in row) {
      return row[key];
    }

    const matchedKey = Object.keys(row).find((item) => item.toLowerCase() === key.toLowerCase());
    return matchedKey ? row[matchedKey] : undefined;
  }
}
