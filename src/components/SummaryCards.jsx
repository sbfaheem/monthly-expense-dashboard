import './SummaryCards.css'

const SummaryCards = ({ openingBalance, monthlyCollection, totalExpense, saving, totalSaving, currency = 'PKR' }) => {
  const fmt = (n) => Number(n).toLocaleString('en-PK')
  
  const cards = [
    {
      label: 'Opening Balance',
      value: fmt(openingBalance),
      note: '0% change',
      colorClass: 'card-blue',
    },
    {
      label: 'Monthly Collection',
      value: fmt(monthlyCollection),
      note: '+15% vs target',
      colorClass: 'card-orange',
    },
    {
      label: 'Total Expense',
      value: fmt(totalExpense),
      note: '-5% efficiency',
      colorClass: 'card-red',
    },
    {
      label: 'Monthly Saving',
      value: fmt(saving),
      note: saving >= 0 ? '+10% growth' : 'Over budget',
      colorClass: saving >= 0 ? 'card-green' : 'card-red',
    },
    {
      label: 'Total Saving',
      value: fmt(totalSaving),
      note: '+8% net',
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
