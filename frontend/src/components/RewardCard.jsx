/**
 * RewardCard — карточка награды в магазине.
 *
 * Props:
 *  reward {Object}:
 *    id      {string|number}
 *    name    {string}  — название награды
 *    icon    {string}  — emoji иконка
 *    price   {number}  — стоимость в баллах
 *    type    {string}  — 'money' | 'gift' | 'permission'
 *  balance   {number}  — текущий баланс ребёнка
 *  onBuy     {Function} — (id) => void
 */

export default function RewardCard({ reward, balance = 0, onBuy }) {
  const { id, name, icon, price } = reward;
  const canAfford = balance >= price;

  return (
    <div className="reward-card">
      <div className="reward-icon" aria-hidden="true">{icon || '🎁'}</div>
      <div className="reward-name">{name}</div>
      <div className="reward-price">⭐ {price}</div>

      <button
        className={canAfford ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'}
        onClick={() => canAfford && onBuy && onBuy(id)}
        disabled={!canAfford}
        style={{
          width: '100%',
          cursor: canAfford ? 'pointer' : 'not-allowed',
          opacity: canAfford ? 1 : 0.5,
          fontSize: 13,
          padding: '10px 14px',
          minHeight: 40,
        }}
        aria-label={canAfford ? `Купить ${name}` : `Недостаточно баллов для ${name}`}
      >
        {canAfford ? 'Купить' : 'Мало баллов'}
      </button>
    </div>
  );
}
