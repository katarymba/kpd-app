import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getUsers, addUser, setCurrentUser, generateId } from '../utils/storage'

export default function RegisterChildPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!name.trim() || !email.trim() || !password) {
      setError('Заполните все поля')
      return
    }

    const users = getUsers()
    if (users.find(u => u.email === email)) {
      setError('Такой логин уже занят')
      return
    }

    const user = {
      id: generateId('user'),
      name: name.trim(),
      email: email.trim(),
      password,
      role: 'child',
      familyId: null,
      createdAt: new Date().toISOString().slice(0, 10),
    }

    addUser(user)
    setCurrentUser({ id: user.id, name: user.name, role: user.role, familyId: null })
    navigate('/app/setup-family')
  }

  return (
    <div className="auth-page">
      <button className="auth-back" onClick={() => navigate(-1)} aria-label="Назад">
        ←
      </button>

      <h1 className="auth-title">Регистрация игрока 👦</h1>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="name">Как тебя зовут?</label>
          <input
            id="name"
            className="form-input"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Саша / Дима / Аня..."
            autoComplete="name"
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="email">Email (или придумай логин)</label>
          <input
            id="email"
            className="form-input"
            type="text"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="sasha@kpd.fun"
            autoComplete="username"
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
            autoComplete="new-password"
          />
        </div>

        {error && <div className="form-error">{error}</div>}

        <div style={{ marginTop: 24 }}>
          <button type="submit" className="btn-primary">Создать аккаунт</button>
        </div>
      </form>

      <div style={{ marginTop: 16, textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)' }}>
        Уже есть аккаунт?{' '}
        <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>
          Войти
        </Link>
      </div>
    </div>
  )
}
