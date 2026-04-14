import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getHistory, getBalance } from '../utils/points'

const isAdultRole = (role) => role === 'admin' || role === 'adult'

const SOURCE_META = {
  task: { emoji: '✅', label: 'Задание' },
  grade: { emoji: '📚', label: 'Оценка' },
  like: { emoji: '👍', label: 'Лайк' },
  bonus: { emoji: '⭐', label: 'Бонус' },
  manual: { emoji: '➕', label: 'Ручное' },
  penalty: { emoji: '❌', label: 'Штраф' },
  purchase: { emoji: '🛒', label: 'Покупка' },
  x2_bonus: { emoji: '⚡', label: 'X2' },
}

function formatDate(iso) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return 'только что'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} мин назад`
  if (diff < 86400000) return d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('ru', { day: 'numeric', month: 'short' })
}

export default function HistoryPage() {
  const { profile } = useAuth()
  const [history, setHistory] = useState([])
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const isAdult = profile && isAdultRole(profile.role)

  useEffect(() => {
    if (profile?.family_id) loadHistory()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  async function loadHistory() {
    setLoading(true)
    setError('')
    try {
      const [data, bal] = await Promise.all([
        getHistory(profile.family_id),
        getBalance(profile.id)
      ])
      // For children: show only their own history
      const filtered = isAdult ? data : data.filter(item => item.user_id === profile.id)
      setHistory(filtered)
      setBalance(bal)
    } catch {
      setError('Не удалось загрузить историю.')
    } finally {
      setLoading(false)
    }
  }

  const totalEarned = history.filter(i => i.amount > 0).reduce((s, i) => s + i.amount, 0)
  const totalSpent = history.filter(i => i.amount < 0).reduce((s, i) => s + i.amount, 0)

  return (
    <>
      <h2 style={{ marginBottom: 16 }}>История</h2>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
        {[
          { label: 'Баланс', value: `⭐ ${balance}`, color: 'var(--primary)' },
          { label: 'Заработано', value: `+${totalEarned}`, color: '#22c55e' },
          { label: 'Потрачено', value: `${totalSpent}`, color: 'var(--danger)' }
        ].map(({ label, value, color }) => (
          <div key={label} className="card" style={{ textAlign: 'center', padding: '12px 8px' }}>
            <div style={{ color, fontWeight: 800, fontSize: 16 }}>{value}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {error && (
        <div style={{ color: 'var(--danger)', marginBottom: 12, fontSize: 14 }}>{error}</div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 32, fontSize: 32 }}>⭐</div>
      ) : history.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 32 }}>
          История пока пуста. Выполняй задания, чтобы зарабатывать баллы! ⭐
        </div>
      ) : (
        history.map(item => {
          const meta = SOURCE_META[item.source] || { emoji: '⭐', label: item.source }
          return (
            <div key={item.id} className="task-card" style={{ marginBottom: 8 }}>
              <div className="task-icon" style={{ background: 'var(--bg-secondary)' }} aria-hidden="true">
                {meta.emoji}
              </div>
              <div className="task-info">
                <div className="task-name">
                  {item.profiles?.name && isAdult ? `${item.profiles.name} — ` : ''}{item.description || meta.label}
                </div>
                <div className="task-meta">{formatDate(item.created_at)}</div>
              </div>
              <span
                className="task-points"
                style={{ color: item.amount > 0 ? 'var(--primary)' : 'var(--danger)' }}
              >
                {item.amount > 0 ? '+' : ''}{item.amount} ⭐
              </span>
            </div>
          )
        })
      )}
    </>
  )
}

