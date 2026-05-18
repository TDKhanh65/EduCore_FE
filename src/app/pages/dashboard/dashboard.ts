import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { API_ENDPOINT } from '@constants/api-endpoint.constants';
import { ApiConsoleService } from '@services/api-console.service';
import { APIService } from '@services/common/api.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { toTableRows } from '@shared/helpers';

interface MenuItem {
  id: string;
  label: string;
  description: string;
  path: string;
  columns: string[];
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard', label: 'Tong quan', description: 'Theo doi nhanh tinh hinh dao tao.', path: API_ENDPOINT.DASHBOARD.SUMMARY, columns: [] },
  { id: 'students', label: 'Sinh vien', description: 'Quan ly ho so va thong tin lop cua sinh vien.', path: API_ENDPOINT.STUDENTS.ROOT, columns: ['personCode', 'fullName', 'email', 'classId', 'isActive'] },
  { id: 'classes', label: 'Lop hoc', description: 'Danh sach lop, khoa va giao vien chu nhiem.', path: API_ENDPOINT.CLASSES.ROOT, columns: ['classCode', 'className', 'facultyId', 'schoolYear', 'homeroomTeacher'] },
  { id: 'subjects', label: 'Mon hoc', description: 'Quan ly mon hoc, so tin chi va so tiet.', path: API_ENDPOINT.SUBJECTS.ROOT, columns: ['subjectCode', 'subjectName', 'credits', 'totalLessons', 'isActive'] },
  { id: 'scores', label: 'Diem so', description: 'Theo doi diem chuyen can, giua ky va cuoi ky.', path: API_ENDPOINT.SCORES.ROOT, columns: ['personProfileId', 'subjectId', 'semesterId', 'attendanceScore', 'midtermScore', 'finalScore'] },
  { id: 'roles', label: 'Phan quyen', description: 'Danh sach vai tro trong he thong.', path: API_ENDPOINT.ROLES.ROOT, columns: ['id', 'roleName', 'roleCode', 'isActive'] },
  { id: 'logs', label: 'Nhat ky', description: 'Kiem tra cac thao tac gan day.', path: API_ENDPOINT.LOGS.ACTIONS, columns: ['createdAt', 'action', 'moduleName', 'createdBy'] },
];

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, DataTable],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly apiService = inject(APIService);
  private readonly authService = inject(ApiConsoleService);
  private readonly router = inject(Router);

  readonly menuItems = MENU_ITEMS;
  readonly activeMenuId = signal(MENU_ITEMS[0].id);
  readonly isLoading = signal(false);
  readonly rows = signal<Record<string, unknown>[]>([]);
  readonly summary = signal<Record<string, unknown> | null>(null);
  readonly message = signal('');

  readonly activeMenu = computed(() => MENU_ITEMS.find((item) => item.id === this.activeMenuId()) ?? MENU_ITEMS[0]);
  readonly displayColumns = computed(() => this.activeMenu().columns.length ? this.activeMenu().columns : Object.keys(this.rows()[0] ?? {}).slice(0, 5));

  ngOnInit(): void {
    if (!this.authService.getStoredUser()) {
      this.router.navigateByUrl('/login');
      return;
    }

    this.loadActiveMenu();
  }

  selectMenu(menuId: string): void {
    this.activeMenuId.set(menuId);
    this.loadActiveMenu();
  }

  refresh(): void {
    this.loadActiveMenu();
  }

  logout(): void {
    this.authService.clearToken();
    this.router.navigateByUrl('/login');
  }

  private loadActiveMenu(): void {
    const menu = this.activeMenu();
    this.isLoading.set(true);
    this.message.set('');
    this.rows.set([]);
    this.summary.set(null);

    this.apiService
      .request<unknown>('GET', menu.path)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          const body = response.body;
          this.rows.set(toTableRows(body));
          this.summary.set(toRecord(body));
        },
        error: () => {
          this.message.set('Khong tai duoc du lieu. Vui long thu lai sau.');
        },
      });
  }
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
