import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ListChecks, Camera, FileBarChart2, Settings, LogOut,
  Plus, Trash2, Pencil, X, Check, Eye, Save
} from 'lucide-react'
import {
  loadData, addExpense, updateExpense, deleteExpense,
  updateSettings, calculateTotals, getMonthYear, getLastDataMonth,
  addMonthlyRecord, updateMonthlyRecord, deleteMonthlyRecord
} from '../utils/storage'
import Header from '../components/Header'
import SummaryCards from '../components/SummaryCards'
import ExpenseTable from '../components/ExpenseTable'
import Charts from '../components/Charts'
import { exportToCSV, printReport } from '../utils/export'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const CATEGORIES = ['Security', 'Maintenance', 'Utilities', 'Miscellaneous', 'Capital']
const emptyForm = { date: '', category: 'Security', name: '', amount: '', description: '' }

const defaultData = {
  settings: { cctvExpense: 0, currency: 'PKR', defaultOpeningBalance: 0, defaultMonthlyCollection: 0, showCctvExpense: true },
  monthlyRecords: [],
  expenses: [],
}

export default function AdminPanel() {
  const navigate = useNavigate()
  const [data, setData] = useState(defaultData)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [recordForm, setRecordForm] = useState({ month: '', openingBalance: '', monthlyCollection: '', manualSaving: '', isManualSaving: false, cctvExpense: 0, showCctvExpense: false })
  const [editingRecordId, setEditingRecordId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [settingsForm, setSettingsForm] = useState(defaultData.settings)
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [notification, setNotification] = useState(null)
  const [tempCctv, setTempCctv] = useState(null)

  useEffect(() => { setTempCctv(null) }, [selectedMonth, selectedYear])

  useEffect(() => {
    const init = async () => {
      try {
        const freshData = await loadData()
        setData(freshData)
        setSettingsForm({ ...freshData.settings })
        const last = getLastDataMonth(freshData)
        setSelectedMonth(last.month)
        setSelectedYear(last.year)
      } catch (err) {
        showNotif('Failed to load. Check console.', 'error')
      } finally { setLoading(false) }
    }
    init()
  }, [])

  const currentMonthKey = `${selectedMonth} ${selectedYear}`
  const monthlyExpenses = data.expenses.filter(e => e.month === currentMonthKey)
  const totals = calculateTotals(data.expenses, data.settings, data.monthlyRecords, currentMonthKey)

  const showNotif = (msg, type = 'success') => {
    setNotification({ msg, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleLogout = () => { sessionStorage.removeItem('admin_auth'); navigate('/admin/login') }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    const updated = { ...form, [name]: value }
    if (name === 'date' && value) {
      const detectedMonth = getMonthYear(value)
      const [m, y] = detectedMonth.split(' ')
      setSelectedMonth(m)
      setSelectedYear(Number(y))
    }
    setForm(updated)
  }

  const handleAddExpense = async (e) => {
    e.preventDefault()
    if (!form.date || !form.name || !form.amount) return
    const newData = await addExpense(form)
    setData(newData)
    setForm(emptyForm)
    showNotif('Expense added successfully!')
  }

  const handleEditStart = (expense) => {
    setEditingId(expense.id)
    setForm({ date: expense.date, category: expense.category, name: expense.name, amount: expense.amount, description: expense.description || '' })
    setActiveTab('expenses')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleEditSave = async (e) => {
    e.preventDefault()
    const newData = await updateExpense({ ...form, id: editingId })
    setData(newData)
    setEditingId(null)
    setForm(emptyForm)
    showNotif('Expense updated!')
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return
    const newData = await deleteExpense(id)
    setData(newData)
    showNotif('Expense deleted.', 'error')
  }

  const handleSaveSettings = async () => {
    const newData = await updateSettings({
      defaultOpeningBalance: Number(settingsForm.defaultOpeningBalance),
      defaultMonthlyCollection: Number(settingsForm.defaultMonthlyCollection),
      cctvExpense: Number(settingsForm.cctvExpense),
      showCctvExpense: settingsForm.showCctvExpense,
      currency: settingsForm.currency,
    })
    setData(newData)
    setSettingsSaved(true)
    showNotif('Settings saved!')
    setTimeout(() => setSettingsSaved(false), 2000)
  }

  const handleRecordFormChange = (e) => {
    const { name, value, type, checked } = e.target
    setRecordForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleAddMonthlyRecord = async (e) => {
    e.preventDefault()
    const newData = await addMonthlyRecord({
      month: recordForm.month,
      openingBalance: Number(recordForm.openingBalance),
      monthlyCollection: Number(recordForm.monthlyCollection),
      manualSaving: Number(recordForm.manualSaving),
      isManualSaving: recordForm.isManualSaving
    })
    setData(newData)
    setRecordForm({ month: '', openingBalance: '', monthlyCollection: '', manualSaving: '', isManualSaving: false, cctvExpense: 0, showCctvExpense: false })
    showNotif('Monthly record added!')
  }

  const handleEditRecordStart = (record) => {
    setEditingRecordId(record.id)
    setRecordForm({ ...record })
    setActiveTab('records')
  }

  const handleEditRecordSave = async (e) => {
    e.preventDefault()
    const newData = await updateMonthlyRecord(recordForm)
    setData(newData)
    setEditingRecordId(null)
    setRecordForm({ month: '', openingBalance: '', monthlyCollection: '', manualSaving: '', isManualSaving: false, cctvExpense: 0, showCctvExpense: false })
    showNotif('Record updated!')
  }

  const handleDeleteRecord = async (id) => {
    if (!window.confirm('Delete this monthly record?')) return
    const newData = await deleteMonthlyRecord(id)
    setData(newData)
    showNotif('Record deleted.', 'error')
  }

  const navItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={18}/>, label: 'Dashboard' },
    { id: 'records',   icon: <FileBarChart2  size={18}/>, label: 'Records' },
    { id: 'expenses',  icon: <ListChecks     size={18}/>, label: 'Expenses' },
    { id: 'capital',   icon: <Camera         size={18}/>, label: 'Capital' },
    { id: 'reports',   icon: <FileBarChart2  size={18}/>, label: 'Reports' },
    { id: 'settings',  icon: <Settings       size={18}/>, label: 'Settings' },
  ]

  if (loading) {
     return (
       <div className="flex items-center justify-center h-screen flex-col gap-4 bg-background-light">
         <div className="size-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
         <p className="text-slate-500 font-medium">Connecting to Database…</p>
       </div>
     )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background-light">
      
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-bold transition-all ${notification.type === 'error' ? 'bg-red-500' : 'bg-primary'}`}>
          {notification.msg}
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-primary/10 flex flex-col">
        <div className="p-6 border-b border-primary/10">
          <h2 className="text-2xl font-extrabold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined">shield_person</span> Admin
          </h2>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">Control Panel</p>
        </div>
        <nav className="p-4 flex-1 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === item.id ? 'bg-primary text-white' : 'text-slate-500 hover:bg-primary/5 hover:text-primary'}`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-primary/10 space-y-2">
          <a href="/view" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">
            <Eye size={18}/> Viewer Mode
          </a>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-500 hover:bg-red-50 transition-colors">
            <LogOut size={18}/> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto w-full p-4 lg:p-8 space-y-8">
        {/* Render the Header component matching viewer dashboard */}
        <Header
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
          isAdmin={true}
        />

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <SummaryCards
              openingBalance={totals.record.openingBalance}
              monthlyCollection={totals.record.monthlyCollection}
              totalExpense={totals.totalExpense}
              saving={totals.saving}
              totalSaving={totals.totalSaving}
              currency={data.settings.currency}
              isNoData={totals.record.isNoData}
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <ExpenseTable
                  expenses={monthlyExpenses}
                  settings={data.settings}
                  selectedMonth={currentMonthKey}
                  totals={totals}
                  onEdit={handleEditStart}
                  onDelete={handleDelete}
                  isAdmin={true}
                />
              </div>
              <div className="space-y-6">
                <Charts expenses={monthlyExpenses} allExpenses={data.expenses} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'records' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-primary/10">
               <h3 className="text-lg font-bold text-slate-800 mb-4">{editingRecordId ? 'Edit Summary' : 'Add New Month'}</h3>
               <form onSubmit={editingRecordId ? handleEditRecordSave : handleAddMonthlyRecord} className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-bold text-slate-500 mb-1">Month (e.g. March 2026)</label>
                     <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none" name="month" value={recordForm.month} onChange={handleRecordFormChange} required />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-500 mb-1">Opening Balance</label>
                     <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none" name="openingBalance" value={recordForm.openingBalance} onChange={handleRecordFormChange} required />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-500 mb-1">Monthly Collection</label>
                     <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none" name="monthlyCollection" value={recordForm.monthlyCollection} onChange={handleRecordFormChange} required />
                   </div>
                   <div className="flex items-center gap-2 mt-6">
                      <input type="checkbox" name="isManualSaving" checked={recordForm.isManualSaving} onChange={handleRecordFormChange} className="w-5 h-5 text-primary rounded" />
                      <label className="font-bold text-slate-700">Manual Monthly Saving?</label>
                   </div>
                   {recordForm.isManualSaving && (
                     <div className="md:col-span-2">
                       <label className="block text-sm font-bold text-slate-500 mb-1">Manual Saving Amount</label>
                       <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg" name="manualSaving" value={recordForm.manualSaving} onChange={handleRecordFormChange} required />
                     </div>
                   )}
                 </div>
                 <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
                    <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary/90 flex items-center gap-2">
                      {editingRecordId ? <><Check size={16}/> Save</> : <><Plus size={16}/> Add</>}
                    </button>
                    {editingRecordId && <button type="button" onClick={() => setEditingRecordId(null)} className="px-6 py-2 bg-slate-100 rounded-lg font-bold text-slate-600">Cancel</button>}
                 </div>
               </form>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-primary/10 overflow-hidden">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                    <tr><th className="p-4">Month</th><th className="p-4">Opening</th><th className="p-4">Collection</th><th className="p-4">Sav</th><th className="p-4">Total</th><th className="p-4 text-center">Act</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {data.monthlyRecords.map(rec => {
                        const recTotals = calculateTotals(data.expenses, data.settings, data.monthlyRecords, rec.month)
                        return (
                          <tr key={rec.id} className="hover:bg-slate-50">
                            <td className="p-4 font-bold">{rec.month}</td>
                            <td className="p-4 text-slate-600">{rec.openingBalance.toLocaleString()}</td>
                            <td className="p-4 text-slate-600">{rec.monthlyCollection.toLocaleString()}</td>
                            <td className="p-4 text-green-600 font-bold">{recTotals.saving.toLocaleString()}</td>
                            <td className="p-4 text-primary font-bold">{recTotals.totalSaving.toLocaleString()}</td>
                            <td className="p-4 flex justify-center gap-2">
                               <button className="p-2 bg-blue-50 text-blue-600 rounded" onClick={() => handleEditRecordStart(rec)}><Pencil size={14}/></button>
                               <button className="p-2 bg-red-50 text-red-600 rounded" onClick={() => handleDeleteRecord(rec.id)}><Trash2 size={14}/></button>
                            </td>
                          </tr>
                        )
                     })}
                  </tbody>
               </table>
            </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="space-y-6">
             <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-primary/10">
               <h3 className="text-lg font-bold text-slate-800 mb-4">{editingId ? 'Edit Expense' : 'Add New Expense'}</h3>
               <form onSubmit={editingId ? handleEditSave : handleAddExpense} className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-bold text-slate-500 mb-1">Date</label>
                     <input type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary" name="date" value={form.date} onChange={handleFormChange} required />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-500 mb-1">Category</label>
                     <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none" name="category" value={form.category} onChange={handleFormChange}>
                       {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                     </select>
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-500 mb-1">Name</label>
                     <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary" name="name" value={form.name} onChange={handleFormChange} required />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-500 mb-1">Amount</label>
                     <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary" name="amount" value={form.amount} onChange={handleFormChange} required />
                   </div>
                   <div className="md:col-span-2">
                     <label className="block text-sm font-bold text-slate-500 mb-1">Description</label>
                     <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none" name="description" value={form.description} onChange={handleFormChange} rows={2} />
                   </div>
                 </div>
                 <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
                    <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary/90 flex items-center gap-2">
                      {editingId ? <><Check size={16}/> Save</> : <><Plus size={16}/> Add</>}
                    </button>
                    {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm) }} className="px-6 py-2 bg-slate-100 rounded-lg font-bold text-slate-600">Cancel</button>}
                 </div>
               </form>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-primary/10 overflow-hidden">
               <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <h4 className="font-bold text-slate-700">All Expenses in {currentMonthKey}</h4>
                  <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded">{monthlyExpenses.length} Found</span>
               </div>
               <table className="w-full text-left">
                  <thead className="text-xs uppercase font-bold text-slate-400 border-b border-primary/10">
                    <tr><th className="p-4">Date</th><th className="p-4">Category</th><th className="p-4">Name</th><th className="p-4">Amount</th><th className="p-4 text-center">Act</th></tr>
                  </thead>
                  <tbody className="divide-y divide-primary/5">
                     {monthlyExpenses.map(exp => (
                        <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                           <td className="p-4 text-sm font-bold text-slate-600">{exp.date}</td>
                           <td className="p-4"><span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold">{exp.category}</span></td>
                           <td className="p-4 text-sm font-medium">{exp.name}</td>
                           <td className="p-4 text-sm font-bold text-red-500">{Number(exp.amount).toLocaleString()}</td>
                           <td className="p-4 flex justify-center gap-2">
                               <button className="p-2 bg-blue-50 text-blue-600 rounded" onClick={() => handleEditStart(exp)}><Pencil size={14}/></button>
                               <button className="p-2 bg-red-50 text-red-600 rounded" onClick={() => handleDelete(exp.id)}><Trash2 size={14}/></button>
                            </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </div>
        )}

        {activeTab === 'capital' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-primary/10 space-y-6">
            <h3 className="text-lg font-bold text-slate-800">Capital Expenditure (CCTV)</h3>
            <div className="flex bg-slate-50 p-4 rounded-xl border border-slate-200 justify-between items-center">
               <span className="font-bold text-slate-700">Current Saved Config</span>
               <span className="text-xl font-extrabold text-primary">{Number(totals.record.cctvExpense).toLocaleString()} {data.settings.currency}</span>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                 <input
                     type="checkbox"
                     disabled={totals.record.isNoData}
                     checked={totals.record.showCctvExpense}
                     onChange={async (e) => {
                       if (totals.record.isNoData) return;
                       const newData = await updateMonthlyRecord({ ...totals.record, showCctvExpense: e.target.checked });
                       setData(newData);
                       showNotif('Visibility updated');
                     }}
                     className="w-5 h-5 text-primary rounded"
                  />
                  <label className="font-bold text-slate-700">Show Capital in Viewer for this month?</label>
              </div>
              <div>
                 <label className="block text-sm font-bold text-slate-500 mb-1">Set Active Capital Amount</label>
                 <div className="flex gap-2">
                    <input type="number" disabled={totals.record.isNoData} value={tempCctv !== null ? tempCctv : totals.record.cctvExpense} onChange={(e) => setTempCctv(e.target.value)} className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none" />
                    <button disabled={totals.record.isNoData} onClick={async () => { if(totals.record.isNoData) return; const val = tempCctv !== null ? tempCctv : totals.record.cctvExpense; const newData = await updateMonthlyRecord({ ...totals.record, cctvExpense: Number(val) }); setData(newData); showNotif('Updated Capital'); setTempCctv(null); }} className="bg-primary text-white px-6 py-2 rounded-lg font-bold"><Save size={16}/></button>
                 </div>
              </div>
            </div>
            {totals.record.isNoData && <div className="text-red-500 text-sm font-bold">⚠️ Add a record first to manage capital for this month.</div>}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-primary/10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-primary/10 pb-6 mb-6">
                 <div>
                   <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                     <FileBarChart2 size={24} className="text-primary"/> Financial Report
                   </h3>
                   <p className="text-sm text-slate-500 font-medium mt-1">Generated statement for {currentMonthKey}</p>
                 </div>
                 <div className="flex gap-3">
                   <button onClick={() => exportToCSV(monthlyExpenses, totals, currentMonthKey)} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold transition-colors">
                     <span className="material-symbols-outlined text-[20px]">download</span> Export CSV
                   </button>
                   <button onClick={printReport} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-sm shadow-primary/30">
                     <span className="material-symbols-outlined text-[20px]">print</span> Print Report
                   </button>
                 </div>
              </div>

              {/* Pre-Report Summary Block */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Total Expenses</span>
                  <strong className="text-xl text-slate-800 dark:text-slate-100">{Number(totals.totalExpense).toLocaleString()} {data.settings.currency}</strong>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
                  <span className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider block mb-1">Monthly Saving</span>
                  <strong className="text-xl text-green-700 dark:text-green-300">{Number(totals.saving).toLocaleString()} {data.settings.currency}</strong>
                </div>
                <div className="bg-secondary-gold/10 p-4 rounded-xl border border-secondary-gold/20">
                  <span className="text-xs font-bold text-secondary-gold uppercase tracking-wider block mb-1">Total Saving</span>
                  <strong className="text-xl text-secondary-gold">{Number(totals.totalSaving).toLocaleString()} {data.settings.currency}</strong>
                </div>
              </div>

              {/* Read-Only Table View for Report */}
              <div className="border hover:border-primary/20 transition-colors rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900/50 p-1">
                <ExpenseTable
                  expenses={monthlyExpenses}
                  settings={data.settings}
                  selectedMonth={currentMonthKey}
                  totals={totals}
                  isAdmin={false}
                />
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab Placeholder */}
        {activeTab === 'settings' && (
           <div className="bg-white p-8 rounded-2xl border border-primary/10 shadow-sm text-center">
             <span className="material-symbols-outlined text-6xl text-amber-400 mb-4 block">construction</span>
             <h3 className="text-xl font-bold text-slate-800">Settings Unavailable</h3>
             <p className="text-slate-500 max-w-md mx-auto mt-2">The layout has been heavily upgraded to Tailwind. Some advanced forms are hidden securely underneath the main layout flow.</p>
           </div>
        )}
      </main>
    </div>
  )
}
