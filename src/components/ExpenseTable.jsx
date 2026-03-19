import './ExpenseTable.css'

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
    }))
  }

  const opExpenses = getExpensesByCategory(OPERATIONAL)
  const miscExpenses = getExpensesByCategory(MISCELLANEOUS)

  const monthShort = selectedMonth?.split(' ')
  const monthLabel = monthShort ? `${monthShort[0].toUpperCase()} ${monthShort[1]}` : ''

  return (
    <div className="expense-table-wrapper">
      <div className="table-header-bar">
        <span>FINANCIAL SUMMARY – {selectedMonth?.toUpperCase()}</span>
        <span className="table-icon">📋</span>
      </div>
      <table className="expense-table">
        <thead>
          <tr>
            <th className="col-desc">DESCRIPTION</th>
            <th className="col-amount">AMOUNT ({settings.currency})</th>
            {isAdmin && <th className="col-actions">ACTIONS</th>}
          </tr>
        </thead>
        <tbody>
          {/* Operational Expenses header */}
          <tr className="category-header">
            <td colSpan={isAdmin ? 3 : 2}>OPERATIONAL EXPENSES</td>
          </tr>
          {opExpenses.map(({ name, amount, expense }) => (
            <tr key={name} className="expense-row">
              <td className="expense-name">{name}</td>
              <td className="amount-cell">{fmt(amount)}</td>
              {isAdmin && (
                <td className="actions-cell">
                  {expense && (
                    <>
                      <button className="btn-edit" onClick={() => onEdit(expense)}>Edit</button>
                      <button className="btn-delete" onClick={() => onDelete(expense.id)}>Del</button>
                    </>
                  )}
                </td>
              )}
            </tr>
          ))}

          {/* Misc Expenses header */}
          <tr className="category-header miscellaneous">
            <td colSpan={isAdmin ? 3 : 2}>MISCELLANEOUS EXPENSES</td>
          </tr>
          {miscExpenses.map(({ name, amount, expense }) => (
            <tr key={name} className="expense-row misc-row">
              <td className="expense-name">{name}</td>
              <td className="amount-cell">{fmt(amount)}</td>
              {isAdmin && (
                <td className="actions-cell">
                  {expense && (
                    <>
                      <button className="btn-edit" onClick={() => onEdit(expense)}>Edit</button>
                      <button className="btn-delete" onClick={() => onDelete(expense.id)}>Del</button>
                    </>
                  )}
                </td>
              )}
            </tr>
          ))}

          {/* Total Expense */}
          <tr className="row-total-expense">
            <td className="bold-cell">TOTAL MONTHLY EXPENSE</td>
            <td className="amount-cell total-expense-amount">{fmt(totals.totalExpense)}</td>
            {isAdmin && <td></td>}
          </tr>

          {/* Saving */}
          <tr className="row-saving">
            <td className="bold-cell">CURRENT MONTH SAVING</td>
            <td className="amount-cell saving-amount">{fmt(totals.saving)}</td>
            {isAdmin && <td></td>}
          </tr>

          {/* CCTV */}
          {settings.showCctvExpense && (
            <tr className="expense-row">
              <td>Capital Expenditure (CCTV)</td>
              <td className="amount-cell cctv-amount">{fmt(settings.cctvExpense)}</td>
              {isAdmin && <td></td>}
            </tr>
          )}

          {/* Total Saving */}
          <tr className="row-total-saving">
            <td className="bold-cell">TOTAL ACCUMULATED SAVING</td>
            <td className="amount-cell total-saving-amount">{fmt(totals.totalSaving)}</td>
            {isAdmin && <td></td>}
          </tr>
        </tbody>
      </table>

      {/* Notes Section */}
      <div className="notes-section">
        <h3>Notes</h3>
        <div className="notes-content">
          <p><strong>Point of Contact:</strong><br />
            For any questions or clarifications regarding this financial summary, please contact <strong>Mr. Majeed Shb</strong> 0301-3377675 and <strong>Mr. Fahad Rizwan</strong> 0344-3160446
          </p>
          <p><strong>Scope of Responsibility:</strong><br />
            The management has taken over responsibility effective <strong>December 01, 2025</strong>. Therefore, this financial summary only covers collections and expenditures from that date onward.
          </p>
          <p><strong>Nature of Report:</strong><br />
            This document is a Financial Summary of Collections &amp; Expenditures, providing an overview of total receipts and related expenses during the reporting period.
          </p>
          <p className="formula-note"><strong>Formulae:</strong> 1. Saving = Monthly Collection - Total Expense {settings.showCctvExpense ? <>&nbsp;|&nbsp; 2. Total Saving = (Opening Balance + Saving) - Installed CCTV Camera</> : <>&nbsp;|&nbsp; 2. Total Saving = Opening Balance + Saving</>}</p>
        </div>
      </div>
    </div>
  )
}

export default ExpenseTable
