const SummaryCards = ({
  openingBalance = 0,
  monthlyCollection = 0,
  totalExpense = 0,
  saving = 0,
  totalSaving = 0,
  netCashFlow,
  status,
  closingBalance,
  isOverdrawn,
  currency = 'PKR',
  isNoData = false
}) => {
  const fmt = (n) => Number(n || 0).toLocaleString('en-PK')
  
  // Use standardized finance props if provided, fallback to saving/totalSaving
  const actualNetCashFlow = typeof netCashFlow === 'number' ? netCashFlow : Number(saving || 0)
  const actualStatus = status || (actualNetCashFlow >= 0 ? 'Surplus' : 'Deficit')
  const actualClosing = typeof closingBalance === 'number' ? closingBalance : Number(totalSaving || 0)
  const actualOverdrawn = typeof isOverdrawn === 'boolean' ? isOverdrawn : actualClosing < 0
  const isSurplus = actualNetCashFlow >= 0

  const cards = [
    {
      label: 'Opening Balance',
      value: fmt(openingBalance),
      note: isNoData ? '0% change' : 'Previous closing',
      icon: 'account_balance',
      iconColor: 'text-slate-400',
      noteIcon: 'trending_flat',
      noteColor: 'text-slate-400',
      cardClass: 'bg-white dark:bg-slate-800 border border-primary/10'
    },
    {
      label: 'Monthly Collection',
      value: fmt(monthlyCollection),
      note: isNoData ? '0% vs target' : 'Resident collections',
      icon: 'payments',
      iconColor: 'text-orange-500',
      noteIcon: 'receipt_long',
      noteColor: 'text-slate-500',
      cardClass: 'bg-white dark:bg-slate-800 border border-primary/10 border-l-4 border-l-orange-500'
    },
    {
      label: 'Total Expense',
      value: fmt(totalExpense),
      note: isNoData ? '0% efficiency' : 'Total operational spend',
      icon: 'shopping_cart',
      iconColor: 'text-primary',
      noteIcon: 'receipt',
      noteColor: 'text-primary',
      cardClass: 'bg-white dark:bg-slate-800 border border-primary/10 border-l-4 border-l-primary'
    },
    {
      label: isSurplus ? 'Monthly Surplus' : 'Monthly Deficit',
      value: fmt(Math.abs(actualNetCashFlow)),
      note: isNoData ? '0% net' : (isSurplus ? 'Surplus (+ Cash Flow)' : 'Deficit (- Net Outflow)'),
      icon: isSurplus ? 'savings' : 'trending_down',
      iconColor: isSurplus ? 'text-green-500' : 'text-red-500',
      noteIcon: isSurplus ? 'check_circle' : 'warning',
      noteColor: isSurplus ? 'text-green-500' : 'text-red-500',
      valueColor: isSurplus ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
      cardClass: isSurplus 
        ? 'bg-white dark:bg-slate-800 border border-primary/10 border-l-4 border-l-green-500' 
        : 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 border-l-4 border-l-red-500'
    },
    {
      label: !actualOverdrawn ? 'Closing Balance (Surplus)' : 'Closing Balance (Deficit)',
      value: fmt(Math.abs(actualClosing)),
      note: isNoData ? '0% net' : (!actualOverdrawn ? 'Accumulated Reserve' : 'Overdrawn / Deficit'),
      icon: 'account_balance_wallet',
      iconColor: !actualOverdrawn ? 'text-secondary-gold' : 'text-red-500',
      noteIcon: !actualOverdrawn ? 'stars' : 'warning',
      noteColor: !actualOverdrawn ? 'text-primary' : 'text-red-500',
      valueColor: !actualOverdrawn ? 'text-slate-900 dark:text-slate-100' : 'text-red-600 dark:text-red-400',
      cardClass: !actualOverdrawn 
        ? 'bg-white dark:bg-slate-800 border border-primary/10 border-l-4 border-l-secondary-gold' 
        : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 border-l-4 border-l-red-500'
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map(card => (
        <div key={card.label} className={`p-5 rounded-2xl shadow-sm hover:shadow-md transition-all ${card.cardClass}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">{card.label}</span>
            <span className={`material-symbols-outlined ${card.iconColor}`}>{card.icon}</span>
          </div>
          <div className={`text-2xl font-bold tracking-tight ${card.valueColor || 'text-slate-900 dark:text-slate-100'}`}>
            {currency} {card.value}
          </div>
          <div className={`mt-2 text-xs font-semibold flex items-center gap-1 ${card.noteColor}`}>
            <span className="material-symbols-outlined text-xs">{card.noteIcon}</span> {card.note}
          </div>
        </div>
      ))}
    </div>
  )
}

export default SummaryCards
