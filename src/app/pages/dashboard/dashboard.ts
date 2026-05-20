import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { ApiConsoleService } from '@services/api-console.service';

import { ClassesPage } from '../classes/classes';
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
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard', label: 'Tổng quan', description: 'Tổng quan hoạt động của hệ thống đào tạo.', icon: 'TQ' },
  { id: 'students', label: 'Sinh viên', description: 'Quản lý hồ sơ và thông tin lớp của sinh viên.', icon: 'SV' },
  { id: 'classes', label: 'Lớp học', description: 'Danh sách lớp, khoa và giáo viên chủ nhiệm.', icon: 'LH' },
  { id: 'subjects', label: 'Môn học', description: 'Quản lý môn học, số tín chỉ và số tiết.', icon: 'MH' },
  { id: 'scores', label: 'Điểm số', description: 'Theo dõi điểm chuyên cần, giữa kỳ và cuối kỳ.', icon: 'Đ' },
  { id: 'roles', label: 'Người dùng', description: 'Danh sách vai trò trong hệ thống.', icon: 'ND' },
  { id: 'logs', label: 'Nhật ký', description: 'Kiểm tra các thao tác gần đây.', icon: 'NK' },
];

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, ClassesPage, LogsPage, OverviewPage, ScoresPage, StudentsPage, SubjectsPage, UsersPage],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly authService = inject(ApiConsoleService);
  private readonly router = inject(Router);

  readonly menuItems = MENU_ITEMS;
  readonly activeMenuId = signal(MENU_ITEMS[0].id);
  readonly refreshKey = signal(0);

  readonly activeMenu = computed(() => MENU_ITEMS.find((item) => item.id === this.activeMenuId()) ?? MENU_ITEMS[0]);
  readonly isDashboard = computed(() => this.activeMenuId() === 'dashboard');

  ngOnInit(): void {
    if (!this.authService.getStoredUser()) {
      this.router.navigateByUrl('/login');
      return;
    }
  }

  selectMenu(menuId: string): void {
    this.activeMenuId.set(menuId);
  }

  refresh(): void {
    this.refreshKey.update((value) => value + 1);
  }

  logout(): void {
    this.authService.clearToken();
    this.router.navigateByUrl('/login');
  }
}
