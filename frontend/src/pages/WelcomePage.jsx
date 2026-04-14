import { useNavigate } from 'react-router-dom'

export default function WelcomePage() {
  const navigate = useNavigate()

  return (
    <div className="welcome-page">
      <div className="welcome-logo">🏆</div>
      <div className="welcome-title">КПД</div>
      <div className="welcome-subtitle">Коэффициент полезного действия</div>
      <div className="welcome-tagline">Заработай баллы — обменяй на награды!</div>

      <div className="welcome-actions">
        <button className="btn-primary" onClick={() => navigate('/login')}>
          🚀 Начать — Войти
        </button>
        <button className="btn-ghost" onClick={() => navigate('/register')}>
          📝 Регистрация
        </button>
      </div>
    </div>
  )
}
