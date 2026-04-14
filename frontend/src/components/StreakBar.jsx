/**
 * StreakBar — 7 кружков (Пн–Вс) с золотой подсветкой за выполненные дни.
 *
 * Props:
 *  completedDays {string[]}  — список выполненных дней, напр. ['Mon','Tue','Wed']
 *  today         {string}    — текущий день, напр. 'Thu'
 */

const DAYS = [
  { key: 'Mon', short: 'Пн' },
  { key: 'Tue', short: 'Вт' },
  { key: 'Wed', short: 'Ср' },
  { key: 'Thu', short: 'Чт' },
  { key: 'Fri', short: 'Пт' },
  { key: 'Sat', short: 'Сб' },
  { key: 'Sun', short: 'Вс' },
];

export default function StreakBar({ completedDays = [], today = 'Mon' }) {
  return (
    <div className="streak-bar" role="list" aria-label="Серия дней">
      {DAYS.map(({ key, short }) => {
        const isCompleted = completedDays.includes(key);
        const isToday = key === today;

        let cls = 'streak-day';
        if (isCompleted) cls += ' completed';
        if (isToday)     cls += ' today';

        return (
          <div key={key} className={cls} role="listitem" aria-label={short}>
            {isCompleted ? '🔥' : short}
          </div>
        );
      })}
    </div>
  );
}
