import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { ScoresService } from '@services/scores.service';
import { cellValue } from '@shared/helpers';

@Component({
  selector: 'app-grade-entry-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './grade-entry.html',
  styleUrl: './grade-entry.css',
})
export class GradeEntryPage {
  private readonly scoresService = inject(ScoresService);

  readonly cellValue = cellValue;
  readonly refreshKey = input(0);
  readonly students = signal<Record<string, unknown>[]>([]);
  readonly subjects = signal<Record<string, unknown>[]>([]);
  readonly semesters = signal<Record<string, unknown>[]>([]);
  readonly scores = signal<Record<string, unknown>[]>([]);
  readonly query = signal('');
  readonly selectedStudentId = signal<number | null>(null);
  readonly subjectId = signal<number | null>(null);
  readonly semesterId = signal<number | null>(null);
  readonly attendanceScore = signal<number | null>(null);
  readonly midtermScore = signal<number | null>(null);
  readonly finalScore = signal<number | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly message = signal('');

  readonly filteredStudents = computed(() => {
    const keyword = normalize(this.query());
    if (!keyword) {
      return this.students().slice(0, 12);
    }

    return this.students()
      .filter((student) => {
        const code = normalize(cellValue(student, 'personCode') || cellValue(student, 'PersonCode'));
        const name = normalize(cellValue(student, 'fullName') || cellValue(student, 'FullName'));
        return code.includes(keyword) || name.includes(keyword);
      })
      .slice(0, 20);
  });

  readonly selectedStudent = computed(() =>
    this.students().find((student) => Number(cellValue(student, 'id') || cellValue(student, 'Id')) === this.selectedStudentId()) ?? null,
  );

  readonly studentScores = computed(() => {
    const studentId = this.selectedStudentId();
    if (!studentId) {
      return [];
    }

    return this.scores().filter((score) => Number(cellValue(score, 'studentId') || cellValue(score, 'StudentId')) === studentId);
  });

  constructor() {
    effect(() => {
      this.refreshKey();
      this.loadData();
    });
  }

  selectStudent(student: Record<string, unknown>): void {
    this.selectedStudentId.set(Number(cellValue(student, 'id') || cellValue(student, 'Id')));
    this.query.set(`${cellValue(student, 'personCode') || cellValue(student, 'PersonCode')} - ${cellValue(student, 'fullName') || cellValue(student, 'FullName')}`);
  }

  isSelectedStudent(student: Record<string, unknown>): boolean {
    return Number(cellValue(student, 'id') || cellValue(student, 'Id')) === this.selectedStudentId();
  }

  saveScore(): void {
    if (!this.selectedStudentId() || !this.subjectId() || !this.semesterId()) {
      this.message.set('Vui lòng chọn sinh viên, môn học và học kỳ.');
      return;
    }

    const existingScore = this.studentScores().find((score) =>
      Number(cellValue(score, 'subjectId') || cellValue(score, 'SubjectId')) === this.subjectId()
      && Number(cellValue(score, 'semesterId') || cellValue(score, 'SemesterId')) === this.semesterId()
    );
    const existingScoreId = existingScore ? (cellValue(existingScore, 'id') || cellValue(existingScore, 'Id')) : null;
    const payload = {
      personProfileId: this.selectedStudentId(),
      subjectId: this.subjectId(),
      semesterId: this.semesterId(),
      attendanceScore: this.attendanceScore(),
      midtermScore: this.midtermScore(),
      finalScore: this.finalScore(),
      [existingScoreId ? 'updatedBy' : 'createdBy']: 1,
    };
    const request = existingScoreId
      ? this.scoresService.updateScore(existingScoreId as string | number, payload)
      : this.scoresService.createScore(payload);

    this.saving.set(true);
    this.message.set('');
    request
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.message.set(existingScoreId ? 'Đã cập nhật điểm thành công.' : 'Đã nhập điểm thành công.');
          this.attendanceScore.set(null);
          this.midtermScore.set(null);
          this.finalScore.set(null);
          this.loadScores();
        },
        error: () => this.message.set('Không nhập được điểm. Vui lòng kiểm tra dữ liệu.'),
      });
  }

  private loadData(): void {
    this.loading.set(true);
    this.scoresService.getStudents().subscribe({ next: (rows) => this.students.set(rows) });
    this.scoresService.getSubjects().subscribe({ next: (rows) => this.subjects.set(rows) });
    this.scoresService.getSemesters().subscribe({ next: (rows) => this.semesters.set(rows) });
    this.loadScores();
  }

  private loadScores(): void {
    this.scoresService
      .getScores()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({ next: (rows) => this.scores.set(rows) });
  }
}

function normalize(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}
