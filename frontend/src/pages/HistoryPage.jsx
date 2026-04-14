import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getHistory } from '../utils/points'
import BottomNav from '../components/BottomNav'

const SOURCE_EMOJI = {
  task: '✅',
  grade: '📚',
  like: '👍',
  bonus: '⭐',
  manual: '➕',
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
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (profile?.family_id) loadHistory()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  async function loadHistory() {
    setLoading(true)
    setError('')
    try {
      const data = await getHistory(profile.family_id)
      setHistory(data)
    } catch {
      setError('Не удалось загрузить историю.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      <div className="page">
        <h2 style={{ marginBottom: 16 }}>История</h2>

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
          history.map(item => (
            <div key={item.id} className="task-card" style={{ marginBottom: 8 }}>
              <div
                className="task-icon"
                style={{ background: 'var(--bg-secondary)' }}
                aria-hidden="true"
              >
                {SOURCE_EMOJI[item.source] || '⭐'}
              </div>
              <div className="task-info">
                <div className="task-name">
                  {item.profiles?.name || 'Пользователь'} — {item.description || item.source}
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
          ))
        )}
      </div>

      <BottomNav active="history" onChange={key => navigate(`/app/${key}`)} />
    </div>
  )
}
