import { useState } from 'react';

/**
 * PointsHero — главный блок баланса ребёнка.
 * Яркий зелёный градиент с крупными цифрами в стиле Duolingo.
 *
 * Props:
 *  points  {number}  — текущий баланс баллов
 *  rate    {number}  — курс (рублей за 1 балл), по умолчанию 1
 *  name    {string}  — имя ребёнка (необязательно)
 */
export default function PointsHero({ points = 0, rate = 1, name }) {
  const [floats, setFloats] = useState([]);

  const roubles = (points * rate).toFixed(0);

  // Демонстрационная анимация «+5 ⭐» при клике
  const handleClick = () => {
    const id = Date.now();
    setFloats((prev) => [...prev, id]);
    setTimeout(() => setFloats((prev) => prev.filter((f) => f !== id)), 1100);
  };

  return (
    <div className="points-hero" style={{ position: 'relative', overflow: 'hidden' }} onClick={handleClick}>
      {name && (
        <div style={{ fontSize: 14, fontWeight: 700, opacity: 0.85, marginBottom: 8 }}>
          {name}
        </div>
      )}

      <div className="points-icon">⭐</div>
      <div className="points-value animate-bounce-in">{points}</div>
      <div className="points-label">БАЛЛОВ</div>
      <div className="points-ruble">≈ {roubles} ₽</div>

      {/* Floating +N animations */}
      {floats.map((id) => (
        <span
          key={id}
          className="points-float"
          style={{ left: '50%', bottom: '60%', transform: 'translateX(-50%)' }}
        >
          +5 ⭐
        </span>
      ))}
    </div>
  );
}
