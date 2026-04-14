import { useNavigate } from 'react-router-dom'

export default function RegisterPage() {
  const navigate = useNavigate()

  return (
    <div className="auth-page">
      <button className="auth-back" onClick={() => navigate(-1)} aria-label="Назад">
        ←
      </button>

      <h1 className="auth-title">Кто ты?</h1>

      <div className="role-cards">
        <button className="role-card" onClick={() => navigate('/register/adult')}>
          <span className="role-emoji">👨‍👩‍👧</span>
          <div className="role-name">Взрослый</div>
          <div className="role-desc">родитель и т.д.</div>
        </button>

        <button className="role-card" onClick={() => navigate('/register/child')}>
          <span className="role-emoji">👦</span>
          <div className="role-name">Ребёнок</div>
          <div className="role-desc">игрок</div>
        </button>
      </div>
    </div>
  )
}
