import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { useAuth } from '../hooks/useAuth'
import { translateSupabaseError } from '../utils/errorMessages'

export default function SetupFamilyPage() {
  const navigate = useNavigate()
  const { user, profile, loading: authLoading } = useAuth()

  const [mode, setMode] = useState(null) // 'create' or 'join'
  const [familyName, setFamilyName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    // Если пользователь уже в семье — перенаправить на главную
    if (profile?.family_id) {
      navigate('/app/home')
    }

    // Определить режим по роли
    if (profile?.role === 'adult' || profile?.role === 'admin') {
      setMode('create')
    } else if (profile?.role === 'child') {
      setMode('join')
    }
  }, [profile, navigate])

  function validateCreateForm() {
    if (!familyName.trim()) {
      setError('🏠 Введи название семьи')
      return false
    }
    if (familyName.trim().length < 2) {
      setError('🏠 Название должно быть не менее 2 символов')
      return false
    }
    return true
  }

  function validateJoinForm() {
    if (!inviteCode.trim()) {
      setError('🔑 Введи код семьи')
      return false
    }
    if (inviteCode.trim().length < 5) {
      setError('🔑 Код семьи должен быть вида KPD-XXXX')
      return false
    }
    return true
  }

  async function handleCreateFamily(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!validateCreateForm()) {
      return
    }

    if (!user?.id) {
      setError('❌ Не удалось определить пользователя. Попробуй выйти и войти снова.')
      return
    }

    setLoading(true)

    try {
      const trimmedName = familyName.trim()

      // 1. Проверить что у пользователя нет семьи
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('family_id')
        .eq('id', user.id)
        .single()

      if (existingProfile?.family_id) {
        throw new Error('У тебя уже есть семья! Переход на главную...')
      }

      // 2. Сгенерировать уникальный код
      let generatedCode = ''
      let isUnique = false
      let attempts = 0

      while (!isUnique && attempts < 10) {
        generatedCode = 'KPD-' + Math.random().toString(36).substring(2, 6).toUpperCase()

        const { data: existing } = await supabase
          .from('families')
          .select('id')
          .eq('invite_code', generatedCode)
          .maybeSingle()

        if (!existing) {
          isUnique = true
        }
        attempts++
      }

      if (!isUnique) {
        throw new Error('Не удалось создать уникальный код. Попробуй ещё раз.')
      }

      // 3. Создать семью
      const { data: family, error: familyError } = await supabase
        .from('families')
        .insert({
          name: trimmedName,
          invite_code: generatedCode,
          created_by: user.id,
        })
        .select()
        .single()

      if (familyError) {
        console.error('Family creation error:', familyError)
        throw new Error(translateSupabaseError(familyError))
      }

      if (!family) {
        throw new Error('Семья создалась, но не вернулись данные. Попробуй обновить страницу.')
      }

      // 4. Привязать пользователя к семье и сделать админом
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          family_id: family.id,
          role: 'admin',
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Profile update error:', updateError)
        throw new Error(translateSupabaseError(updateError))
      }

      // 5. Показать успех с кодом
      setSuccess(`🎉 Семья "${trimmedName}" создана! Код: ${generatedCode}`)

      // 6. Перенаправить через 2 секунды
      setTimeout(() => {
        navigate('/app/home')
      }, 2000)
    } catch (err) {
      console.error('Create family error:', err)
      setError(err.message || 'Ошибка создания семьи. Попробуй снова.')

      // Если семья уже есть — перенаправить
      if (err.message.includes('уже есть семья')) {
        setTimeout(() => navigate('/app/home'), 1500)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleJoinFamily(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!validateJoinForm()) {
      return
    }

    if (!user?.id) {
      setError('❌ Не удалось определить пользователя. Попробуй выйти и войти снова.')
      return
    }

    setLoading(true)

    try {
      const trimmedCode = inviteCode.trim().toUpperCase()

      // 1. Проверить что у пользователя нет семьи
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('family_id')
        .eq('id', user.id)
        .single()

      if (existingProfile?.family_id) {
        throw new Error('У тебя уже есть семья! Переход на главную...')
      }

      // 2. Найти семью по коду
      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('id, name')
        .eq('invite_code', trimmedCode)
        .maybeSingle()

      if (familyError) {
        console.error('Family lookup error:', familyError)
        throw new Error(translateSupabaseError(familyError))
      }

      if (!family) {
        throw new Error('🔍 Семья с таким кодом не найдена. Проверь код и попробуй снова.')
      }

      // 3. Присоединиться к семье
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ family_id: family.id })
        .eq('id', user.id)

      if (updateError) {
        console.error('Join family error:', updateError)
        throw new Error(translateSupabaseError(updateError))
      }

      // 4. Показать успех
      setSuccess(`🎉 Ты присоединился к семье "${family.name}"!`)

      // 5. Перенаправить через 1.5 секунды
      setTimeout(() => {
        navigate('/app/home')
      }, 1500)
    } catch (err) {
      console.error('Join family error:', err)
      setError(err.message || 'Ошибка присоединения к семье. Попробуй снова.')

      // Если семья уже есть — перенаправить
      if (err.message.includes('уже есть семья')) {
        setTimeout(() => navigate('/app/home'), 1500)
      }
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="app-container">
        <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
            <p style={{ color: 'var(--text-secondary)' }}>Загрузка...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <div className="page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh' }}>

        {/* Создание семьи (взрослые) */}
        {mode === 'create' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 56, marginBottom: 8 }}>🏠</div>
              <h1>Создай семью</h1>
              <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
                Придумай название и получи код для приглашения
              </p>
            </div>

            <form onSubmit={handleCreateFamily} noValidate>
              <div style={{ marginBottom: 24 }}>
                <label className="label" style={{ display: 'block', marginBottom: 6 }}>
                  Название семьи
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="Например: Семья Ивановых"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  required
                  autoFocus
                  disabled={loading}
                />
              </div>

              {error && (
                <div
                  style={{
                    color: 'var(--danger)',
                    marginBottom: 16,
                    fontSize: 14,
                    textAlign: 'center',
                    padding: 12,
                    background: 'rgba(255, 59, 48, 0.1)',
                    borderRadius: 8,
                    border: '1px solid rgba(255, 59, 48, 0.2)',
                  }}
                >
                  {error}
                </div>
              )}

              {success && (
                <div
                  style={{
                    color: 'var(--primary)',
                    marginBottom: 16,
                    fontSize: 14,
                    textAlign: 'center',
                    padding: 12,
                    background: 'rgba(88, 204, 2, 0.1)',
                    borderRadius: 8,
                    border: '1px solid rgba(88, 204, 2, 0.2)',
                  }}
                >
                  {success}
                </div>
              )}

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? '⏳ Создаём семью...' : 'Создать семью'}
              </button>
            </form>
          </>
        )}

        {/* Присоединение к семье (дети) */}
        {mode === 'join' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 56, marginBottom: 8 }}>🔑</div>
              <h1>Присоединись к семье</h1>
              <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
                Введи код который дал тебе взрослый
              </p>
            </div>

            <form onSubmit={handleJoinFamily} noValidate>
              <div style={{ marginBottom: 24 }}>
                <label className="label" style={{ display: 'block', marginBottom: 6 }}>
                  Код семьи
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="KPD-XXXX"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  required
                  autoFocus
                  disabled={loading}
                  style={{ textTransform: 'uppercase', letterSpacing: '2px' }}
                />
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>
                  Попроси код у мамы или папы
                </p>
              </div>

              {error && (
                <div
                  style={{
                    color: 'var(--danger)',
                    marginBottom: 16,
                    fontSize: 14,
                    textAlign: 'center',
                    padding: 12,
                    background: 'rgba(255, 59, 48, 0.1)',
                    borderRadius: 8,
                    border: '1px solid rgba(255, 59, 48, 0.2)',
                  }}
                >
                  {error}
                </div>
              )}

              {success && (
                <div
                  style={{
                    color: 'var(--primary)',
                    marginBottom: 16,
                    fontSize: 14,
                    textAlign: 'center',
                    padding: 12,
                    background: 'rgba(88, 204, 2, 0.1)',
                    borderRadius: 8,
                    border: '1px solid rgba(88, 204, 2, 0.2)',
                  }}
                >
                  {success}
                </div>
              )}

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? '⏳ Присоединяюсь...' : 'Присоединиться'}
              </button>
            </form>
          </>
        )}

        {/* Выбор режима (если роль не определена) */}
        {!mode && !authLoading && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>👨‍👩‍👧</div>
              <h1 style={{ marginBottom: 8 }}>Привет, {profile?.name}! 👋</h1>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 40, fontSize: 16 }}>
                Ты ещё не в семье. Создай новую или вступи по коду.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button className="btn-primary" onClick={() => setMode('create')}>
                🏠 Создать семью
              </button>
              <button className="btn-secondary" onClick={() => setMode('join')}>
                🔑 Вступить по коду
              </button>
              <button
                className="btn-ghost"
                style={{ marginTop: 8 }}
                onClick={() => supabase.auth.signOut().then(() => navigate('/'))}
              >
                Выйти
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
