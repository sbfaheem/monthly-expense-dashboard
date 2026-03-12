
export const exportToCSV = (expenses, totals, selectedMonth) => {
  const header = ['Date', 'Category', 'Expense Name', 'Amount', 'Description', 'Month'];
  const rows = expenses.map(e => [
    e.date, e.category, e.name, e.amount, e.description, e.month
  ]);

  rows.push([]);
  rows.push(['', '', 'Total Expense', totals.totalExpense, '', selectedMonth]);
  rows.push(['', '', 'Saving', totals.saving, '', selectedMonth]);
  rows.push(['', '', 'Total Saving', totals.totalSaving, '', selectedMonth]);

  const csvContent = [header, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `expense-report-${selectedMonth.replace(' ', '-')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

export const printReport = () => {
  window.print();
};
