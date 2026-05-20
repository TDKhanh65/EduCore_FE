import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-data-table',
  imports: [CommonModule],
  templateUrl: './data-table.html',
  styleUrl: './data-table.css',
})
export class DataTable {
  readonly columns = input<string[]>([]);
  readonly rows = input<Record<string, unknown>[]>([]);
  readonly loading = input(false);
  readonly showActions = input(true);
  readonly emptyText = input('Chưa có dữ liệu để hiển thị.');
  readonly edit = output<Record<string, unknown>>();
  readonly remove = output<Record<string, unknown>>();

  columnLabel(column: string): string {
    const labels: Record<string, string> = {
      ActionCode: 'Thao tác',
      CreatedAt: 'Thời gian',
      CreatedBy: 'Người tạo',
      Description: 'Mô tả',
      IpAddress: 'IP',
      ModuleCode: 'Phân hệ',
      RecordId: 'Bản ghi',
      TableName: 'Bảng',
      UserAgent: 'Thiết bị',
      action: 'Thao tác',
      attendanceScore: 'Điểm chuyên cần',
      classCode: 'Lớp',
      classId: 'Lớp',
      className: 'Tên lớp',
      createdAt: 'Thời gian',
      createdBy: 'Người tạo',
      credits: 'Tín chỉ',
      email: 'Email',
      facultyId: 'Khoa',
      finalScore: 'Điểm cuối kỳ',
      fullName: 'Họ và tên',
      homeroomTeacher: 'GVCN',
      id: 'ID',
      isActive: 'Trạng thái',
      midtermScore: 'Điểm giữa kỳ',
      moduleName: 'Phân hệ',
      personCode: 'Mã sinh viên',
      personProfileId: 'Sinh viên',
      roleCode: 'Mã quyền',
      roleName: 'Tên quyền',
      schoolYear: 'Năm học',
      semesterId: 'Học kỳ',
      subjectCode: 'Mã môn',
      subjectId: 'Môn học',
      subjectName: 'Tên môn',
      totalLessons: 'Số tiết',
    };

    return labels[column] ?? column;
  }

  cellValue(row: Record<string, unknown>, column: string): unknown {
    if (column in row) {
      return row[column];
    }

    const matchedKey = Object.keys(row).find((key) => key.toLowerCase() === column.toLowerCase());
    return matchedKey ? row[matchedKey] : '-';
  }

  displayValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    if (typeof value === 'boolean') {
      return value ? 'Đang hoạt động' : 'Tạm dừng';
    }

    return String(value);
  }
}
