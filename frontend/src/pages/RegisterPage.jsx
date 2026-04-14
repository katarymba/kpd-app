import { useNavigate, Link } from 'react-router-dom'

export default function RegisterPage() {
  const navigate = useNavigate()

  return (
    <div className="app-container">
      <div className="page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>👨‍👩‍👧‍👦</div>
        <h1 style={{ marginBottom: 8 }}>Кто ты?</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 40 }}>
          Выбери свою роль для регистрации
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <button
            className="card"
            style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20, cursor: 'pointer', border: '2px solid var(--border)', background: 'white' }}
            onClick={() => navigate('/register/adult')}
          >
            <div style={{ fontSize: 48 }}>👩</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 800, fontSize: 18 }}>Взрослый</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                Создаю семью, управляю заданиями
              </div>
            </div>
          </button>

          <button
            className="card"
            style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20, cursor: 'pointer', border: '2px solid var(--border)', background: 'white' }}
            onClick={() => navigate('/register/child')}
          >
            <div style={{ fontSize: 48 }}>👦</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 800, fontSize: 18 }}>Ребёнок</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                Вступаю в семью по коду, выполняю задания
              </div>
            </div>
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: 32, color: 'var(--text-secondary)', fontSize: 14 }}>
          Уже есть аккаунт?{' '}
          <Link to="/login" style={{ color: 'var(--secondary)', fontWeight: 700 }}>
            Войти
          </Link>
        </p>
      </div>
    </div>
  )
}
