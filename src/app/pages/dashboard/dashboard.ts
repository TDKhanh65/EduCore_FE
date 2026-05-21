import { CommonModule } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

import { ApiConsoleService } from '@services/api-console.service';

import { AcademicAlertsPage } from '../academic-alerts/academic-alerts';
import { ClassListPage } from '../class-list/class-list';
import { ClassesPage } from '../classes/classes';
import { GradeEntryPage } from '../grade-entry/grade-entry';
import { LogsPage } from '../logs/logs';
import { OverviewPage } from '../overview/overview';
import { ScoresPage } from '../scores/scores';
import { StudentsPage } from '../students/students';
import { SubjectsPage } from '../subjects/subjects';
import { UsersPage } from '../users/users';

interface MenuItem {
  id: string;
  label: string;
  description: string;
  icon: string;
  permissions?: string[];
  adminOnly?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard', label: 'Tổng quan', description: 'Tổng quan hoạt động của hệ thống đào tạo.', icon: 'TQ', permissions: ['DASHBOARD_VIEW', 'OVERVIEW_VIEW'] },
  { id: 'students', label: 'Sinh viên', description: 'Quản lý hồ sơ và thông tin lớp của sinh viên.', icon: 'SV', permissions: ['STUDENT_VIEW'] },
  { id: 'classes', label: 'Lớp học', description: 'Danh sách lớp, khoa và giáo viên chủ nhiệm.', icon: 'LH', permissions: ['CLASS_VIEW'] },
  { id: 'classList', label: 'Danh sách lớp', description: 'Tìm lớp và xem sinh viên đang học trong lớp đó.', icon: 'DSL', permissions: ['CLASS_VIEW', 'STUDENT_VIEW'] },
  { id: 'subjects', label: 'Môn học', description: 'Quản lý môn học, số tín chỉ và số tiết.', icon: 'MH', permissions: ['SUBJECT_VIEW'] },
  { id: 'scores', label: 'Điểm số', description: 'Theo dõi điểm chuyên cần, giữa kỳ và cuối kỳ.', icon: 'Đ', permissions: ['SCORE_VIEW'] },
  { id: 'academicAlerts', label: 'Cảnh báo học tập', description: 'Theo dõi sinh viên có nguy cơ rớt môn hoặc cần hỗ trợ.', icon: 'CB', permissions: ['SCORE_VIEW'] },
  { id: 'gradeEntry', label: 'Nhập điểm', description: 'Tìm sinh viên theo mã hoặc tên rồi nhập điểm môn học.', icon: 'NĐ', permissions: ['SCORE_UPDATE', 'SCORE_CREATE'] },
  { id: 'roles', label: 'Vai trò', description: 'Danh sách vai trò trong hệ thống.', icon: 'VT', permissions: ['ROLE_VIEW', 'PERMISSION_VIEW'], adminOnly: true },
  { id: 'logs', label: 'Nhật ký', description: 'Kiểm tra các thao tác gần đây.', icon: 'NK', permissions: ['LOG_VIEW'], adminOnly: true },
];

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    AcademicAlertsPage,
    ClassListPage,
    ClassesPage,
    GradeEntryPage,
    LogsPage,
    OverviewPage,
    ScoresPage,
    StudentsPage,
    SubjectsPage,
    UsersPage,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly authService = inject(ApiConsoleService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);

  readonly currentUser = signal<Record<string, unknown> | null>(null);
  readonly activeMenuId = signal(MENU_ITEMS[0].id);
  readonly refreshKey = signal(0);

  readonly menuItems = computed(() => {
    const roleCode = this.userRoleCode();
    const permissions = this.userPermissions();

    return MENU_ITEMS.filter((item) => {
      if (roleCode === 'ADMIN') {
        return true;
      }

      if (item.adminOnly) {
        return false;
      }

      return !item.permissions?.length || item.permissions.some((permission) => permissions.has(permission));
    });
  });
  readonly activeMenu = computed(() => this.menuItems().find((item) => item.id === this.activeMenuId()) ?? this.menuItems()[0] ?? MENU_ITEMS[0]);
  readonly isDashboard = computed(() => this.activeMenuId() === 'dashboard');
  readonly displayName = computed(() => this.userText('fullName') || this.userText('FullName') || this.userText('username') || this.userText('Username') || 'Người dùng');
  readonly displayRole = computed(() => this.userText('roleName') || this.userText('RoleName') || this.userRoleCode() || 'Tài khoản');
  readonly userInitial = computed(() => this.displayName().trim().charAt(0).toUpperCase() || 'U');

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const storedUser = this.authService.getStoredUser();
    if (!storedUser) {
      this.router.navigateByUrl('/login');
      return;
    }

    this.currentUser.set(storedUser);
    this.ensureAllowedActiveMenu();
  }

  selectMenu(menuId: string): void {
    if (!this.menuItems().some((item) => item.id === menuId)) {
      return;
    }

    this.activeMenuId.set(menuId);
  }

  refresh(): void {
    this.refreshKey.update((value) => value + 1);
  }

  logout(): void {
    this.authService.clearToken();
    this.router.navigateByUrl('/login');
  }

  private userRoleCode(): string {
    return (this.userText('roleCode') || this.userText('RoleCode')).toUpperCase();
  }

  private userPermissions(): Set<string> {
    const user = this.currentUser();
    const rawPermissions = user ? readValue(user, 'permissions') ?? readValue(user, 'Permissions') : [];
    const permissions = Array.isArray(rawPermissions) ? rawPermissions : [];

    return new Set(permissions.map((permission) => String(permission).trim().toUpperCase()).filter(Boolean));
  }

  private ensureAllowedActiveMenu(): void {
    if (!this.menuItems().some((item) => item.id === this.activeMenuId())) {
      this.activeMenuId.set(this.menuItems()[0]?.id ?? '');
    }
  }

  private userText(key: string): string {
    const user = this.currentUser();
    if (!user) {
      return '';
    }

    const value = readValue(user, key);
    return String(value ?? '').trim();
  }
}

function readValue(row: Record<string, unknown>, key: string): unknown {
  if (key in row) {
    return row[key];
  }

  const matchedKey = Object.keys(row).find((item) => item.toLowerCase() === key.toLowerCase());
  return matchedKey ? row[matchedKey] : undefined;
}
