/**
 * QuickActions — сетка быстрых действий для взрослого.
 * 2 столбца, крупные тач-таргеты с emoji и подписями.
 *
 * Props:
 *  onLike    {Function} — обработчик «Лайк»
 *  onPoints  {Function} — обработчик «Баллы»
 *  onConfirm {Function} — обработчик «Подтвердить»
 *  onDouble  {Function} — обработчик «X2»
 *  x2Used    {number}   — сколько раз X2 использовано на этой неделе (макс. 2)
 */

export default function QuickActions({ onLike, onPoints, onConfirm, onDouble, x2Used = 0 }) {
  const actions = [
    {
      key: 'like',
      emoji: '👍',
      label: 'Лайк',
      handler: onLike,
    },
    {
      key: 'points',
      emoji: '➕',
      label: 'Баллы',
      handler: onPoints,
    },
    {
      key: 'confirm',
      emoji: '✅',
      label: 'Подтвердить',
      handler: onConfirm,
    },
    {
      key: 'double',
      emoji: '⚡',
      label: x2Used >= 2 ? 'X2 (лимит)' : `X2 (${x2Used}/2)`,
      handler: x2Used < 2 ? onDouble : undefined,
      disabled: x2Used >= 2,
    },
  ];

  return (
    <div className="quick-actions">
      {actions.map(({ key, emoji, label, handler, disabled }) => (
        <button
          key={key}
          className="quick-action-card"
          onClick={handler}
          disabled={disabled}
          style={disabled ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
          aria-label={label}
        >
          <span className="action-emoji" aria-hidden="true">{emoji}</span>
          <span className="action-label">{label}</span>
        </button>
      ))}
    </div>
  );
}
