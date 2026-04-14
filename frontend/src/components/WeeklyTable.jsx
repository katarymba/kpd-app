/**
 * WeeklyTable — таблица недели (Пн–Вс × категории).
 * Компактная, с горизонтальной прокруткой для мобильных.
 * Сегодняшний день выделяется зелёным.
 *
 * Props:
 *  data {Object}  — { Mon: { home: 5, study: 8, ... }, Tue: { ... }, ... }
 *  today {string} — 'Mon' | 'Tue' | ... | 'Sun'
 */

const DAYS = [
  { key: 'Mon', label: 'Пн' },
  { key: 'Tue', label: 'Вт' },
  { key: 'Wed', label: 'Ср' },
  { key: 'Thu', label: 'Чт' },
  { key: 'Fri', label: 'Пт' },
  { key: 'Sat', label: 'Сб' },
  { key: 'Sun', label: 'Вс' },
];

const CATEGORIES = [
  { key: 'home',   label: '🏠', title: 'Дом' },
  { key: 'study',  label: '📚', title: 'Учёба' },
  { key: 'active', label: '⚡', title: 'Актив' },
  { key: 'hobby',  label: '🎨', title: 'Хобби' },
  { key: 'like',   label: '👍', title: 'Лайк' },
  { key: 'looks',  label: '👕', title: 'Внешний вид' },
];

export default function WeeklyTable({ data = {}, today = 'Mon' }) {
  const totalForDay = (dayKey) => {
    const dayData = data[dayKey] || {};
    return Object.values(dayData).reduce((sum, v) => sum + (v || 0), 0);
  };

  return (
    <div className="weekly-table-wrapper">
      <table className="weekly-table">
        <thead>
          <tr>
            <th style={{ textAlign: 'left', paddingLeft: 4 }}></th>
            {CATEGORIES.map((cat) => (
              <th key={cat.key} title={cat.title}>
                {cat.label}
              </th>
            ))}
            <th>Σ</th>
          </tr>
        </thead>
        <tbody>
          {DAYS.map(({ key, label }) => {
            const isToday = key === today;
            const dayData = data[key] || {};
            return (
              <tr key={key} className={isToday ? 'today' : ''}>
                <td className="day-name">{label}</td>
                {CATEGORIES.map((cat) => (
                  <td key={cat.key}>
                    {dayData[cat.key] ? dayData[cat.key] : '—'}
                  </td>
                ))}
                <td style={{ fontWeight: 900 }}>{totalForDay(key) || '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
