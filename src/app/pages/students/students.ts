import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

import { DataTable } from '@shared/components/data-table/data-table';

@Component({
  selector: 'app-students-page',
  imports: [CommonModule, DataTable],
  templateUrl: './students.html',
  styleUrl: './students.css',
})
export class StudentsPage {
  readonly rows = input<Record<string, unknown>[]>([]);
  readonly loading = input(false);
  readonly columns = ['personCode', 'fullName', 'email', 'classCode', 'isActive'];
}
