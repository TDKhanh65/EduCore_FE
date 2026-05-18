import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-data-table',
  imports: [CommonModule],
  templateUrl: './data-table.html',
})
export class DataTable {
  readonly columns = input<string[]>([]);
  readonly rows = input<Record<string, unknown>[]>([]);
  readonly loading = input(false);
  readonly emptyText = input('Chua co du lieu de hien thi.');
  readonly edit = output<Record<string, unknown>>();
}
