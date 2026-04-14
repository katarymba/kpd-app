import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { translateSupabaseError } from '../utils/errorMessages'

export default function RegisterAdultPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
    if (!email.trim()) {
      setError('📧 Введи email')
      return false
    }
    if (!email.includes('@') || !email.includes('.')) {
      setError('📧 Введи корректный email адрес (например: name@mail.com)')
      return false
    }
    if (!password) {
      setError('🔒 Введи пароль')
      return false
    }
    if (password.length < 6) {
      setError('🔒 Пароль должен быть минимум 6 символов')
      return false
    }
    return true
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    // Валидация перед отправкой
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const trimmedName = name.trim()
      const trimmedEmail = email.trim().toLowerCase()

      // 1. Зарегистрировать пользователя
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            name: trimmedName,
            role: 'adult',
          },
        },
      })

      if (signUpError) {
        console.error('SignUp error:', signUpError)
        throw new Error(translateSupabaseError(signUpError))
      }

      const user = authData?.user
      if (!user?.id) {
        throw new Error('Не удалось создать пользователя. Попробуй другой email.')
      }

      // 2. Подождать создания профиля (триггер)
      await new Promise(resolve => setTimeout(resolve, 1500))

      // 3. Проверить что профиль создался
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, role')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        console.error('Profile check error:', profileError)
      }

      if (!profile) {
        // Попробовать создать профиль вручную
        console.log('Profile not found, creating manually...')
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            name: trimmedName,
            role: 'adult',
            family_id: null,
            avatar: '👤',
          })

        if (createProfileError) {
          console.error('Manual profile creation error:', createProfileError)
          throw new Error('Не удалось создать профиль. Попробуй войти через несколько минут.')
        }
      }

      // 4. Проверить сессию
      const { error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        console.error('Session error:', sessionError)
      }

      // 5. Перенаправить на создание семьи
      navigate('/app/setup-family')
    } catch (err) {
      console.error('Register adult error:', err)
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
          <div style={{ fontSize: 56, marginBottom: 8 }}>👩</div>
          <h1>Регистрация взрослого</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
            Ты будешь управлять семьёй и заданиями
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: 16 }}>
            <label className="label" style={{ display: 'block', marginBottom: 6 }}>
              Имя
            </label>
            <input
              type="text"
              className="input"
              placeholder="Как тебя зовут?"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              autoFocus
              disabled={loading}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="label" style={{ display: 'block', marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              className="input"
              placeholder="твой@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label className="label" style={{ display: 'block', marginBottom: 6 }}>
              Пароль
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="input"
                placeholder="Минимум 6 символов"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                style={{ paddingRight: 40 }}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 20,
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {password && password.length < 6 && (
              <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>
                Ещё {6 - password.length} символов
              </p>
            )}
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

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? '⏳ Создаём аккаунт...' : 'Зарегистрироваться'}
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
          Уже есть аккаунт?{' '}
          <Link to="/login" style={{ color: 'var(--secondary)', fontWeight: 700 }}>
            Войти
          </Link>
        </p>
      </div>
    </div>
  )
}