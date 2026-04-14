const HISTORY_ITEMS = [
  { who: 'Мама',    what: 'Уборка',              pts: +5,  time: '18:32',  emoji: '🏠' },
  { who: 'Папа',    what: '👍 Лайк',             pts: +2,  time: '17:10',  emoji: '👍' },
  { who: 'Мама',    what: 'Зарядка',             pts: +6,  time: '09:00',  emoji: '⚡' },
  { who: 'Система', what: 'Покупка в магазине',  pts: -50, time: 'вчера',  emoji: '🛒' },
]

export default function HistoryPage() {
  return (
    <>
      <h2 style={{ marginBottom: 16 }}>История</h2>
      {HISTORY_ITEMS.map((item, i) => (
        <div key={i} className="task-card" style={{ marginBottom: 8 }}>
          <div className="task-icon" style={{ background: 'var(--bg-secondary)' }} aria-hidden="true">
            {item.emoji}
          </div>
          <div className="task-info">
            <div className="task-name">{item.who} — {item.what}</div>
            <div className="task-meta">{item.time}</div>
          </div>
          <span
            className="task-points"
            style={{ color: item.pts > 0 ? 'var(--primary)' : 'var(--danger)' }}
          >
            {item.pts > 0 ? '+' : ''}{item.pts} ⭐
          </span>
        </div>
      ))}
    </>
  )
}
