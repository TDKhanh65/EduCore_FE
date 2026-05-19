import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { API_ENDPOINT } from '@constants/api-endpoint.constants';
import { ApiConsoleService } from '@services/api-console.service';
import { APIService } from '@services/common/api.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { toTableRows } from '@shared/helpers';

import { StudentsPage } from '../students/students';

interface MenuItem {
  id: string;
  label: string;
  description: string;
  path: string;
  columns: string[];
  icon: string;
}

interface SummaryMetric {
  key: string;
  label: string;
  value: number | string;
  helper: string;
  tone: string;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard', label: 'Tổng quan', description: 'Tổng quan hoạt động của hệ thống đào tạo.', path: API_ENDPOINT.DASHBOARD.SUMMARY, columns: [], icon: 'TQ' },
  { id: 'students', label: 'Sinh viên', description: 'Quản lý hồ sơ và thông tin lớp của sinh viên.', path: API_ENDPOINT.STUDENTS.ROOT, columns: ['personCode', 'fullName', 'email', 'classCode', 'isActive'], icon: 'SV' },
  { id: 'classes', label: 'Lớp học', description: 'Danh sách lớp, khoa và giáo viên chủ nhiệm.', path: API_ENDPOINT.CLASSES.ROOT, columns: ['classCode', 'className', 'facultyId', 'schoolYear', 'homeroomTeacher'], icon: 'LH' },
  { id: 'subjects', label: 'Môn học', description: 'Quản lý môn học, số tín chỉ và số tiết.', path: API_ENDPOINT.SUBJECTS.ROOT, columns: ['subjectCode', 'subjectName', 'credits', 'totalLessons', 'isActive'], icon: 'MH' },
  { id: 'scores', label: 'Điểm số', description: 'Theo dõi điểm chuyên cần, giữa kỳ và cuối kỳ.', path: API_ENDPOINT.SCORES.ROOT, columns: ['personProfileId', 'subjectId', 'semesterId', 'attendanceScore', 'midtermScore', 'finalScore'], icon: 'Đ' },
  { id: 'roles', label: 'Người dùng', description: 'Danh sách vai trò trong hệ thống.', path: API_ENDPOINT.ROLES.ROOT, columns: ['id', 'roleName', 'roleCode', 'isActive'], icon: 'ND' },
  { id: 'logs', label: 'Nhật ký', description: 'Kiểm tra các thao tác gần đây.', path: API_ENDPOINT.LOGS.ACTIONS, columns: ['createdAt', 'action', 'moduleName', 'createdBy'], icon: 'NK' },
];

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, DataTable, StudentsPage],
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
  readonly isDashboard = computed(() => this.activeMenuId() === 'dashboard');
  readonly displayColumns = computed(() => this.activeMenu().columns.length ? this.activeMenu().columns : Object.keys(this.rows()[0] ?? {}).slice(0, 5));
  readonly summaryMetrics = computed<SummaryMetric[]>(() => {
    const info = this.summary() ?? {};

    return [
      { key: 'StudentCount', label: 'Tổng sinh viên', value: valueOf(info, 'StudentCount'), helper: 'Đang theo học', tone: 'students' },
      { key: 'ClassCount', label: 'Lớp học', value: valueOf(info, 'ClassCount'), helper: 'Đang hoạt động', tone: 'classes' },
      { key: 'SubjectCount', label: 'Môn học', value: valueOf(info, 'SubjectCount'), helper: 'Học phần', tone: 'subjects' },
      { key: 'WarningCount', label: 'Cảnh báo', value: valueOf(info, 'WarningCount'), helper: 'Cần xử lý', tone: 'warnings' },
    ];
  });

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
          const data = unwrapApiData(response.body);
          this.rows.set(toTableRows(data));
          this.summary.set(toRecord(data));
        },
        error: () => {
          this.message.set('Không tải được dữ liệu. Vui lòng thử lại sau.');
        },
      });
  }
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function unwrapApiData(value: unknown): unknown {
  const record = toRecord(value);
  return record && 'data' in record ? record['data'] : value;
}

function valueOf(record: Record<string, unknown>, key: string): number | string {
  const matchedKey = Object.keys(record).find((item) => item.toLowerCase() === key.toLowerCase());
  const value = matchedKey ? record[matchedKey] : 0;
  return typeof value === 'number' || typeof value === 'string' ? value : 0;
}
