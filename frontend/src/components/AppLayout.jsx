import { Outlet, useLocation, useNavigate } from 'react-router-dom'

const NAV_ITEMS = [
  { key: 'home',    path: '/app/home',    icon: '🏠', label: 'Главная' },
  { key: 'tasks',   path: '/app/tasks',   icon: '✅', label: 'Задания' },
  { key: 'shop',    path: '/app/shop',    icon: '🛒', label: 'Магазин' },
  { key: 'history', path: '/app/history', icon: '📊', label: 'История' },
  { key: 'family',  path: '/app/family',  icon: '👨‍👩‍👧', label: 'Семья' },
]

export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const hideNav = location.pathname === '/app/setup-family'

  const activeKey = NAV_ITEMS.find(i => location.pathname.startsWith(i.path))?.key ?? 'home'

  return (
    <div className="app-container">
      <div className="page">
        <Outlet />
      </div>

      {!hideNav && (
        <nav className="bottom-nav" aria-label="Основная навигация">
          {NAV_ITEMS.map(({ key, path, icon, label }) => (
            <button
              key={key}
              className={`bottom-nav-item${activeKey === key ? ' active' : ''}`}
              onClick={() => navigate(path)}
              aria-current={activeKey === key ? 'page' : undefined}
            >
              <span className="nav-icon" aria-hidden="true">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}
