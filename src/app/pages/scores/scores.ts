import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { ScoresService } from '@services/scores.service';
import { EntityForm, EntityFormField } from '@shared/components/entity-form/entity-form';
import { cellValue, exportRowsToCsv } from '@shared/helpers';

interface ScoreRow {
  id: unknown;
  studentName: string;
  subjectName: string;
  semesterId: string;
  attendanceScore: string;
  midtermScore: string;
  finalScore: string;
  averageScore: string;
  gradeLetter: string;
  source: Record<string, unknown>;
}

@Component({
  selector: 'app-scores-page',
  imports: [CommonModule, EntityForm],
  templateUrl: './scores.html',
  styleUrl: './scores.css',
})
export class ScoresPage {
  private readonly scoresService = inject(ScoresService);

  readonly refreshKey = input(0);
  readonly rows = signal<Record<string, unknown>[]>([]);
  readonly students = signal<Record<string, unknown>[]>([]);
  readonly subjects = signal<Record<string, unknown>[]>([]);
  readonly semesters = signal<Record<string, unknown>[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly message = signal('');
  readonly formOpen = signal(false);
  readonly editingRow = signal<Record<string, unknown> | null>(null);
  readonly edit = output<Record<string, unknown>>();
  readonly exportColumns = ['StudentCode', 'StudentName', 'SubjectName', 'SemesterCode', 'AttendanceScore', 'MidtermScore', 'FinalScore', 'AverageScore', 'GradeLetter'];
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

  readonly scoreRows = computed<ScoreRow[]>(() =>
    this.rows().map((row) => ({
      id: valueOf(row, 'Id') ?? valueOf(row, 'id'),
      studentName: displayStudent(row),
      subjectName: displayValue(valueOf(row, 'SubjectName') ?? valueOf(row, 'subjectName')),
      semesterId: displayValue(valueOf(row, 'SemesterCode') ?? valueOf(row, 'semesterCode') ?? valueOf(row, 'SemesterId') ?? valueOf(row, 'semesterId')),
      attendanceScore: displayScore(valueOf(row, 'AttendanceScore') ?? valueOf(row, 'attendanceScore')),
      midtermScore: displayScore(valueOf(row, 'MidtermScore') ?? valueOf(row, 'midtermScore')),
      finalScore: displayScore(valueOf(row, 'FinalScore') ?? valueOf(row, 'finalScore')),
      averageScore: displayScore(valueOf(row, 'AverageScore') ?? valueOf(row, 'averageScore')),
      gradeLetter: displayValue(valueOf(row, 'GradeLetter') ?? valueOf(row, 'gradeLetter')),
      source: row,
    })),
  );

  constructor() {
    effect(() => {
      this.refreshKey();
      this.loadScores();
      this.loadLookups();
    });
  }

  private loadScores(): void {
    this.loading.set(true);
    this.message.set('');

    this.scoresService
      .getScores()
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
    exportRowsToCsv('diem-so.xlsx', this.rows(), this.exportColumns);
  }
}

function valueOf(row: Record<string, unknown>, key: string): unknown {
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

function displayStudent(row: Record<string, unknown>): string {
  const code = displayValue(valueOf(row, 'StudentCode') ?? valueOf(row, 'studentCode'));
  const name = displayValue(valueOf(row, 'StudentName') ?? valueOf(row, 'studentName'));

  if (code === '-') {
    return name;
  }

  if (name === '-') {
    return code;
  }

  return `${code} - ${name}`;
}

function displayScore(value: unknown): string {
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }

  return displayValue(value);
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
