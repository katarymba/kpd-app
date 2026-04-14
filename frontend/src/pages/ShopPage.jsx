import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getRewards, createReward, buyReward } from '../utils/rewards'
import { getBalance } from '../utils/points'
import RewardCard from '../components/RewardCard'
import PointsHero from '../components/PointsHero'

export default function ShopPage() {
  const { profile } = useAuth()
  const [rewards, setRewards] = useState([])
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newReward, setNewReward] = useState({ title: '', icon: '🎁', cost: 50, type: 'gift' })
  const [saving, setSaving] = useState(false)

  const isAdult = profile?.role === 'adult'

  useEffect(() => {
    if (profile?.family_id) loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [rewardsData, bal] = await Promise.all([
        getRewards(profile.family_id),
        getBalance(profile.id)
      ])
      setRewards(rewardsData)
      setBalance(bal)
    } catch {
      setError('Не удалось загрузить магазин.')
    } finally {
      setLoading(false)
    }
  }

  async function handleBuy(rewardId) {
    const reward = rewards.find(r => r.id === rewardId)
    if (!reward) return
    if (balance < reward.cost) {
      setError('Недостаточно баллов!')
      return
    }
    setError('')
    try {
      await buyReward(rewardId, profile.id, profile.family_id, reward.cost)
      setBalance(prev => prev - reward.cost)
      alert(`🎉 Куплено: ${reward.title}! Взрослый получит уведомление.`)
    } catch {
      setError('Ошибка покупки.')
    }
  }

  async function handleAddReward(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const reward = await createReward({
        ...newReward,
        family_id: profile.family_id,
        is_available: true
      })
      setRewards(prev => [...prev, reward])
      setShowAddForm(false)
      setNewReward({ title: '', icon: '🎁', cost: 50, type: 'gift' })
    } catch {
      setError('Не удалось добавить награду.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PointsHero points={balance} rate={1} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className="section-title" style={{ margin: 0 }}>Магазин наград</div>
        {isAdult && (
          <button
            className="btn-primary btn-sm"
            style={{ width: 'auto' }}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? '✕ Отмена' : '+ Добавить'}
          </button>
        )}
      </div>

      {error && (
        <div style={{ color: 'var(--danger)', marginBottom: 12, fontSize: 14 }}>{error}</div>
      )}

      {isAdult && showAddForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <form onSubmit={handleAddReward}>
            <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label className="label" style={{ display: 'block', marginBottom: 4 }}>Иконка</label>
                <input
                  type="text"
                  className="input"
                  value={newReward.icon}
                  onChange={e => setNewReward(p => ({ ...p, icon: e.target.value }))}
                  style={{ textAlign: 'center', fontSize: 24 }}
                />
              </div>
              <div>
                <label className="label" style={{ display: 'block', marginBottom: 4 }}>Название</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Поход в кино"
                  value={newReward.title}
                  onChange={e => setNewReward(p => ({ ...p, title: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label className="label" style={{ display: 'block', marginBottom: 4 }}>Стоимость (⭐)</label>
                <input
                  type="number"
                  className="input"
                  min={1}
                  value={newReward.cost}
                  onChange={e => setNewReward(p => ({ ...p, cost: Number(e.target.value) }))}
                  required
                />
              </div>
              <div>
                <label className="label" style={{ display: 'block', marginBottom: 4 }}>Тип</label>
                <select
                  className="input"
                  value={newReward.type}
                  onChange={e => setNewReward(p => ({ ...p, type: e.target.value }))}
                >
                  <option value="money">💰 Деньги</option>
                  <option value="gift">🎁 Подарок</option>
                  <option value="permission">✅ Разрешение</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Сохраняем...' : 'Добавить награду'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 32, fontSize: 32 }}>⭐</div>
      ) : rewards.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 32 }}>
          {isAdult
            ? 'Магазин пуст. Добавь первую награду! 🎁'
            : 'Магазин пуст — попроси взрослого добавить награды! 🎁'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {rewards.map(reward => (
            <RewardCard
              key={reward.id}
              reward={{ ...reward, name: reward.title || reward.name, price: reward.cost || reward.price }}
              balance={balance}
              onBuy={!isAdult ? handleBuy : undefined}
            />
          ))}
        </div>
      )}
    </>
  )
}


