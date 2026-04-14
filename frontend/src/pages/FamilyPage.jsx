import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getCurrentUser,
  getUsers,
  findFamilyById,
  logout,
} from '../utils/storage'

export default function FamilyPage() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const family = user?.familyId ? findFamilyById(user.familyId) : null
  const allUsers = getUsers()
  const members = family ? allUsers.filter(u => family.members.includes(u.id)) : []

  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (family) {
      navigator.clipboard.writeText(family.inviteCode).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

  const handleShare = () => {
    const url = `https://xn--e1afmapc.fun?invite=${family?.inviteCode}`
    if (navigator.share) {
      navigator.share({ title: 'Вступи в нашу семью КПД', url })
    } else {
      navigator.clipboard.writeText(url)
      alert('Ссылка скопирована: ' + url)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  if (!family) {
    return (
      <>
        <h2 style={{ marginBottom: 16 }}>Семья</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Вы не состоите ни в одной семье.</p>
        <div style={{ marginTop: 24 }}>
          <button className="btn-ghost" onClick={() => navigate('/app/setup-family')}>
            Присоединиться к семье
          </button>
        </div>
        <div style={{ marginTop: 12 }}>
          <button className="btn-danger" onClick={handleLogout}>Выйти</button>
        </div>
      </>
    )
  }

  return (
    <>
      <h2 style={{ marginBottom: 4 }}>🏠 {family.name}</h2>

      <div className="section-title" style={{ marginTop: 24 }}>👥 Участники</div>
      <div className="card" style={{ marginBottom: 16 }}>
        {members.map(m => (
          <div
            key={m.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 0',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <span style={{ fontSize: 28 }}>{m.role === 'adult' ? '👩' : '👦'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800 }}>{m.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {m.role === 'adult' ? 'взрослый' : 'ребёнок'}
              </div>
            </div>
            {m.id === family.createdBy && (
              <span className="badge badge-primary">admin</span>
            )}
          </div>
        ))}
      </div>

      <div className="section-title">── Пригласить участника ──</div>
      <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
        Код приглашения:
      </div>

      <div className="invite-code-box">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <span className="invite-code">{family.inviteCode}</span>
          <button
            onClick={handleCopy}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 22,
              cursor: 'pointer',
              padding: 4,
            }}
            aria-label="Копировать код"
          >
            {copied ? '✅' : '📋'}
          </button>
        </div>
        <div className="invite-code-hint">Нажми 📋 чтобы скопировать</div>
      </div>

      <div style={{ marginTop: 12 }}>
        <button className="btn-secondary" onClick={handleShare}>
          📤 Поделиться ссылкой
        </button>
      </div>

      <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <button className="btn-danger" onClick={handleLogout}>
          🚪 Выйти из аккаунта
        </button>
      </div>
    </>
  )
}
