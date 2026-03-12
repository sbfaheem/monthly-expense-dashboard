
const STORAGE_KEY = 'expense_dashboard_data';

const initialData = {
  settings: {
    cctvExpense: 38800,
    categories: ['Security', 'Maintenance', 'Utilities', 'Miscellaneous', 'Capital'],
    currency: 'PKR',
    // Default values for new months
    defaultOpeningBalance: 50400,
    defaultMonthlyCollection: 284750,
    showCctvExpense: true,
  },
  monthlyRecords: [
    { 
      id: 1, 
      month: 'February 2026', 
      openingBalance: 50400, 
      monthlyCollection: 284750,
      manualSaving: 0,
      isManualSaving: false 
    }
  ],
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
  if (!data) return initialData;
  const parsed = JSON.parse(data);
  // Migration for old data structure
  if (!parsed.monthlyRecords) {
    parsed.monthlyRecords = [{
      id: 1,
      month: parsed.expenses?.[0]?.month || getMonthYear(new Date()),
      openingBalance: parsed.settings.openingBalance || 50400,
      monthlyCollection: parsed.settings.monthlyCollection || 284750,
      manualSaving: 0,
      isManualSaving: false
    }];
    parsed.settings.defaultOpeningBalance = parsed.settings.openingBalance || 50400;
    parsed.settings.defaultMonthlyCollection = parsed.settings.monthlyCollection || 284750;
    delete parsed.settings.openingBalance;
    delete parsed.settings.monthlyCollection;
  }
  // Ensure new settings field exists
  if (parsed.settings.showCctvExpense === undefined) {
    parsed.settings.showCctvExpense = true;
  }
  return parsed;
};

export const saveData = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const getLastDataMonth = (data) => {
  if (data.monthlyRecords && data.monthlyRecords.length > 0) {
    // Sort records by month date-like parsing if possible, or just use latest added
    const sorted = [...data.monthlyRecords].sort((a, b) => new Date(b.month) - new Date(a.month));
    const parts = sorted[0].month.split(' ');
    return { month: parts[0], year: Number(parts[1]) };
  }
  const now = new Date();
  const opts = { month: 'long', year: 'numeric' };
  const [m, y] = now.toLocaleDateString('en-US', opts).split(' ');
  return { month: m, year: Number(y) };
};

export const calculateTotals = (expenses, settings, monthlyRecords, selectedMonth) => {
  const monthlyExpenses = expenses.filter(e => e.month === selectedMonth);
  const totalExpense = monthlyExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  
  const record = monthlyRecords.find(r => r.month === selectedMonth) || {
    openingBalance: settings.defaultOpeningBalance || 0,
    monthlyCollection: settings.defaultMonthlyCollection || 0,
    isManualSaving: false,
    manualSaving: 0
  };

  const saving = record.isManualSaving ? Number(record.manualSaving) : (Number(record.monthlyCollection) - totalExpense);
  const totalSaving = (Number(record.openingBalance) + saving) - (settings.showCctvExpense ? (settings.cctvExpense || 0) : 0);

  return {
    totalExpense,
    saving,
    totalSaving,
    record
  };
};

// Monthly Records CRUD
export const addMonthlyRecord = (record) => {
  const data = loadData();
  const newRecord = {
    ...record,
    id: Date.now(),
    isManualSaving: record.isManualSaving || false,
    manualSaving: record.manualSaving || 0
  };
  data.monthlyRecords.push(newRecord);
  saveData(data);
  return data;
};

export const updateMonthlyRecord = (updatedRecord) => {
  const data = loadData();
  data.monthlyRecords = data.monthlyRecords.map(r => r.id === updatedRecord.id ? updatedRecord : r);
  saveData(data);
  return data;
};

export const deleteMonthlyRecord = (id) => {
  const data = loadData();
  data.monthlyRecords = data.monthlyRecords.filter(r => r.id !== id);
  saveData(data);
  return data;
};

// Expense CRUD
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

