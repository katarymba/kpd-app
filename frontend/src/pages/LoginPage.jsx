import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getUsers, setCurrentUser } from '../utils/storage'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Заполните все поля')
      return
    }

    const users = getUsers()
    const user = users.find(u => u.email === email && u.password === password)

    if (!user) {
      setError('Неверный email или пароль')
      return
    }

    setCurrentUser({
      id: user.id,
      name: user.name,
      role: user.role,
      familyId: user.familyId,
    })

    if (!user.familyId) {
      navigate('/app/setup-family')
    } else {
      navigate('/app/home')
    }
  }

  return (
    <div className="auth-page">
      <button className="auth-back" onClick={() => navigate(-1)} aria-label="Назад">
        ←
      </button>

      <h1 className="auth-title">Добро пожаловать! 👋</h1>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="email">Email</label>
          <input
            id="email"
            className="form-input"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="demo@kpd.fun"
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="password">Пароль</label>
          <input
            id="password"
            className="form-input"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••"
            autoComplete="current-password"
          />
        </div>

        {error && <div className="form-error">{error}</div>}

        <div style={{ marginTop: 24 }}>
          <button type="submit" className="btn-primary">Войти</button>
        </div>
      </form>

      <div style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)' }}>
        Нет аккаунта?{' '}
        <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 700 }}>
          Регистрация
        </Link>
      </div>
    </div>
  )
}
