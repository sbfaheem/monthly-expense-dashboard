import './SummaryCards.css'

const SummaryCards = ({ openingBalance, monthlyCollection, totalExpense, saving, totalSaving, currency = 'PKR', isNoData }) => {
  const fmt = (n) => Number(n).toLocaleString('en-PK')
  
  const cards = [
    {
      label: 'Opening Balance',
      value: fmt(openingBalance),
      note: isNoData ? '0% change' : '0% change',
      colorClass: 'card-blue',
    },
    {
      label: 'Monthly Collection',
      value: fmt(monthlyCollection),
      note: isNoData ? '0% vs target' : '+15% vs target',
      colorClass: 'card-orange',
    },
    {
      label: 'Total Expense',
      value: fmt(totalExpense),
      note: isNoData ? '0% efficiency' : '-5% efficiency',
      colorClass: 'card-red',
    },
    {
      label: 'Monthly Saving',
      value: fmt(saving),
      note: isNoData ? '0% growth' : (saving >= 0 ? '+10% growth' : 'Over budget'),
      colorClass: isNoData ? 'card-neutral' : (saving >= 0 ? 'card-green' : 'card-red'),
    },
    {
      label: 'Total Saving',
      value: fmt(totalSaving),
      note: isNoData ? '0% net' : '+8% net',
      colorClass: 'card-gold',
    },
  ]

  return (
    <div className="summary-cards">
      {cards.map(card => (
        <div key={card.label} className={`summary-card ${card.colorClass}`}>
          <span className="card-label">{card.label}</span>
          <span className="card-value">{card.value} <span className="card-currency">{currency}</span></span>
          <span className="card-note">{card.note}</span>
        </div>
      ))}
    </div>
  )
}

export default SummaryCards
