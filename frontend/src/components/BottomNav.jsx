/**
 * BottomNav — нижняя навигация (mobile-first).
 * Фиксирована внизу экрана, поддерживает iOS safe-area.
 *
 * Props:
 *  active   {string}   — ключ активного пункта: 'home' | 'tasks' | 'shop' | 'history' | 'family'
 *  onChange {Function} — (key: string) => void
 */

const NAV_ITEMS = [
  { key: 'home',    icon: '🏠', label: 'Главная' },
  { key: 'tasks',   icon: '✅', label: 'Задания' },
  { key: 'shop',    icon: '🛒', label: 'Магазин' },
  { key: 'history', icon: '📊', label: 'История' },
  { key: 'family',  icon: '👨‍👩‍👧', label: 'Семья' },
];

export default function BottomNav({ active = 'home', onChange }) {
  return (
    <nav className="bottom-nav" aria-label="Основная навигация">
      {NAV_ITEMS.map(({ key, icon, label }) => (
        <button
          key={key}
          className={`bottom-nav-item${active === key ? ' active' : ''}`}
          onClick={() => onChange && onChange(key)}
          aria-current={active === key ? 'page' : undefined}
        >
          <span className="nav-icon" aria-hidden="true">{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
