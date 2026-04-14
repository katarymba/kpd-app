import { useState } from 'react'
import PointsHero from '../components/PointsHero'
import RewardCard from '../components/RewardCard'

const DEMO_REWARDS = [
  { id: 1, name: 'Карманные деньги', icon: '💰', price: 100, type: 'money' },
  { id: 2, name: 'Кино с другом',    icon: '🎬', price: 150, type: 'gift' },
  { id: 3, name: '+1 час гаджетов',  icon: '📱', price: 50,  type: 'permission' },
  { id: 4, name: 'Пицца',            icon: '🍕', price: 80,  type: 'gift' },
]

export default function ShopPage() {
  const [points, setPoints] = useState(142)

  return (
    <>
      <PointsHero points={points} rate={1} />

      <div className="section-title">Магазин наград</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {DEMO_REWARDS.map(reward => (
          <RewardCard
            key={reward.id}
            reward={reward}
            balance={points}
            onBuy={(id) => {
              const r = DEMO_REWARDS.find(rw => rw.id === id)
              if (r) {
                setPoints(p => p - r.price)
                alert(`🎉 Куплено: ${r.name}! Взрослый получит уведомление.`)
              }
            }}
          />
        ))}
      </div>
    </>
  )
}
