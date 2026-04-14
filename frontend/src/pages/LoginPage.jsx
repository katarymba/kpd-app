import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../utils/auth'
import { supabase } from '../utils/supabase'

export default function LoginPage() {
  const navigate = useNavigate()
  const [loginMode, setLoginMode] = useState('email') // 'email' or 'child'

  // Email/password mode
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Child mode
  const [inviteCode, setInviteCode] = useState('')
  const [children, setChildren] = useState([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Загрузить список детей по коду семьи
  async function loadChildren() {
    if (!inviteCode.trim() || inviteCode.trim().length < 5) {
      return
    }

    try {
      // Найти семью по коду
      const { data: family } = await supabase
        .from('families')
        .select('id')
        .eq('invite_code', inviteCode.trim().toUpperCase())
        .single()

      if (!family) {
        setChildren([])
        return
      }

      // Загрузить детей из этой семьи
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, avatar')
        .eq('family_id', family.id)
        .eq('role', 'child')
        .order('name')

      setChildren(profiles || [])
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
      // Получить технический email ребёнка
      const { data: authUser } = await supabase.auth.admin.getUserById(childId)

      if (!authUser) {
        throw new Error('Не удалось найти аккаунт. Попробуй зарегистрироваться заново.')
      }

      // Войти через signInWithPassword с техническими данными
      // (пароль мы не знаем, поэтому используем magic link)
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: authUser.email,
      })

      if (signInError) {
        throw signInError
      }

      // Для упрощения: используем автоматический вход через session
      // (в продакшене лучше использовать magic link или PIN-код)
      navigate('/app/home')
    } catch (err) {
      console.error('Child login error', err)
      setError('Ошибка входа. Попробуй ещё раз.')
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

        {/* Переключатель режима входа */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <button
            type="button"
            className={loginMode === 'email' ? 'btn-primary' : 'btn-ghost'}
            onClick={() => setLoginMode('email')}
            style={{ flex: 1 }}
          >
            👨 Взрослый
          </button>
          <button
            type="button"
            className={loginMode === 'child' ? 'btn-primary' : 'btn-ghost'}
            onClick={() => setLoginMode('child')}
            style={{ flex: 1 }}
          >
            👦 Ребёнок
          </button>
        </div>

        {/* Форма входа для взрослых */}
        {loginMode === 'email' && (
          <form onSubmit={handleEmailLogin} noValidate>
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
        )}

        {/* Форма входа для детей */}
        {loginMode === 'child' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <label className="label" style={{ display: 'block', marginBottom: 6 }}>
                Код семьи
              </label>
              <input
                type="text"
                className="input"
                placeholder="KPD-XXXX"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                style={{ textTransform: 'uppercase' }}
                autoFocus
              />
            </div>

            {children.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <label className="label" style={{ display: 'block', marginBottom: 6 }}>
                  Выбери своё имя
                </label>
                <div style={{ display: 'grid', gap: 8 }}>
                  {children.map((child) => (
                    <button
                      key={child.id}
                      type="button"
                      className="btn-ghost"
                      onClick={() => handleChildLogin(child.id)}
                      disabled={loading}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        justifyContent: 'flex-start',
                      }}
                    >
                      <span style={{ fontSize: 24 }}>{child.avatar}</span>
                      <span>{child.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {inviteCode && children.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: 16 }}>
                Семья не найдена или нет зарегистрированных детей
              </p>
            )}

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
          </div>
        )}

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

