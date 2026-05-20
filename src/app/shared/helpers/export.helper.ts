export function exportRowsToCsv(filename: string, rows: Record<string, unknown>[], columns: string[]): void {
  exportRowsToExcel(filename, rows, columns);
}

export function exportRowsToExcel(filename: string, rows: Record<string, unknown>[], columns: string[]): void {
  const headerCells = columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('');
  const bodyRows = rows
    .map((row) => `<tr>${columns.map((column) => `<td>${escapeHtml(cellValue(row, column))}</td>`).join('')}</tr>`)
    .join('');
  const workbook = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head><meta charset="utf-8" /></head>
      <body>
        <table border="1">
          <thead><tr>${headerCells}</tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </body>
    </html>
  `;
  const blob = new Blob([`\uFEFF${workbook}`], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename.replace(/\.(csv|xlsx|xls)$/i, '') + '.xls';
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

function escapeHtml(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
