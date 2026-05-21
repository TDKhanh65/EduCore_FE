import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { ScoresService } from '@services/scores.service';
import { exportRowsToCsv } from '@shared/helpers';

interface AlertCourse {
  id: unknown;
  studentId: number;
  studentCode: string;
  studentName: string;
  classCode: string;
  subjectName: string;
  averageScore: string;
  gradeLetter: string;
  reason: string;
  tone: 'danger' | 'warning';
  source: Record<string, unknown>;
}

interface StudentAlertGroup {
  studentId: number;
  studentCode: string;
  studentName: string;
  classCode: string;
  dangerCount: number;
  warningCount: number;
  courses: AlertCourse[];
}

@Component({
  selector: 'app-academic-alerts-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './academic-alerts.html',
  styleUrl: './academic-alerts.css',
})
export class AcademicAlertsPage {
  private readonly scoresService = inject(ScoresService);

  readonly refreshKey = input(0);
  readonly scores = signal<Record<string, unknown>[]>([]);
  readonly students = signal<Record<string, unknown>[]>([]);
  readonly query = signal('');
  readonly dangerOnly = signal(false);
  readonly loading = signal(false);
  readonly message = signal('');

  readonly alertCourses = computed<AlertCourse[]>(() => {
    const studentsById = studentLookup(this.students());

    return this.scores()
      .map((score) => toAlertCourse(score, studentsById))
      .filter((course): course is AlertCourse => !!course);
  });

  readonly filteredAlertCourses = computed(() => {
    const keyword = normalize(this.query());

    return this.alertCourses().filter((course) => {
      const matchesTone = !this.dangerOnly() || course.tone === 'danger';
      const searchable = normalize(`${course.studentCode} ${course.studentName} ${course.classCode} ${course.subjectName}`);
      return matchesTone && (!keyword || searchable.includes(keyword));
    });
  });

  readonly studentGroups = computed<StudentAlertGroup[]>(() => {
    const groups = new Map<number, StudentAlertGroup>();

    for (const course of this.filteredAlertCourses()) {
      if (!groups.has(course.studentId)) {
        groups.set(course.studentId, {
          studentId: course.studentId,
          studentCode: course.studentCode,
          studentName: course.studentName,
          classCode: course.classCode,
          dangerCount: 0,
          warningCount: 0,
          courses: [],
        });
      }

      const group = groups.get(course.studentId)!;
      group.courses.push(course);
      if (course.tone === 'danger') {
        group.dangerCount += 1;
      } else {
        group.warningCount += 1;
      }
    }

    return [...groups.values()].sort((a, b) => b.dangerCount - a.dangerCount || b.warningCount - a.warningCount);
  });

  readonly dangerCount = computed(() => this.alertCourses().filter((course) => course.tone === 'danger').length);
  readonly warningCount = computed(() => this.alertCourses().filter((course) => course.tone === 'warning').length);

  constructor() {
    effect(() => {
      this.refreshKey();
      this.query.set('');
      this.dangerOnly.set(false);
      this.loadData();
    });
  }

  resetFilters(): void {
    this.query.set('');
    this.dangerOnly.set(false);
  }

  exportExcel(): void {
    exportRowsToCsv('canh-bao-hoc-tap.xlsx', this.filteredAlertCourses().map((course) => ({
      StudentCode: course.studentCode,
      StudentName: course.studentName,
      ClassCode: course.classCode,
      SubjectName: course.subjectName,
      AverageScore: course.averageScore,
      GradeLetter: course.gradeLetter,
      AcademicWarning: course.reason,
    })), ['StudentCode', 'StudentName', 'ClassCode', 'SubjectName', 'AverageScore', 'GradeLetter', 'AcademicWarning']);
  }

  private loadData(): void {
    this.loading.set(true);
    this.message.set('');

    this.scoresService.getScores()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (rows) => this.scores.set(rows),
        error: () => this.message.set('Không tải được dữ liệu điểm để tính cảnh báo học tập.'),
      });

    this.scoresService.getStudents().subscribe({
      next: (rows) => this.students.set(rows),
      error: () => this.students.set([]),
    });
  }
}

function studentLookup(students: Record<string, unknown>[]): Map<number, Record<string, unknown>> {
  const result = new Map<number, Record<string, unknown>>();

  for (const student of students) {
    const id = Number(valueOf(student, 'id') ?? valueOf(student, 'Id') ?? valueOf(student, 'personProfileId') ?? valueOf(student, 'PersonProfileId'));
    if (id) {
      result.set(id, student);
    }
  }

  return result;
}

function toAlertCourse(score: Record<string, unknown>, studentsById: Map<number, Record<string, unknown>>): AlertCourse | null {
  const warning = academicWarning(score);
  if (warning.tone === 'ok') {
    return null;
  }

  const studentId = Number(valueOf(score, 'StudentId') ?? valueOf(score, 'studentId') ?? valueOf(score, 'PersonProfileId') ?? valueOf(score, 'personProfileId'));
  const student = studentId ? studentsById.get(studentId) : undefined;

  return {
    id: valueOf(score, 'Id') ?? valueOf(score, 'id'),
    studentId,
    studentCode: displayValue(valueOf(score, 'StudentCode') ?? valueOf(score, 'studentCode') ?? studentValue(student, 'personCode') ?? studentValue(student, 'PersonCode')),
    studentName: displayValue(valueOf(score, 'StudentName') ?? valueOf(score, 'studentName') ?? studentValue(student, 'fullName') ?? studentValue(student, 'FullName')),
    classCode: displayValue(valueOf(score, 'ClassCode') ?? valueOf(score, 'classCode') ?? studentValue(student, 'classCode') ?? studentValue(student, 'ClassCode')),
    subjectName: displayValue(valueOf(score, 'SubjectName') ?? valueOf(score, 'subjectName')),
    averageScore: displayScore(valueOf(score, 'AverageScore') ?? valueOf(score, 'averageScore')),
    gradeLetter: displayValue(valueOf(score, 'GradeLetter') ?? valueOf(score, 'gradeLetter')),
    reason: warning.label,
    tone: warning.tone,
    source: score,
  };
}

function academicWarning(row: Record<string, unknown>): { label: string; tone: 'danger' | 'warning' | 'ok' } {
  const averageScore = numberValue(row, 'AverageScore', 'averageScore');
  const attendanceScore = numberValue(row, 'AttendanceScore', 'attendanceScore');
  const midtermScore = numberValue(row, 'MidtermScore', 'midtermScore');
  const finalScore = numberValue(row, 'FinalScore', 'finalScore');
  const gradeLetter = displayValue(valueOf(row, 'GradeLetter') ?? valueOf(row, 'gradeLetter')).toUpperCase();

  if (gradeLetter === 'F' || averageScore < 5) {
    return { label: 'Nguy cơ rớt môn', tone: 'danger' };
  }

  if (attendanceScore < 5) {
    return { label: 'Chuyên cần thấp', tone: 'warning' };
  }

  if (midtermScore < 5 || finalScore < 5) {
    return { label: 'Cần theo dõi', tone: 'warning' };
  }

  return { label: 'Ổn định', tone: 'ok' };
}

function valueOf(row: Record<string, unknown>, key: string): unknown {
  if (key in row) {
    return row[key];
  }

  const matchedKey = Object.keys(row).find((item) => item.toLowerCase() === key.toLowerCase());
  return matchedKey ? row[matchedKey] : undefined;
}

function studentValue(student: Record<string, unknown> | undefined, key: string): unknown {
  return student ? valueOf(student, key) : undefined;
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return String(value);
}

function displayScore(value: unknown): string {
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }

  return displayValue(value);
}

function numberValue(row: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const value = valueOf(row, key);
    const number = typeof value === 'number' ? value : Number(value);
    if (Number.isFinite(number)) {
      return number;
    }
  }

  return 10;
}

function normalize(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}
