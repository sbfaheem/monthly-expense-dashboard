
const STORAGE_KEY = 'expense_dashboard_data';

const initialData = {
  settings: {
    openingBalance: 50400,
    monthlyCollection: 284750,
    cctvExpense: 38800,
    categories: ['Security', 'Maintenance', 'Utilities', 'Miscellaneous', 'Capital'],
    currency: 'PKR',
  },
  expenses: [
    { id: 1, date: '2026-02-01', month: 'February 2026', category: 'Security', name: 'Security Expense', amount: 207000, description: 'Monthly security services' },
    { id: 2, date: '2026-02-05', month: 'February 2026', category: 'Maintenance', name: 'Electrician Charges', amount: 8000, description: 'Electrical maintenance' },
    { id: 3, date: '2026-02-10', month: 'February 2026', category: 'Security', name: 'Sweeper Salary', amount: 15000, description: 'Sweeping services' },
    { id: 4, date: '2026-02-12', month: 'February 2026', category: 'Maintenance', name: 'Sweeper Accessories', amount: 7900, description: 'Cleaning supplies' },
    { id: 5, date: '2026-02-15', month: 'February 2026', category: 'Utilities', name: 'Electrical Accessories', amount: 7520, description: 'Bulbs and wires' },
    { id: 6, date: '2026-02-20', month: 'February 2026', category: 'Miscellaneous', name: 'Park', amount: 1500, description: 'Park maintenance' },
    { id: 7, date: '2026-02-22', month: 'February 2026', category: 'Miscellaneous', name: 'Chair', amount: 1500, description: 'Office chair' },
  ]
};

export const getMonthYear = (dateString) => {
  const date = new Date(dateString);
  const options = { month: 'long', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

export const loadData = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : initialData;
};

export const saveData = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// Returns the most recent month that has expense data, parsed into { month, year }.
// Falls back to the current month if no data exists.
export const getLastDataMonth = (data) => {
  if (!data.expenses || data.expenses.length === 0) {
    const now = new Date();
    const opts = { month: 'long', year: 'numeric' };
    const [m, y] = now.toLocaleDateString('en-US', opts).split(' ');
    return { month: m, year: Number(y) };
  }
  // Sort expenses by date descending, pick the latest
  const sorted = [...data.expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
  const latestMonth = sorted[0].month; // e.g. "February 2026"
  const parts = latestMonth.split(' ');
  return { month: parts[0], year: Number(parts[1]) };
};


export const calculateTotals = (expenses, settings, selectedMonth) => {
  const monthlyExpenses = expenses.filter(e => e.month === selectedMonth);
  const totalExpense = monthlyExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  
  const saving = settings.monthlyCollection - totalExpense;
  const totalSaving = (settings.openingBalance + saving) - settings.cctvExpense;

  return {
    totalExpense,
    saving,
    totalSaving
  };
};

export const addExpense = (expense) => {
  const data = loadData();
  const newExpense = {
    ...expense,
    id: Date.now(),
    month: getMonthYear(expense.date)
  };
  data.expenses.push(newExpense);
  saveData(data);
  return data;
};

export const updateExpense = (updatedExpense) => {
  const data = loadData();
  data.expenses = data.expenses.map(e => e.id === updatedExpense.id ? { ...updatedExpense, month: getMonthYear(updatedExpense.date) } : e);
  saveData(data);
  return data;
};

export const deleteExpense = (id) => {
  const data = loadData();
  data.expenses = data.expenses.filter(e => e.id !== id);
  saveData(data);
  return data;
};

export const updateSettings = (newSettings) => {
  const data = loadData();
  data.settings = { ...data.settings, ...newSettings };
  saveData(data);
  return data;
};
