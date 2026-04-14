import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getRewards, createReward, deleteReward, buyReward, getPendingPurchases, approvePurchase } from '../utils/rewards'
import { getBalance } from '../utils/points'
import RewardCard from '../components/RewardCard'

const isAdultRole = (role) => role === 'admin' || role === 'adult'

export default function ShopPage() {
  const { profile } = useAuth()
  const [rewards, setRewards] = useState([])
  const [purchases, setPurchases] = useState([])
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newReward, setNewReward] = useState({ title: '', icon: '🎁', cost: 50, type: 'gift', description: '' })
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('shop') // 'shop' | 'purchases'

  const isAdult = profile && isAdultRole(profile.role)

  function showSuccess(msg) {
    setSuccess(msg)
    setTimeout(() => setSuccess(''), 3000)
  }

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

      if (isAdult) {
        const pendingData = await getPendingPurchases(profile.family_id)
        setPurchases(pendingData)
      }
    } catch {
      setError('Не удалось загрузить магазин.')
    } finally {
      setLoading(false)
    }
  }

  async function handleBuy(rewardId) {
    setError('')
    try {
      await buyReward(rewardId, profile.id, profile.family_id)
      const reward = rewards.find(r => r.id === rewardId)
      setBalance(prev => prev - (reward?.cost || 0))
      showSuccess(`🎉 Куплено: ${reward?.title}! Взрослый получит уведомление.`)
    } catch (err) {
      setError(err.message || 'Ошибка покупки.')
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
        is_available: true,
        created_by: profile.id
      })
      setRewards(prev => [...prev, reward])
      setShowAddForm(false)
      setNewReward({ title: '', icon: '🎁', cost: 50, type: 'gift', description: '' })
      showSuccess('Награда добавлена! 🎁')
    } catch {
      setError('Не удалось добавить награду.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteReward(rewardId) {
    if (!confirm('Скрыть награду?')) return
    try {
      await deleteReward(rewardId)
      setRewards(prev => prev.filter(r => r.id !== rewardId))
    } catch (err) {
      setError(err.message || 'Ошибка удаления.')
    }
  }

  async function handleApprovePurchase(purchaseId) {
    try {
      await approvePurchase(purchaseId, profile.id)
      setPurchases(prev => prev.filter(p => p.id !== purchaseId))
      showSuccess('Награда выдана! ✅')
    } catch (err) {
      setError(err.message || 'Ошибка.')
    }
  }

  return (
    <>
      {/* Balance */}
      <div className="card" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Мой баланс</div>
          <div style={{ fontWeight: 900, fontSize: 24 }}>⭐ {balance}</div>
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>≈ {balance} ₽</div>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className="section-title" style={{ margin: 0 }}>Магазин наград</div>
        {isAdult && (
          <button className="btn-primary btn-sm" style={{ width: 'auto' }}
            onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? '✕ Отмена' : '+ Добавить'}
          </button>
        )}
      </div>

      {error && <div style={{ color: 'var(--danger)', marginBottom: 12, fontSize: 14 }}>{error}</div>}
      {success && <div style={{ color: '#22c55e', marginBottom: 12, fontSize: 14, fontWeight: 600 }}>{success}</div>}

      {/* Tabs for adults */}
      {isAdult && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'var(--bg-secondary)', borderRadius: 12, padding: 4 }}>
          {[
            { key: 'shop', label: 'Награды' },
            { key: 'purchases', label: `Покупки ${purchases.length > 0 ? `(${purchases.length})` : ''}` }
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              flex: 1, padding: '8px 12px', borderRadius: 10, border: 'none',
              background: activeTab === tab.key ? 'white' : 'transparent',
              fontWeight: activeTab === tab.key ? 700 : 400,
              cursor: 'pointer', fontSize: 13,
              boxShadow: activeTab === tab.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              color: 'var(--text-primary)'
            }}>
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Add Reward Form */}
      {isAdult && showAddForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <form onSubmit={handleAddReward}>
            <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label className="label" style={{ display: 'block', marginBottom: 4 }}>Иконка</label>
                <input type="text" className="input" value={newReward.icon}
                  onChange={e => setNewReward(p => ({ ...p, icon: e.target.value }))}
                  style={{ textAlign: 'center', fontSize: 24 }} />
              </div>
              <div>
                <label className="label" style={{ display: 'block', marginBottom: 4 }}>Название</label>
                <input type="text" className="input" placeholder="Поход в кино"
                  value={newReward.title} onChange={e => setNewReward(p => ({ ...p, title: e.target.value }))}
                  required />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label className="label" style={{ display: 'block', marginBottom: 4 }}>Описание (необязательно)</label>
              <input type="text" className="input" placeholder="Любой фильм на выбор"
                value={newReward.description} onChange={e => setNewReward(p => ({ ...p, description: e.target.value }))} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label className="label" style={{ display: 'block', marginBottom: 4 }}>Стоимость (⭐)</label>
                <input type="number" className="input" min={1} value={newReward.cost}
                  onChange={e => setNewReward(p => ({ ...p, cost: Number(e.target.value) }))} required />
              </div>
              <div>
                <label className="label" style={{ display: 'block', marginBottom: 4 }}>Тип</label>
                <select className="input" value={newReward.type}
                  onChange={e => setNewReward(p => ({ ...p, type: e.target.value }))}>
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
      ) : isAdult && activeTab === 'purchases' ? (
        // Purchases tab
        purchases.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 32 }}>
            Нет ожидающих покупок 🎉
          </div>
        ) : (
          purchases.map(purchase => (
            <div key={purchase.id} className="task-card" style={{ marginBottom: 8 }}>
              <div className="task-icon">🛒</div>
              <div className="task-info">
                <div className="task-name">{purchase.reward_title}</div>
                <div className="task-meta">
                  {purchase.profiles?.name} · {purchase.cost_paid} ⭐
                </div>
              </div>
              <button
                className="btn-primary btn-sm"
                style={{ width: 'auto', padding: '8px 12px', fontSize: 12 }}
                onClick={() => handleApprovePurchase(purchase.id)}
              >
                Выдано ✅
              </button>
            </div>
          ))
        )
      ) : rewards.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 32 }}>
          {isAdult
            ? 'Магазин пуст. Добавь первую награду! 🎁'
            : 'Магазин пуст — попроси взрослого добавить награды! 🎁'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {rewards.map(reward => (
            <div key={reward.id} style={{ position: 'relative' }}>
              <RewardCard
                reward={{ ...reward, name: reward.title, price: reward.cost }}
                balance={balance}
                onBuy={!isAdult ? handleBuy : undefined}
              />
              {isAdult && (
                <button
                  onClick={() => handleDeleteReward(reward.id)}
                  style={{
                    position: 'absolute', top: 6, right: 6,
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-secondary)', fontSize: 14, padding: 2
                  }}
                  title="Скрыть"
                >
                  🗑
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}

