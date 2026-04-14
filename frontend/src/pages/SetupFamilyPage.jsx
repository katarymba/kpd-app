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
  const [success, setSuccess] = useState('')

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ fontSize: 48 }}>⭐</div>
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
    setSuccess('')

    if (!familyName.trim() || familyName.trim().length < 2) {
      setError('🏡 Введи название семьи (минимум 2 символа)')
      return
    }

    setLoading(true)
    try {
      await createFamily(familyName.trim(), profile.id)
      setSuccess('✅ Семья создана! Переходим на главную...')
      setTimeout(() => navigate('/app/home'), 1500)
    } catch (err) {
      setError(err.message || 'Ошибка создания семьи.')
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!inviteCode.trim() || inviteCode.trim().length < 5) {
      setError('🔑 Введи правильный код семьи (вида KPD-XXXX)')
      return
    }

    setLoading(true)
    try {
      await joinFamily(inviteCode.trim(), profile.id)
      setSuccess('✅ Вступил в семью! Переходим на главную...')
      setTimeout(() => navigate('/app/home'), 1500)
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
      <div className="app-container">
        <div className="page" style={{ paddingTop: 40 }}>
          <button
            onClick={() => setMode(null)}
            style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', marginBottom: 16, padding: 0 }}
            disabled={loading}
          >
            ←
          </button>

          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>🏡</div>
            <h1>Создать семью</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
              После создания ты получишь код для других членов семьи
            </p>
          </div>

          <form onSubmit={handleCreate}>
            <div style={{ marginBottom: 24 }}>
              <label className="label" style={{ display: 'block', marginBottom: 6 }}>Название семьи</label>
              <input
                type="text"
                className="input"
                placeholder="Например: Семья Ивановых"
                value={familyName}
                onChange={e => setFamilyName(e.target.value)}
                required
                autoFocus
                disabled={loading}
              />
            </div>

            {error && (
              <div style={{
                color: 'var(--danger)',
                marginBottom: 16,
                fontSize: 14,
                textAlign: 'center',
                padding: 12,
                background: 'rgba(255, 59, 48, 0.1)',
                borderRadius: 8,
              }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{
                color: '#22c55e',
                marginBottom: 16,
                fontSize: 14,
                textAlign: 'center',
                padding: 12,
                background: 'rgba(34, 197, 94, 0.1)',
                borderRadius: 8,
              }}>
                {success}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
              {loading ? '⏳ Создаём...' : 'Создать семью'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (mode === 'join') {
    return (
      <div className="app-container">
        <div className="page" style={{ paddingTop: 40 }}>
          <button
            onClick={() => setMode(null)}
            style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', marginBottom: 16, padding: 0 }}
            disabled={loading}
          >
            ←
          </button>

          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>🔑</div>
            <h1>Вступить в семью</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
              Введи код, который дал тебе взрослый
            </p>
          </div>

          <form onSubmit={handleJoin}>
            <div style={{ marginBottom: 24 }}>
              <label className="label" style={{ display: 'block', marginBottom: 6 }}>Код семьи</label>
              <input
                type="text"
                className="input"
                placeholder="KPD-XXXX"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value.toUpperCase())}
                required
                autoFocus
                disabled={loading}
                style={{ textTransform: 'uppercase', letterSpacing: 2, fontSize: 20, textAlign: 'center' }}
              />
            </div>

            {error && (
              <div style={{
                color: 'var(--danger)',
                marginBottom: 16,
                fontSize: 14,
                textAlign: 'center',
                padding: 12,
                background: 'rgba(255, 59, 48, 0.1)',
                borderRadius: 8,
              }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{
                color: '#22c55e',
                marginBottom: 16,
                fontSize: 14,
                textAlign: 'center',
                padding: 12,
                background: 'rgba(34, 197, 94, 0.1)',
                borderRadius: 8,
              }}>
                {success}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
              {loading ? '⏳ Проверяем...' : 'Вступить в семью'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <div className="page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>👨‍👩‍👧</div>
        <h1 style={{ marginBottom: 8 }}>Привет, {profile?.name}! 👋</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 40, fontSize: 16 }}>
          Ты ещё не в семье. Создай новую или вступи по коду.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {isAdult && (
            <button className="btn-primary" onClick={() => setMode('create')}>
              🏡 Создать семью
            </button>
          )}
          <button className="btn-secondary" onClick={() => setMode('join')}>
            🔑 Вступить по коду
          </button>
          <button
            className="btn-ghost"
            style={{ marginTop: 8 }}
            onClick={handleLogout}
          >
            Выйти
          </button>
        </div>
      </div>
    </div>
  )
}
