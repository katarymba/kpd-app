/**
 * TaskCard — карточка задания.
 *
 * Props:
 *  task {Object}:
 *    id       {string|number}
 *    name     {string}   — название задания
 *    category {string}   — 'home' | 'study' | 'active' | 'hobby' | 'like' | 'looks'
 *    points   {number}   — баллы за выполнение
 *    status   {string}   — 'pending' | 'done' | 'confirmed'
 *    type     {string}   — 'daily' | 'once' | 'required'
 *  onComplete {Function} — (id) => void  (ребёнок отмечает выполненным)
 *  onConfirm  {Function} — (id) => void  (взрослый подтверждает)
 *  isParent   {boolean}  — режим взрослого
 */

const CATEGORY_META = {
  home:   { emoji: '🏠', className: 'cat-home' },
  study:  { emoji: '📚', className: 'cat-study' },
  active: { emoji: '⚡', className: 'cat-active' },
  hobby:  { emoji: '🎨', className: 'cat-hobby' },
  like:   { emoji: '👍', className: 'cat-like' },
  looks:  { emoji: '👕', className: 'cat-looks' },
};

const TYPE_LABEL = {
  daily:    'ежедневное',
  once:     'разовое',
  required: 'обязательное',
};

export default function TaskCard({ task, onComplete, onConfirm, isParent = false }) {
  const { id, name, title, category, points, status, type } = task;
  const displayName = title || name;
  const meta = CATEGORY_META[category] || { emoji: '📌', className: '' };
  const isDone = status === 'done' || status === 'confirmed';

  return (
    <div className={`task-card ${meta.className}${isDone ? ' completed' : ''}`}>
      <div className="task-icon" aria-hidden="true">{meta.emoji}</div>

      <div className="task-info">
        <div className="task-name">{displayName}</div>
        <div className="task-meta">
          {TYPE_LABEL[type] || type}
          {status === 'done' && !isParent && ' · ожидает подтверждения'}
          {status === 'confirmed' && ' · подтверждено ✓'}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <span className="task-points">+{points} ⭐</span>

        {!isDone && !isParent && (
          <button
            className="btn-primary btn-sm"
            onClick={() => onComplete && onComplete(id)}
            style={{ width: 'auto', fontSize: 13, padding: '8px 14px', minHeight: 36 }}
          >
            Выполнено
          </button>
        )}

        {status === 'done' && isParent && (
          <button
            className="btn-secondary btn-sm"
            onClick={() => onConfirm && onConfirm(id)}
            style={{ width: 'auto', fontSize: 13, padding: '8px 14px', minHeight: 36 }}
          >
            Подтвердить
          </button>
        )}
      </div>
    </div>
  );
}
