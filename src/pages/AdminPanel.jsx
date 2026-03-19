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
import './AdminPanel.css'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const CATEGORIES = ['Security', 'Maintenance', 'Utilities', 'Miscellaneous', 'Capital']
const emptyForm = { date: '', category: 'Security', name: '', amount: '', description: '' }

const defaultData = {
  settings: {
    cctvExpense: 0, currency: 'PKR', defaultOpeningBalance: 0,
    defaultMonthlyCollection: 0, showCctvExpense: true,
  },
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
  const [recordForm, setRecordForm] = useState({ month: '', openingBalance: '', monthlyCollection: '', manualSaving: '', isManualSaving: false })
  const [editingRecordId, setEditingRecordId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [settingsForm, setSettingsForm] = useState(defaultData.settings)
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [notification, setNotification] = useState(null)

  // ── Load data on mount ──────────────────────────────────────
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
        console.error('Failed to load data:', err)
        showNotif('Failed to connect to database. Check console.', 'error')
      } finally {
        setLoading(false)
      }
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

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth')
    navigate('/admin/login')
  }

  // ── Expense CRUD ────────────────────────────────────────────
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
    try {
      const newData = await addExpense(form)
      setData(newData)
      setForm(emptyForm)
      showNotif('Expense added successfully!')
    } catch (err) {
      console.error(err)
      showNotif('Failed to add expense.', 'error')
    }
  }

  const handleEditStart = (expense) => {
    setEditingId(expense.id)
    setForm({ date: expense.date, category: expense.category, name: expense.name, amount: expense.amount, description: expense.description || '' })
    setActiveTab('expenses')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleEditSave = async (e) => {
    e.preventDefault()
    try {
      const newData = await updateExpense({ ...form, id: editingId })
      setData(newData)
      setEditingId(null)
      setForm(emptyForm)
      showNotif('Expense updated!')
    } catch (err) {
      console.error(err)
      showNotif('Failed to update expense.', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return
    try {
      const newData = await deleteExpense(id)
      setData(newData)
      showNotif('Expense deleted.', 'error')
    } catch (err) {
      console.error(err)
      showNotif('Failed to delete expense.', 'error')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setForm(emptyForm)
  }

  // ── Settings ────────────────────────────────────────────────
  const handleSaveSettings = async () => {
    try {
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
    } catch (err) {
      console.error(err)
      showNotif('Failed to save settings.', 'error')
    }
  }

  // ── Monthly Records CRUD ─────────────────────────────────────
  const handleRecordFormChange = (e) => {
    const { name, value, type, checked } = e.target
    setRecordForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleAddMonthlyRecord = async (e) => {
    e.preventDefault()
    try {
      const newData = await addMonthlyRecord({
        month: recordForm.month,
        openingBalance: Number(recordForm.openingBalance),
        monthlyCollection: Number(recordForm.monthlyCollection),
        manualSaving: Number(recordForm.manualSaving),
        isManualSaving: recordForm.isManualSaving
      })
      setData(newData)
      setRecordForm({ month: '', openingBalance: '', monthlyCollection: '', manualSaving: '', isManualSaving: false })
      showNotif('Monthly record added!')
    } catch (err) {
      console.error(err)
      showNotif('Failed to add monthly record.', 'error')
    }
  }

  const handleEditRecordStart = (record) => {
    setEditingRecordId(record.id)
    setRecordForm({ ...record })
    setActiveTab('records')
  }

  const handleEditRecordSave = async (e) => {
    e.preventDefault()
    try {
      const newData = await updateMonthlyRecord(recordForm)
      setData(newData)
      setEditingRecordId(null)
      setRecordForm({ month: '', openingBalance: '', monthlyCollection: '', manualSaving: '', isManualSaving: false })
      showNotif('Record updated!')
    } catch (err) {
      console.error(err)
      showNotif('Failed to update record.', 'error')
    }
  }

  const handleDeleteRecord = async (id) => {
    if (!window.confirm('Delete this monthly record?')) return
    try {
      const newData = await deleteMonthlyRecord(id)
      setData(newData)
      showNotif('Record deleted.', 'error')
    } catch (err) {
      console.error(err)
      showNotif('Failed to delete record.', 'error')
    }
  }

  const navItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={18}/>, label: 'Dashboard' },
    { id: 'records',   icon: <FileBarChart2  size={18}/>, label: 'Monthly Records' },
    { id: 'expenses',  icon: <ListChecks     size={18}/>, label: 'Expenses' },
    { id: 'capital',   icon: <Camera         size={18}/>, label: 'Capital' },
    { id: 'reports',   icon: <FileBarChart2  size={18}/>, label: 'Reports' },
    { id: 'settings',  icon: <Settings       size={18}/>, label: 'Settings' },
  ]

  // ── Loading screen ──────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '16px', background: '#f8fafc' }}>
        <div style={{ width: 48, height: 48, border: '4px solid #e2e8f0', borderTop: '4px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>Connecting to database…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div className="admin-layout">
      {/* Notification toast */}
      {notification && (
        <div className={`toast ${notification.type}`}>{notification.msg}</div>
      )}

      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">💰</div>
          <div>
            <div className="brand-title">Expense Admin</div>
            <div className="brand-sub">Administrator</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <a href="/view" className="nav-item viewer-link">
            <Eye size={18}/> <span>Viewer View</span>
          </a>
          <button className="nav-item logout" onClick={handleLogout}>
            <LogOut size={18}/> <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="admin-main">
        <Header
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
          isAdmin={true}
        />

        {/* Monthly Records Tab */}
        {activeTab === 'records' && (
          <div className="tab-content">
            <div className="admin-panel-card">
              <div className="panel-header">
                {editingRecordId ? <><Pencil size={18}/> Edit Monthly Summary</> : <><Plus size={18}/> Add New Month</>}
              </div>
              <form className="expense-form" onSubmit={editingRecordId ? handleEditRecordSave : handleAddMonthlyRecord}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Month (e.g. March 2026)</label>
                    <input type="text" name="month" value={recordForm.month} onChange={handleRecordFormChange} placeholder="March 2026" required />
                  </div>
                  <div className="form-group">
                    <label>Opening Balance ({data.settings.currency})</label>
                    <input type="number" name="openingBalance" value={recordForm.openingBalance} onChange={handleRecordFormChange} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Monthly Collection ({data.settings.currency})</label>
                    <input type="number" name="monthlyCollection" value={recordForm.monthlyCollection} onChange={handleRecordFormChange} required />
                  </div>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
                    <input
                      type="checkbox"
                      name="isManualSaving"
                      checked={recordForm.isManualSaving}
                      onChange={handleRecordFormChange}
                      style={{ width: 'auto' }}
                    />
                    <label style={{ margin: 0 }}>Manual Monthly Saving?</label>
                  </div>
                </div>
                {recordForm.isManualSaving && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>Manual Monthly Saving Amount</label>
                      <input type="number" name="manualSaving" value={recordForm.manualSaving} onChange={handleRecordFormChange} required />
                    </div>
                  </div>
                )}
                <div className="form-actions" style={{ marginTop: '10px' }}>
                  <button type="submit" className="btn-submit">
                    {editingRecordId ? <><Check size={16}/> Save Changes</> : <><Plus size={16}/> Add Month</>}
                  </button>
                  {editingRecordId && (
                    <button type="button" className="btn-cancel" onClick={() => { setEditingRecordId(null); setRecordForm({ month: '', openingBalance: '', monthlyCollection: '', manualSaving: '', isManualSaving: false }) }}>
                      <X size={16}/> Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="admin-panel-card">
              <div className="panel-header"><LayoutDashboard size={18}/> Existing Monthly Records</div>
              <div className="expense-list">
                <table className="expense-list-table">
                  <thead>
                    <tr>
                      <th>Month</th><th>Opening Bal</th><th>Collection</th><th>Saving</th><th>Total Saving</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.monthlyRecords.map(rec => {
                      const recTotals = calculateTotals(data.expenses, data.settings, data.monthlyRecords, rec.month)
                      return (
                        <tr key={rec.id} className={editingRecordId === rec.id ? 'row-editing' : ''}>
                          <td><strong>{rec.month}</strong></td>
                          <td className="amount-right">{rec.openingBalance.toLocaleString()}</td>
                          <td className="amount-right">{rec.monthlyCollection.toLocaleString()}</td>
                          <td className="amount-right">{recTotals.saving.toLocaleString()} {rec.isManualSaving && <span className="panel-tag">Manual</span>}</td>
                          <td className="amount-right"><strong>{recTotals.totalSaving.toLocaleString()}</strong></td>
                          <td>
                            <button className="btn-edit" onClick={() => handleEditRecordStart(rec)}><Pencil size={13}/></button>
                            <button className="btn-delete" onClick={() => handleDeleteRecord(rec.id)}><Trash2 size={13}/></button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="tab-content">
            <SummaryCards
              openingBalance={totals.record.openingBalance}
              monthlyCollection={totals.record.monthlyCollection}
              totalExpense={totals.totalExpense}
              saving={totals.saving}
              totalSaving={totals.totalSaving}
              currency={data.settings.currency}
            />
            <Charts expenses={monthlyExpenses} allExpenses={data.expenses} />
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
        )}

        {/* Expenses Tab */}
        {activeTab === 'expenses' && (
          <div className="tab-content">
            <div className="admin-panel-card">
              <div className="panel-header">
                {editingId ? (
                  <><Pencil size={18}/> Edit Expense <span className="panel-tag">Editing ID #{editingId}</span></>
                ) : (
                  <><Plus size={18}/> Add New Expense</>
                )}
              </div>
              <form className="expense-form" onSubmit={editingId ? handleEditSave : handleAddExpense}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Date</label>
                    <input type="date" name="date" value={form.date} onChange={handleFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select name="category" value={form.category} onChange={handleFormChange}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Expense Name</label>
                    <input type="text" name="name" value={form.name} onChange={handleFormChange} placeholder="e.g. Electrician Bill" required />
                  </div>
                  <div className="form-group">
                    <label>Amount ({data.settings.currency})</label>
                    <input type="number" name="amount" value={form.amount} onChange={handleFormChange} placeholder="0.00" min="0" step="0.01" required />
                  </div>
                </div>
                <div className="form-group full">
                  <label>Description</label>
                  <textarea name="description" value={form.description} onChange={handleFormChange} rows={3} placeholder="Provide additional details..." />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-submit">
                    {editingId ? <><Check size={16}/> Save Changes</> : <><Plus size={16}/> Add Expense</>}
                  </button>
                  {editingId && (
                    <button type="button" className="btn-cancel" onClick={handleCancelEdit}>
                      <X size={16}/> Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Expense List */}
            <div className="admin-panel-card">
              <div className="panel-header"><ListChecks size={18}/> All Expenses – {currentMonthKey}</div>
              {monthlyExpenses.length === 0 ? (
                <div className="empty-state">No expenses for {currentMonthKey}. Add one above!</div>
              ) : (
                <div className="expense-list">
                  <table className="expense-list-table">
                    <thead>
                      <tr>
                        <th>Date</th><th>Category</th><th>Name</th><th>Amount</th><th>Description</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyExpenses.map(exp => (
                        <tr key={exp.id} className={editingId === exp.id ? 'row-editing' : ''}>
                          <td>{exp.date}</td>
                          <td><span className="cat-badge">{exp.category}</span></td>
                          <td>{exp.name}</td>
                          <td className="amount-right">{Number(exp.amount).toLocaleString()} {data.settings.currency}</td>
                          <td className="desc-cell">{exp.description || '—'}</td>
                          <td>
                            <button className="btn-edit" onClick={() => handleEditStart(exp)}><Pencil size={13}/></button>
                            <button className="btn-delete" onClick={() => handleDelete(exp.id)}><Trash2 size={13}/></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="total-row">
                        <td colSpan={3}><strong>Total</strong></td>
                        <td className="amount-right"><strong>{Number(totals.totalExpense).toLocaleString()} {data.settings.currency}</strong></td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Capital Expenses Tab */}
        {activeTab === 'capital' && (
          <div className="tab-content">
            <div className="admin-panel-card">
              <div className="panel-header"><Camera size={18}/> Capital Expenses</div>
              <div className="capital-section">
                <div className="capital-card">
                  <div className="capital-icon">📹</div>
                  <div className="capital-info">
                    <div className="capital-label">CCTV Camera Installation</div>
                    <div className="capital-amount">{Number(data.settings.cctvExpense).toLocaleString()} {data.settings.currency}</div>
                  </div>
                </div>

                <div className="capital-edit">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', padding: '12px', background: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' }}>
                    <input
                      type="checkbox"
                      id="showCctv"
                      checked={settingsForm.showCctvExpense}
                      onChange={async (e) => {
                        const updated = { ...settingsForm, showCctvExpense: e.target.checked }
                        setSettingsForm(updated)
                        try {
                          const newData = await updateSettings(updated)
                          setData(newData)
                          showNotif(`Capital Expenses will now be ${e.target.checked ? 'shown' : 'hidden'}`)
                        } catch (err) {
                          console.error(err)
                        }
                      }}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="showCctv" style={{ margin: 0, fontWeight: '600', cursor: 'pointer', color: '#333' }}>
                      {settingsForm.showCctvExpense ? 'Show' : 'Hide'} Capital Expenditure on Front-end
                    </label>
                  </div>

                  <label>Update CCTV Expense Amount</label>
                  <div className="capital-input-row">
                    <input
                      type="number"
                      value={settingsForm.cctvExpense}
                      onChange={e => setSettingsForm({ ...settingsForm, cctvExpense: e.target.value })}
                      min="0"
                    />
                    <button className="btn-submit" onClick={handleSaveSettings}>
                      <Save size={16}/> Update
                    </button>
                  </div>
                </div>

                <div className="capital-expense-list">
                  {data.expenses.filter(e => e.category === 'Capital').map(exp => (
                    <div key={exp.id} className="capital-expense-item">
                      <span>{exp.name}</span>
                      <span>{exp.date}</span>
                      <span className="amount-right">{Number(exp.amount).toLocaleString()} {data.settings.currency}</span>
                      <button className="btn-delete" onClick={() => handleDelete(exp.id)}><Trash2 size={13}/></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="tab-content">
            <div className="admin-panel-card">
              <div className="panel-header"><FileBarChart2 size={18}/> Reports – {currentMonthKey}</div>
              <div className="reports-summary">
                <div className="report-stat"><span>Total Expenses</span><strong>{Number(totals.totalExpense).toLocaleString()} {data.settings.currency}</strong></div>
                <div className="report-stat"><span>Monthly Saving</span><strong className="saving">{Number(totals.saving).toLocaleString()} {data.settings.currency}</strong></div>
                <div className="report-stat"><span>Total Saving</span><strong className="total-saving">{Number(totals.totalSaving).toLocaleString()} {data.settings.currency}</strong></div>
              </div>
              <div className="reports-actions">
                <button className="btn-submit" onClick={() => exportToCSV(monthlyExpenses, totals, currentMonthKey)}>
                  📥 Export CSV
                </button>
                <button className="btn-submit btn-print-report" onClick={printReport}>
                  🖨️ Print Report
                </button>
              </div>
              <div className="divider" />
              <ExpenseTable
                expenses={monthlyExpenses}
                settings={data.settings}
                selectedMonth={currentMonthKey}
                totals={totals}
                isAdmin={false}
              />
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="tab-content">
            <div className="admin-panel-card">
              <div className="panel-header"><Settings size={18}/> System Settings</div>
              <div className="settings-form">
                <div className="settings-section">
                  <h4>Financial Configuration</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Default Opening Balance ({data.settings.currency})</label>
                      <input
                        type="number"
                        value={settingsForm.defaultOpeningBalance}
                        onChange={e => setSettingsForm({ ...settingsForm, defaultOpeningBalance: e.target.value })}
                        min="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>Default Monthly Collection ({data.settings.currency})</label>
                      <input
                        type="number"
                        value={settingsForm.defaultMonthlyCollection}
                        onChange={e => setSettingsForm({ ...settingsForm, defaultMonthlyCollection: e.target.value })}
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>CCTV Capital Expense ({data.settings.currency})</label>
                      <input
                        type="number"
                        value={settingsForm.cctvExpense}
                        onChange={e => setSettingsForm({ ...settingsForm, cctvExpense: e.target.value })}
                        min="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>Currency</label>
                      <select value={settingsForm.currency} onChange={e => setSettingsForm({ ...settingsForm, currency: e.target.value })}>
                        <option>PKR</option>
                        <option>USD</option>
                        <option>EUR</option>
                        <option>GBP</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        checked={settingsForm.showCctvExpense}
                        onChange={e => setSettingsForm({ ...settingsForm, showCctvExpense: e.target.checked })}
                        style={{ width: 'auto' }}
                      />
                      <label style={{ margin: 0 }}>Show Capital Expenditure on Front-end</label>
                    </div>
                  </div>
                </div>

                <div className="settings-section">
                  <h4>Expense Categories</h4>
                  <div className="categories-list">
                    {CATEGORIES.map(cat => (
                      <span key={cat} className="cat-badge">{cat}</span>
                    ))}
                  </div>
                </div>

                <div className="settings-section">
                  <h4>User Roles</h4>
                  <table className="roles-table">
                    <thead><tr><th>Role</th><th>Access</th><th>URL</th></tr></thead>
                    <tbody>
                      <tr><td>Admin</td><td>Full Access</td><td>/admin</td></tr>
                      <tr><td>Viewer</td><td>Read-Only</td><td>/view</td></tr>
                    </tbody>
                  </table>
                </div>

                <button
                  className={`btn-submit ${settingsSaved ? 'btn-saved' : ''}`}
                  onClick={handleSaveSettings}
                >
                  <Save size={16}/> {settingsSaved ? 'Saved!' : 'Save Settings'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
