import { useNavigate } from 'react-router-dom'
import { APP_VERSION } from '../version'

export default function WelcomePage() {
  const navigate = useNavigate()

  return (
    <div className="welcome-shell">
      <div className="welcome-gradient" />
      <div className="welcome-page">
        <div className="welcome-brand">
          <div className="welcome-logo">КПД</div>
          <h1 className="welcome-title">Семейный ритм без хаоса</h1>
          <p className="welcome-subtitle">
            Задания, баллы и награды — в одном спокойном и современном пространстве.
          </p>
        </div>

        <div className="welcome-actions">
          <button className="btn-primary" onClick={() => navigate('/login')}>
            Войти
          </button>
          <button className="btn-secondary" onClick={() => navigate('/register')}>
            Зарегистрироваться
          </button>
        </div>

        <div className="welcome-footer">v{APP_VERSION}</div>
      </div>
    </div>
  )
}
