import { useNavigate, Link } from 'react-router-dom'

export default function RegisterPage() {
  const navigate = useNavigate()

  return (
    <div className="app-container auth-page">
      <div className="auth-surface">
        <div className="auth-header">
          <div className="auth-hero">👨‍👩‍👧‍👦</div>
          <h1>Кто ты?</h1>
          <p className="auth-subtitle">Выбери роль, чтобы зарегистрироваться в КПД.</p>
        </div>

        <div className="role-cards">
          <button type="button" className="role-card" onClick={() => navigate('/register/adult')}>
            <span className="role-emoji">👩</span>
            <span className="role-name">Взрослый</span>
            <span className="role-desc">Создаю семью и управляю заданиями</span>
          </button>

          <button type="button" className="role-card" onClick={() => navigate('/register/child')}>
            <span className="role-emoji">👦</span>
            <span className="role-name">Ребёнок</span>
            <span className="role-desc">Вступаю в семью по коду и выполняю задания</span>
          </button>
        </div>

        <p className="auth-switch-link">
          Уже есть аккаунт?{' '}
          <Link to="/login">
            Войти
          </Link>
        </p>
      </div>
    </div>
  )
}
