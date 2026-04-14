import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { translateSupabaseError } from '../utils/errorMessages'

export default function RegisterChildPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function validateForm() {
    if (!name.trim()) {
      setError('👤 Введи своё имя')
      return false
    }
    if (name.trim().length < 2) {
      setError('👤 Имя должно быть не менее 2 символов')
      return false
    }
    if (!inviteCode.trim()) {
      setError('🔑 Введи код семьи')
      return false
    }
    if (inviteCode.trim().length < 5) {
      setError('🔑 Код семьи неправильный (должен быть вида KPD-XXXX)')
      return false
    }
    return true
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // 1. Проверить что семья существует
      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('id, name')
        .eq('invite_code', inviteCode.trim().toUpperCase())
        .single()

      if (familyError || !family) {
        throw new Error('🔍 Семья с таким кодом не найдена. Проверь код.')
      }

      // 2. Создать технический email и безопасный пароль
      const timestamp = Date.now()
      const techEmail = `${name.trim().toLowerCase().replace(/\s+/g, '-')}-${timestamp}@kpd.internal`
      const randomBytes = new Uint8Array(32)
      crypto.getRandomValues(randomBytes)
      const techPassword = Array.from(randomBytes, b => b.toString(16).padStart(2, '0')).join('')

      // 3. Зарегистрировать ребёнка в Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: techEmail,
        password: techPassword,
        options: {
          data: { name: name.trim(), role: 'child' },
        },
      })

      if (signUpError) {
        throw new Error(translateSupabaseError(signUpError))
      }

      const user = authData?.user
      if (!user?.id) {
        throw new Error('Не удалось создать аккаунт. Попробуй снова.')
      }

      // 4. Дождаться создания профиля триггером (с повторными попытками)
      let profileReady = false
      for (let attempt = 0; attempt < 10; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 500))
        const { data: checkProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle()
        if (checkProfile?.id) {
          profileReady = true
          break
        }
      }

      if (!profileReady) {
        throw new Error('Профиль не был создан автоматически. Попробуй снова.')
      }

      // 5. Привязать ребёнка к семье
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ family_id: family.id })
        .eq('id', user.id)

      if (updateError) {
        throw new Error(translateSupabaseError(updateError))
      }

      // 6. Перенаправить на главную
      navigate('/app/home')
    } catch (err) {
      console.error('Register child error', err)
      setError(err.message || 'Ошибка регистрации. Попробуй снова.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      <div className="page" style={{ paddingTop: 40 }}>
        <button
          type="button"
          onClick={() => navigate('/register')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 24,
            cursor: 'pointer',
            marginBottom: 16,
            padding: 0,
          }}
        >
          ←
        </button>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>👦</div>
          <h1>Регистрация ребёнка</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
            Введи своё имя и код от взрослого
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: 16 }}>
            <label className="label" style={{ display: 'block', marginBottom: 6 }}>
              Как тебя зовут?
            </label>
            <input
              type="text"
              className="input"
              placeholder="Например: Саша"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

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
              style={{ textTransform: 'uppercase' }}
            />
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
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
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? '⏳ Присоединяюсь...' : 'Присоединиться к семье'}
          </button>
        </form>

        <p
          style={{
            textAlign: 'center',
            marginTop: 24,
            color: 'var(--text-secondary)',
            fontSize: 14,
          }}
        >
          Уже зарегистрирован?{' '}
          <Link to="/login" style={{ color: 'var(--secondary)', fontWeight: 700 }}>
            Войти
          </Link>
        </p>
      </div>
    </div>
  )
}

