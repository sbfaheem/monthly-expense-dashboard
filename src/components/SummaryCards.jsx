const SummaryCards = ({ openingBalance, monthlyCollection, totalExpense, saving, totalSaving, currency = 'PKR', isNoData }) => {
  const fmt = (n) => Number(n).toLocaleString('en-PK')
  
  const cards = [
    {
      label: 'Opening Balance',
      value: fmt(openingBalance),
      note: isNoData ? '0% change' : 'No change',
      icon: 'account_balance',
      iconColor: 'text-slate-400',
      noteIcon: 'trending_flat',
      noteColor: 'text-slate-400',
      cardClass: 'bg-white dark:bg-slate-800 border border-primary/10'
    },
    {
      label: 'Monthly Collection',
      value: fmt(monthlyCollection),
      note: isNoData ? '0% vs target' : '-4.2%',
      icon: 'payments',
      iconColor: 'text-orange-500',
      noteIcon: 'trending_down',
      noteColor: 'text-red-500',
      cardClass: 'bg-white dark:bg-slate-800 border border-primary/10 border-l-4 border-l-orange-500'
    },
    {
      label: 'Total Expense',
      value: fmt(totalExpense),
      note: isNoData ? '0% efficiency' : '+2.1%',
      icon: 'shopping_cart',
      iconColor: 'text-primary',
      noteIcon: 'trending_up',
      noteColor: 'text-primary',
      cardClass: 'bg-white dark:bg-slate-800 border border-primary/10 border-l-4 border-l-primary'
    },
    {
      label: 'Monthly Saving',
      value: fmt(saving),
      note: isNoData ? '0% growth' : (saving >= 0 ? 'Target Met' : 'Missed Target'),
      icon: 'savings',
      iconColor: saving >= 0 ? 'text-green-500' : 'text-red-500',
      noteIcon: saving >= 0 ? 'check_circle' : 'warning',
      noteColor: saving >= 0 ? 'text-green-500' : 'text-red-500',
      cardClass: saving >= 0 
        ? 'bg-white dark:bg-slate-800 border border-primary/10 border-l-4 border-l-green-500' 
        : 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 border-l-4 border-l-red-500'
    },
    {
      label: totalSaving >= 0 ? 'Total Saving' : 'Total Deficit',
      value: fmt(Math.abs(totalSaving)),
      note: isNoData ? '0% net' : (totalSaving >= 0 ? '+15.4%' : 'Net Deficit'),
      icon: 'account_balance_wallet',
      iconColor: totalSaving >= 0 ? 'text-secondary-gold' : 'text-red-500',
      noteIcon: totalSaving >= 0 ? 'stars' : 'warning',
      noteColor: totalSaving >= 0 ? 'text-primary' : 'text-red-500',
      valueColor: totalSaving >= 0 ? 'text-slate-900 dark:text-slate-100' : 'text-red-600 dark:text-red-400',
      cardClass: totalSaving >= 0 
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
