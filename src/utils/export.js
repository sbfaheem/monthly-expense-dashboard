
export const exportToCSV = (expenses, totals, selectedMonth) => {
  const rows = [];
  
  // Report Header
  rows.push(['Expense Management System', '']);
  rows.push(['Monthly Financial Report', selectedMonth]);
  rows.push([]);
  
  // Summary Section
  rows.push(['--- FINANCIAL SUMMARY ---', '']);
  rows.push(['Opening Balance', totals.record.openingBalance]);
  rows.push(['Monthly Collection', totals.record.monthlyCollection]);
  rows.push(['Total Monthly Expense', totals.totalExpense]);
  rows.push(['Current Month Saving', totals.saving]);
  if (totals.record.showCctvExpense) {
    rows.push(['Capital Expenditure (CCTV)', totals.record.cctvExpense]);
  }
  rows.push(['Total Accumulated Saving', totals.totalSaving]);
  rows.push([]);
  
  // Categorization Logic matching UI
  const OPERATIONAL = ['Security Expense', 'Electrician Charges', 'Sweeper Salary', 'Sweeper Accessories', 'Electrical Accessories', 'Park'];
  const MISCELLANEOUS = ['Chair', 'Wire Lock', 'Wooden Stair', 'Transportation for Wooden Stair', 'Ring + Cap Labour Charges', 'Miscellaneous', 'Remaining amount for Water Chamber'];
  
  const opExpenses = expenses.filter(e => OPERATIONAL.includes(e.name));
  const miscExpenses = expenses.filter(e => MISCELLANEOUS.includes(e.name));
  const otherExpenses = expenses.filter(e => !OPERATIONAL.includes(e.name) && !MISCELLANEOUS.includes(e.name));

  // Operational Segment
  rows.push(['--- OPERATIONAL EXPENSES ---', '']);
  rows.push(['Description', 'Amount']);
  if (opExpenses.length === 0) {
    rows.push(['No operational expenses', '0']);
  } else {
    opExpenses.forEach(e => rows.push([e.name, e.amount]));
  }
  rows.push([]);

  // Miscellaneous Segment
  rows.push(['--- MISCELLANEOUS EXPENSES ---', '']);
  rows.push(['Description', 'Amount']);
  if (miscExpenses.length === 0) {
    rows.push(['No miscellaneous expenses', '0']);
  } else {
    miscExpenses.forEach(e => rows.push([e.name, e.amount]));
  }
  rows.push([]);

  // Other Segment (Fallback)
  if (otherExpenses.length > 0) {
    rows.push(['--- OTHER EXPENSES ---', '']);
    rows.push(['Description', 'Amount']);
    otherExpenses.forEach(e => rows.push([e.name, e.amount]));
    rows.push([]);
  }

  const csvContent = rows
    .map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Financial_Report_${selectedMonth.replace(' ', '_')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

export const printReport = () => {
  window.print();
};
