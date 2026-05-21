import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { ScoresService } from '@services/scores.service';
import { PermissionService } from '@services/permission.service';
import { EntityForm, EntityFormField } from '@shared/components/entity-form/entity-form';
import { cellValue, exportRowsToCsv } from '@shared/helpers';

interface ScoreRow {
  id: unknown;
  studentCode: string;
  studentName: string;
  classCode: string;
  subjectName: string;
  semesterId: string;
  attendanceScore: string;
  midtermScore: string;
  finalScore: string;
  averageScore: string;
  gradeLetter: string;
  academicWarning: string;
  warningTone: 'danger' | 'warning' | 'ok';
  source: Record<string, unknown>;
}

@Component({
  selector: 'app-scores-page',
  imports: [CommonModule, FormsModule, EntityForm],
  templateUrl: './scores.html',
  styleUrl: './scores.css',
})
export class ScoresPage {
  private readonly scoresService = inject(ScoresService);
  private readonly permissionService = inject(PermissionService);

  readonly refreshKey = input(0);
  readonly rows = signal<Record<string, unknown>[]>([]);
  readonly students = signal<Record<string, unknown>[]>([]);
  readonly subjects = signal<Record<string, unknown>[]>([]);
  readonly semesters = signal<Record<string, unknown>[]>([]);
  readonly studentQuery = signal('');
  readonly classQuery = signal('');
  readonly riskOnly = signal(false);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly message = signal('');
  readonly formOpen = signal(false);
  readonly editingRow = signal<Record<string, unknown> | null>(null);
  readonly edit = output<Record<string, unknown>>();
  readonly exportColumns = ['StudentCode', 'StudentName', 'ClassCode', 'SubjectName', 'SemesterCode', 'AttendanceScore', 'MidtermScore', 'FinalScore', 'AverageScore', 'GradeLetter', 'AcademicWarning'];
  readonly canCreate = computed(() => this.permissionService.has('SCORE_CREATE'));
  readonly canEdit = computed(() => this.permissionService.has('SCORE_UPDATE'));
  readonly canDelete = computed(() => this.permissionService.has('SCORE_DELETE'));
  readonly formFields = computed<EntityFormField[]>(() => [
    {
      key: 'personProfileId',
      label: 'Sinh viên',
      type: 'select',
      required: true,
      options: this.students().map((item) => ({
        value: Number(cellValue(item, 'id') || cellValue(item, 'Id')),
        label: `${cellValue(item, 'personCode') || cellValue(item, 'PersonCode')} - ${cellValue(item, 'fullName') || cellValue(item, 'FullName')}`,
      })),
    },
    {
      key: 'subjectId',
      label: 'Môn học',
      type: 'select',
      required: true,
      options: this.subjects().map((item) => ({
        value: Number(cellValue(item, 'id') || cellValue(item, 'Id')),
        label: `${cellValue(item, 'subjectCode') || cellValue(item, 'SubjectCode')} - ${cellValue(item, 'subjectName') || cellValue(item, 'SubjectName')}`,
      })),
    },
    {
      key: 'semesterId',
      label: 'Học kỳ',
      type: 'select',
      required: true,
      options: this.semesters().map((item) => ({
        value: Number(cellValue(item, 'id') || cellValue(item, 'Id')),
        label: `${cellValue(item, 'semesterCode') || cellValue(item, 'SemesterCode')} - ${cellValue(item, 'schoolYear') || cellValue(item, 'SchoolYear')}`,
      })),
    },
    { key: 'attendanceScore', label: 'Điểm chuyên cần', type: 'number', min: 0, required: true },
    { key: 'midtermScore', label: 'Điểm giữa kỳ', type: 'number', min: 0, required: true },
    { key: 'finalScore', label: 'Điểm cuối kỳ', type: 'number', min: 0, required: true },
  ]);

  readonly scoreRows = computed<ScoreRow[]>(() => {
    const studentsById = new Map<number, Record<string, unknown>>();
    for (const student of this.students()) {
      const id = Number(valueOf(student, 'id') ?? valueOf(student, 'Id') ?? valueOf(student, 'personProfileId') ?? valueOf(student, 'PersonProfileId'));
      if (id) {
        studentsById.set(id, student);
      }
    }

    return this.rows().map((row) => {
      const studentId = Number(valueOf(row, 'StudentId') ?? valueOf(row, 'studentId') ?? valueOf(row, 'PersonProfileId') ?? valueOf(row, 'personProfileId'));
      const student = studentId ? studentsById.get(studentId) : undefined;

      const warning = academicWarning(row);

      return {
        id: valueOf(row, 'Id') ?? valueOf(row, 'id'),
        studentCode: displayValue(valueOf(row, 'StudentCode') ?? valueOf(row, 'studentCode') ?? studentValue(student, 'personCode') ?? studentValue(student, 'PersonCode')),
        studentName: displayValue(valueOf(row, 'StudentName') ?? valueOf(row, 'studentName') ?? studentValue(student, 'fullName') ?? studentValue(student, 'FullName')),
        classCode: displayValue(valueOf(row, 'ClassCode') ?? valueOf(row, 'classCode') ?? studentValue(student, 'classCode') ?? studentValue(student, 'ClassCode')),
        subjectName: displayValue(valueOf(row, 'SubjectName') ?? valueOf(row, 'subjectName')),
        semesterId: displayValue(valueOf(row, 'SemesterCode') ?? valueOf(row, 'semesterCode') ?? valueOf(row, 'SemesterId') ?? valueOf(row, 'semesterId')),
        attendanceScore: displayScore(valueOf(row, 'AttendanceScore') ?? valueOf(row, 'attendanceScore')),
        midtermScore: displayScore(valueOf(row, 'MidtermScore') ?? valueOf(row, 'midtermScore')),
        finalScore: displayScore(valueOf(row, 'FinalScore') ?? valueOf(row, 'finalScore')),
        averageScore: displayScore(valueOf(row, 'AverageScore') ?? valueOf(row, 'averageScore')),
        gradeLetter: displayValue(valueOf(row, 'GradeLetter') ?? valueOf(row, 'gradeLetter')),
        academicWarning: warning.label,
        warningTone: warning.tone,
        source: {
          ...row,
          StudentCode: valueOf(row, 'StudentCode') ?? valueOf(row, 'studentCode') ?? studentValue(student, 'personCode') ?? studentValue(student, 'PersonCode'),
          ClassCode: valueOf(row, 'ClassCode') ?? valueOf(row, 'classCode') ?? studentValue(student, 'classCode') ?? studentValue(student, 'ClassCode'),
          AcademicWarning: warning.label,
        },
      };
    });
  });

  readonly filteredScoreRows = computed(() => {
    const rows = this.scoreRows();
    return this.riskOnly() ? rows.filter((row) => row.warningTone === 'danger') : rows;
  });

  constructor() {
    effect(() => {
      this.refreshKey();
      this.studentQuery.set('');
      this.classQuery.set('');
      this.riskOnly.set(false);
      this.loadScores();
      this.loadLookups();
    });
  }

  searchScores(): void {
    this.loadScores(this.scoreSearchParams());
  }

  resetSearch(reload = true): void {
    this.studentQuery.set('');
    this.classQuery.set('');
    this.riskOnly.set(false);
    if (reload) {
      this.loadScores();
    }
  }

  toggleRiskOnly(value: boolean): void {
    this.riskOnly.set(value);
  }

  private loadScores(searchParams: Record<string, unknown> | null = null): void {
    this.loading.set(true);
    this.message.set('');

    this.scoresService
      .getScores(searchParams)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (rows) => this.rows.set(rows),
        error: () => this.message.set('Không tải được danh sách điểm.'),
      });
  }

  private loadLookups(): void {
    this.scoresService.getStudents().subscribe({ next: (rows) => this.students.set(rows) });
    this.scoresService.getSubjects().subscribe({ next: (rows) => this.subjects.set(rows) });
    this.scoresService.getSemesters().subscribe({ next: (rows) => this.semesters.set(rows) });
  }

  openCreate(): void {
    this.editingRow.set(null);
    this.formOpen.set(true);
  }

  openEdit(row: Record<string, unknown>): void {
    this.edit.emit(row);
    this.editingRow.set(toScoreFormValues(row));
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
  }

  saveScore(values: Record<string, unknown>): void {
    const source = this.editingRow();
    const id = source ? cellValue(source, 'id') || cellValue(source, 'Id') : null;
    const payload = { ...values, [source ? 'updatedBy' : 'createdBy']: 1 };
    const request = source && id
      ? this.scoresService.updateScore(id as string | number, payload)
      : this.scoresService.createScore(payload);

    this.saving.set(true);
    this.message.set('');
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.formOpen.set(false);
        this.loadScores();
      },
      error: () => this.message.set('Không lưu được điểm. Hãy kiểm tra dữ liệu.'),
    });
  }

  deleteScore(row: Record<string, unknown>): void {
    const id = cellValue(row, 'id') || cellValue(row, 'Id');
    if (!id || !confirm('Bạn chắc chắn muốn xóa điểm này?')) {
      return;
    }

    this.loading.set(true);
    this.scoresService.deleteScore(id as string | number).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => this.loadScores(),
      error: () => this.message.set('Không xóa được điểm.'),
    });
  }

  exportCsv(): void {
    exportRowsToCsv('diem-so.xlsx', this.filteredScoreRows().map((row) => row.source), this.exportColumns);
  }

  private scoreSearchParams(): Record<string, unknown> | null {
    const keyword = [this.studentQuery(), this.classQuery()].map((item) => item.trim()).filter(Boolean).join(' ');
    return keyword ? { keyword } : null;
  }
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

function toScoreFormValues(row: Record<string, unknown>): Record<string, unknown> {
  return {
    id: valueOf(row, 'Id') ?? valueOf(row, 'id'),
    personProfileId: valueOf(row, 'PersonProfileId') ?? valueOf(row, 'personProfileId') ?? valueOf(row, 'StudentId'),
    subjectId: valueOf(row, 'SubjectId') ?? valueOf(row, 'subjectId'),
    semesterId: valueOf(row, 'SemesterId') ?? valueOf(row, 'semesterId'),
    attendanceScore: valueOf(row, 'AttendanceScore') ?? valueOf(row, 'attendanceScore'),
    midtermScore: valueOf(row, 'MidtermScore') ?? valueOf(row, 'midtermScore'),
    finalScore: valueOf(row, 'FinalScore') ?? valueOf(row, 'finalScore'),
  };
}

