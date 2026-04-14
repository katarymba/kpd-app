import { useNavigate } from 'react-router-dom'

export default function WelcomePage() {
  const navigate = useNavigate()

  return (
    <div className="app-container">
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center' }}>
        <div style={{ fontSize: 80, marginBottom: 16 }}>⭐</div>
        <h1 style={{ marginBottom: 8 }}>КПД</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 40, fontSize: 16 }}>
          Семейная система мотивации и заданий
        </p>

        <button
          className="btn-primary"
          style={{ marginBottom: 12 }}
          onClick={() => navigate('/login')}
        >
          Войти
        </button>

        <button
          className="btn-secondary"
          onClick={() => navigate('/register')}
        >
          Зарегистрироваться
        </button>
      </div>
    </div>
  )
}
