import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { ClassesService } from '@services/classes.service';
import { StudentsService } from '@services/students.service';
import { cellValue, exportRowsToExcel } from '@shared/helpers';

@Component({
  selector: 'app-class-list-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './class-list.html',
  styleUrl: './class-list.css',
})
export class ClassListPage {
  private readonly classesService = inject(ClassesService);
  private readonly studentsService = inject(StudentsService);

  readonly cellValue = cellValue;
  readonly refreshKey = input(0);
  readonly classes = signal<Record<string, unknown>[]>([]);
  readonly students = signal<Record<string, unknown>[]>([]);
  readonly classQuery = signal('');
  readonly selectedClassId = signal<number | null>(null);

  readonly filteredClasses = computed(() => this.classes().slice(0, 30));

  readonly selectedClass = computed(() =>
    this.classes().find((item) => Number(cellValue(item, 'id') || cellValue(item, 'Id')) === this.selectedClassId()) ?? null,
  );

  readonly classStudents = computed(() => {
    const classId = this.selectedClassId();
    if (!classId) {
      return [];
    }

    return this.students().filter((student) => Number(cellValue(student, 'classId') || cellValue(student, 'ClassId')) === classId);
  });

  constructor() {
    effect(() => {
      this.refreshKey();
      this.classQuery.set('');
      this.selectedClassId.set(null);
      this.loadData();
    });
  }

  selectClass(item: Record<string, unknown>): void {
    this.selectedClassId.set(Number(cellValue(item, 'id') || cellValue(item, 'Id')));
  }

  isSelectedClass(item: Record<string, unknown>): boolean {
    return Number(cellValue(item, 'id') || cellValue(item, 'Id')) === this.selectedClassId();
  }

  exportExcel(): void {
    const rows = this.classStudents().map((student) => ({
      'Mã sinh viên': cellValue(student, 'personCode') || cellValue(student, 'PersonCode'),
      'Họ và tên': cellValue(student, 'fullName') || cellValue(student, 'FullName'),
      Email: cellValue(student, 'email') || cellValue(student, 'Email'),
      Lớp: cellValue(student, 'classCode') || cellValue(student, 'ClassCode'),
    }));

    exportRowsToExcel('danh-sach-lop.xlsx', rows, ['Mã sinh viên', 'Họ và tên', 'Email', 'Lớp']);
  }

  searchClasses(): void {
    this.loadData(this.classQuery());
  }

  resetSearch(reload = true): void {
    this.classQuery.set('');
    this.selectedClassId.set(null);
    if (reload) {
      this.loadData();
    }
  }

  private loadData(keyword = ''): void {
    forkJoin({
      classes: this.classesService.getClasses({ keyword: keyword.trim() }),
      students: this.studentsService.getStudents(),
    }).subscribe({
      next: ({ classes, students }) => {
        this.classes.set(classes);
        this.students.set(students);

        const selectedId = this.selectedClassId();
        if (selectedId && !classes.some((item) => Number(cellValue(item, 'id') || cellValue(item, 'Id')) === selectedId)) {
          this.selectedClassId.set(null);
        }
      },
    });
  }
}
