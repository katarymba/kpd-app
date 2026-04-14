import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../utils/auth'

export default function RegisterAdultPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register({ name, email, password, role: 'adult' })
      navigate('/app/setup-family')
    } catch (err) {
      setError(err.message || 'Ошибка регистрации. Попробуй снова.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      <div className="page" style={{ paddingTop: 40 }}>
        <button
          onClick={() => navigate('/register')}
          style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', marginBottom: 16, padding: 0 }}
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

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label className="label" style={{ display: 'block', marginBottom: 6 }}>Имя</label>
            <input
              type="text"
              className="input"
              placeholder="Как тебя зовут?"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="label" style={{ display: 'block', marginBottom: 6 }}>Email</label>
            <input
              type="email"
              className="input"
              placeholder="твой@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label className="label" style={{ display: 'block', marginBottom: 6 }}>Пароль</label>
            <input
              type="password"
              className="input"
              placeholder="Минимум 6 символов"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div style={{ color: 'var(--danger)', marginBottom: 16, fontSize: 14, textAlign: 'center' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-secondary)', fontSize: 14 }}>
          Уже есть аккаунт?{' '}
          <Link to="/login" style={{ color: 'var(--secondary)', fontWeight: 700 }}>
            Войти
          </Link>
        </p>
      </div>
    </div>
  )
}
