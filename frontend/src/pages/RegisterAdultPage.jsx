import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../utils/auth'

export default function RegisterAdultPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmationEmail, setConfirmationEmail] = useState('')

  function validateForm() {
    if (!name.trim()) {
      setError('👤 Введи своё имя')
      return false
    }
    if (name.trim().length < 2) {
      setError('👤 Имя должно быть не менее 2 символов')
      return false
    }
    if (!email.trim() || !email.includes('@')) {
      setError('📧 Введи корректный email адрес')
      return false
    }
    if (!password || password.length < 6) {
      setError('🔒 Пароль должен быть минимум 6 символов')
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
      const result = await register({ name: name.trim(), email: email.trim(), password, role: 'adult' })

      if (result.needsEmailConfirmation) {
        setConfirmationEmail(email.trim())
        return
      }

      navigate('/app/setup-family')
    } catch (err) {
      console.error('Register adult error', err)
      setError(err.message || 'Ошибка регистрации. Попробуй снова.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container auth-page">
      <div className="auth-surface">
        <button type="button" className="auth-back" onClick={() => navigate('/register')}>
          ←
        </button>

        <div className="auth-header auth-header-left">
          <div className="auth-hero">👩</div>
          <h1>Регистрация взрослого</h1>
          <p className="auth-subtitle">Ты будешь управлять семьёй, заданиями и наградами.</p>
        </div>

        {confirmationEmail ? (
          <>
            <div className="auth-status auth-status-success">
              Мы отправили письмо на <strong>{confirmationEmail}</strong>. Подтверди email и затем войди.
            </div>
            <button type="button" className="btn-primary" onClick={() => navigate('/login')}>
              Перейти ко входу
            </button>
          </>
        ) : (
          <>
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label">Имя</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Как тебя зовут?"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="твой@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Пароль</label>
                <div className="auth-password-field">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Минимум 6 символов"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {password && password.length < 6 && (
                  <p className="auth-helper">Ещё {6 - password.length} символов</p>
                )}
              </div>

              {error && <div className="auth-status auth-status-error">{error}</div>}

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? '⏳ Создаём аккаунт...' : 'Зарегистрироваться'}
              </button>
            </form>

            <p className="auth-switch-link">
              Уже есть аккаунт?{' '}
              <Link to="/login">
                Войти
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
