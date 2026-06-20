import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../utils/auth'
import { supabase } from '../utils/supabase'

export default function LoginPage() {
  const navigate = useNavigate()
  const [loginMode, setLoginMode] = useState('email')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [inviteCode, setInviteCode] = useState('')
  const [children, setChildren] = useState([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadChildren() {
    const normalizedInviteCode = inviteCode.trim().toUpperCase()

    if (!normalizedInviteCode || normalizedInviteCode.length < 5) {
      setChildren([])
      return
    }

    try {
      const { data, error: childrenError } = await supabase.rpc('get_children_by_invite_code', {
        p_invite_code: normalizedInviteCode,
      })

      if (childrenError) {
        throw childrenError
      }

      setChildren(data || [])
    } catch (err) {
      console.error('Load children error', err)
      setChildren([])
    }
  }

  useEffect(() => {
    if (loginMode === 'child') {
      loadChildren()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteCode, loginMode])

  function validateEmailForm() {
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

  async function handleEmailLogin(e) {
    e.preventDefault()
    setError('')

    if (!validateEmailForm()) {
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

  async function handleChildLogin(childId) {
    setLoading(true)
    setError('')

    try {
      const { data, error: credentialsError } = await supabase.rpc('get_child_login_credentials', {
        p_invite_code: inviteCode.trim().toUpperCase(),
        p_child_id: childId,
      })

      if (credentialsError) {
        throw credentialsError
      }

      const credentials = data?.[0]
      if (!credentials?.tech_email || !credentials?.tech_password) {
        throw new Error('Для этого аккаунта не настроен вход. Попроси взрослого зарегистрировать ребёнка заново.')
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: credentials.tech_email,
        password: credentials.tech_password,
      })

      if (signInError) {
        throw signInError
      }

      navigate('/app/home')
    } catch (err) {
      console.error('Child login error', err)
      setError(err.message || 'Ошибка входа. Попробуй ещё раз.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container auth-page">
      <div className="auth-surface">
        <div className="auth-header">
          <div className="auth-hero">👋</div>
          <h1>Добро пожаловать!</h1>
          <p className="auth-subtitle">Войди в свой аккаунт и продолжай семейный прогресс.</p>
        </div>

        <div className="auth-segment" role="tablist" aria-label="Режим входа">
          <button
            type="button"
            className={loginMode === 'email' ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'}
            onClick={() => setLoginMode('email')}
          >
            👨 Взрослый
          </button>
          <button
            type="button"
            className={loginMode === 'child' ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'}
            onClick={() => setLoginMode('child')}
          >
            👦 Ребёнок
          </button>
        </div>

        {loginMode === 'email' && (
          <form onSubmit={handleEmailLogin} noValidate>
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
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Пароль</label>
              <div className="auth-password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
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
            </div>

            {error && <div className="auth-status auth-status-error">{error}</div>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? '⏳ Входим...' : 'Войти'}
            </button>
          </form>
        )}

        {loginMode === 'child' && (
          <div>
            <div className="form-group">
              <label className="form-label">Код семьи</label>
              <input
                type="text"
                className="form-input"
                placeholder="KPD-XXXX"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                style={{ textTransform: 'uppercase' }}
                autoFocus
              />
              <p className="auth-helper">Введи код семьи, затем выбери своё имя из списка.</p>
            </div>

            {children.length > 0 && (
              <div className="form-group">
                <label className="form-label">Выбери своё имя</label>
                <div className="auth-child-list">
                  {children.map((child) => (
                    <button
                      key={child.id}
                      type="button"
                      className="btn-ghost auth-child-option"
                      onClick={() => handleChildLogin(child.id)}
                      disabled={loading}
                    >
                      <span className="auth-child-avatar">{child.avatar}</span>
                      <span>{child.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {inviteCode.trim().length >= 5 && children.length === 0 && (
              <p className="auth-helper auth-helper-center">
                Семья не найдена или для неё ещё не зарегистрированы дети.
              </p>
            )}

            {error && <div className="auth-status auth-status-error">{error}</div>}
          </div>
        )}

        <p className="auth-switch-link">
          Нет аккаунта?{' '}
          <Link to="/register">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  )
}
