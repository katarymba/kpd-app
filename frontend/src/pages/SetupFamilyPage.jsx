import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { createFamily, joinFamily } from '../utils/auth'
import { supabase } from '../utils/supabase'

export default function SetupFamilyPage() {
  const navigate = useNavigate()
  const { profile, loading: authLoading } = useAuth()
  const [mode, setMode] = useState(null) // 'create' | 'join'
  const [familyName, setFamilyName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (authLoading) {
    return (
      <div className="app-container auth-page">
        <div className="auth-surface">
          <div className="auth-header">
            <div className="auth-hero">⭐</div>
            <p className="auth-subtitle">Загружаем профиль...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    navigate('/')
    return null
  }

  if (profile.family_id) {
    navigate('/app/home')
    return null
  }

  const isAdult = profile?.role === 'adult' || profile?.role === 'admin'

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await createFamily(familyName, profile.id)
      navigate('/app/home')
    } catch (err) {
      setError(err.message || 'Ошибка создания семьи.')
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await joinFamily(inviteCode, profile.id)
      navigate('/app/home')
    } catch (err) {
      setError(err.message || 'Ошибка. Проверь код.')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  if (mode === 'create') {
    return (
      <div className="app-container auth-page auth-page-scroll">
        <div className="auth-surface">
          <button type="button" className="auth-back" onClick={() => setMode(null)}>←</button>

          <div className="auth-header">
            <div className="auth-hero">🏡</div>
            <h1>Создать семью</h1>
            <p className="auth-subtitle">После создания ты получишь код для других членов семьи</p>
          </div>

          <form onSubmit={handleCreate} noValidate>
            <div className="form-group">
              <label className="form-label">Название семьи</label>
              <input
                type="text"
                className="form-input"
                placeholder="Например: Семья Ивановых"
                value={familyName}
                onChange={e => setFamilyName(e.target.value)}
                required
              />
            </div>

            {error && <div className="auth-status auth-status-error">{error}</div>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Создаём...' : 'Создать семью'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (mode === 'join') {
    return (
      <div className="app-container auth-page auth-page-scroll">
        <div className="auth-surface">
          <button type="button" className="auth-back" onClick={() => setMode(null)}>←</button>

          <div className="auth-header">
            <div className="auth-hero">🔑</div>
            <h1>Вступить в семью</h1>
            <p className="auth-subtitle">Введи код, который дал тебе взрослый</p>
          </div>

          <form onSubmit={handleJoin} noValidate>
            <div className="form-group">
              <label className="form-label">Код семьи</label>
              <input
                type="text"
                className="form-input form-input-uppercase"
                placeholder="KPD-XXXX"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value.toUpperCase())}
                required
              />
            </div>

            {error && <div className="auth-status auth-status-error">{error}</div>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Проверяем...' : 'Вступить в семью'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container auth-page">
      <div className="auth-surface">
        <div className="auth-header">
          <div className="auth-hero">👨‍👩‍👧</div>
          <h1>Привет, {profile?.name}! 👋</h1>
          <p className="auth-subtitle">Ты ещё не в семье. Создай новую или вступи по коду.</p>
        </div>

        {error && <div className="auth-status auth-status-error">{error}</div>}

        <div className="welcome-actions">
          {isAdult && (
            <button className="btn-primary" onClick={() => setMode('create')}>
              🏡 Создать семью
            </button>
          )}
          <button className="btn-secondary" onClick={() => setMode('join')}>
            🔑 Вступить по коду
          </button>
          <button className="btn-ghost" onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </div>
    </div>
  )
}
