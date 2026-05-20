export function exportRowsToCsv(filename: string, rows: Record<string, unknown>[], columns: string[]): void {
  const csvRows = [
    columns.map(escapeCsvValue).join(','),
    ...rows.map((row) => columns.map((column) => escapeCsvValue(cellValue(row, column))).join(',')),
  ];
  const blob = new Blob([`\uFEFF${csvRows.join('\r\n')}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function cellValue(row: Record<string, unknown>, column: string): unknown {
  if (column in row) {
    return row[column];
  }

  const matchedKey = Object.keys(row).find((key) => key.toLowerCase() === column.toLowerCase());
  return matchedKey ? row[matchedKey] : '';
}

function escapeCsvValue(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}
