import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../utils/auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function validateForm() {
    if (!email.trim() || !email.includes('@')) {
      setError('📧 Введи корректный email')
      return false
    }
    if (!password) {
      setError('🔒 Введи пароль')
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
      await login({ email: email.trim(), password })
      navigate('/app/home')
    } catch (err) {
      console.error('Login error', err)
      setError(err.message || 'Ошибка входа. Проверь email и пароль.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      <div
        className="page"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>👋</div>
          <h1>Добро пожаловать!</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
            Войди в свой аккаунт
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
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
              autoFocus
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
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
            {loading ? '⏳ Входим...' : 'Войти'}
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
          Нет аккаунта?{' '}
          <Link to="/register" style={{ color: 'var(--secondary)', fontWeight: 700 }}>
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  )
}
