export const exportToCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
  // Add UTF-8 BOM so Excel opens accents and special characters cleanly
  const BOM = '\uFEFF';
  const csvContent = [
    headers.map(h => `"${h.replace(/"/g, '""')}"`).join(';'),
    ...rows.map(row =>
      row
        .map(cell => {
          const str = cell !== null && cell !== undefined ? String(cell) : '';
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(';')
    )
  ].join('\r\n');

  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
