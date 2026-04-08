const OPERATIONAL = ['Security Expense', 'Electrician Charges', 'Sweeper Salary', 'Sweeper Accessories', 'Electrical Accessories', 'Park']
const MISCELLANEOUS = ['Chair', 'Wire Lock', 'Wooden Stair', 'Transportation for Wooden Stair', 'Ring + Cap Labour Charges', 'Miscellaneous', 'Remaining amount for Water Chamber']

const ExpenseTable = ({ expenses, settings, selectedMonth, totals, onEdit, onDelete, isAdmin }) => {
  const fmt = (n) => Number(n || 0).toLocaleString('en-PK')

  const getExpenseByName = (name) => {
    const found = expenses.find(e => e.name === name)
    return found ? found.amount : 0
  }

  const getExpensesByCategory = (names) => {
    return names.map(name => ({
      name,
      amount: getExpenseByName(name),
      expense: expenses.find(e => e.name === name),
    })).filter(x => x.expense) // Only render if the expense actually exists in db
  }

  const opExpenses = getExpensesByCategory(OPERATIONAL)
  const miscExpenses = getExpensesByCategory(MISCELLANEOUS)

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-primary/10 overflow-hidden">
        <div className="px-6 py-4 bg-primary/5 border-b border-primary/10 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Operational Expenses</h3>
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-bold uppercase">{opExpenses.length} Line Items</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="text-xs font-bold text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3 text-right">Amount ({settings.currency})</th>
                {isAdmin && <th className="px-6 py-3 border-l tracking-wide  w-20 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {opExpenses.length === 0 ? (
                <tr><td colSpan={isAdmin ? 3 : 2} className="px-6 py-4 text-center text-slate-400">No operational expenses</td></tr>
              ) : opExpenses.map(({ name, amount, expense }) => (
                <tr key={name} className="hover:bg-primary/5 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium">{name}</td>
                  <td className="px-6 py-4 text-sm font-bold text-right">{fmt(amount)}</td>
                  {isAdmin && (
                    <td className="px-4 py-2 border-l text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => onEdit(expense)} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold hover:bg-blue-100">Edit</button>
                        <button onClick={() => onDelete(expense.id)} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded font-bold hover:bg-red-100">Del</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-primary/10 overflow-hidden">
        <div className="px-6 py-4 bg-secondary-gold/10 border-b border-secondary-gold/20 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Miscellaneous Expenses</h3>
          <span className="text-xs bg-secondary-gold/20 text-secondary-gold px-2 py-1 rounded font-bold uppercase">{miscExpenses.length} Line Items</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="text-xs font-bold text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3 text-right">Amount ({settings.currency})</th>
                {isAdmin && <th className="px-6 py-3 border-l tracking-wide  w-20 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {miscExpenses.length === 0 ? (
                <tr><td colSpan={isAdmin ? 3 : 2} className="px-6 py-4 text-center text-slate-400">No miscellaneous expenses</td></tr>
              ) : miscExpenses.map(({ name, amount, expense }) => (
                <tr key={name} className="hover:bg-primary/5 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium">{name}</td>
                  <td className="px-6 py-4 text-sm font-bold text-right">{fmt(amount)}</td>
                  {isAdmin && (
                    <td className="px-4 py-2 border-l text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => onEdit(expense)} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold hover:bg-blue-100">Edit</button>
                        <button onClick={() => onDelete(expense.id)} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded font-bold hover:bg-red-100">Del</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Aggregate Financial Metrics Embedded Bottom Area */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-primary/10 overflow-hidden divide-y divide-primary/5">
         <div className="px-6 py-4 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
           <span className="text-sm font-bold text-slate-600 dark:text-slate-400">TOTAL MONTHLY EXPENSE</span>
           <span className="text-lg font-bold text-primary">{fmt(totals.totalExpense)}</span>
         </div>
         <div className="px-6 py-4 flex justify-between items-center">
           <span className="text-sm font-bold text-slate-600 dark:text-slate-400">CURRENT MONTH SAVING</span>
           <span className="text-lg font-bold text-green-600 dark:text-green-400">{fmt(totals.saving)}</span>
         </div>
         {totals.record.showCctvExpense && (
           <div className="px-6 py-4 flex justify-between items-center text-red-600">
             <span className="text-sm font-bold">Capital Expenditure (CCTV)</span>
             <span className="text-lg font-bold">{fmt(totals.record.cctvExpense)}</span>
           </div>
         )}
         <div className="px-6 py-4 flex justify-between items-center bg-primary/10">
           <span className="text-sm font-extrabold text-primary">TOTAL ACCUMULATED SAVING</span>
           <span className="text-xl font-extrabold text-primary">{fmt(totals.totalSaving)}</span>
         </div>
      </div>
    </>
  )
}

export default ExpenseTable
