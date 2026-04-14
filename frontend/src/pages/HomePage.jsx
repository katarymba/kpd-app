import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getTasksWithStatus, completeTask, getPendingCompletions, confirmCompletion, rejectCompletion } from '../utils/tasks'
import { getBalance, addPoints, addPenalty } from '../utils/points'
import { getLikesReceived, sendLike } from '../utils/likes'
import { addGrade } from '../utils/grades'
import { activateX2, getWeeklyX2Count } from '../utils/x2'
import { getFamilyMembers } from '../utils/auth'
import TaskCard from '../components/TaskCard'

const isAdultRole = (role) => role === 'admin' || role === 'adult'

// Простой toast
function Toast({ msg, type }) {
  if (!msg) return null
  return (
    <div style={{
      position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
      background: type === 'error' ? 'var(--danger)' : '#22c55e',
      color: 'white', padding: '10px 20px', borderRadius: 12, fontSize: 14,
      zIndex: 1000, maxWidth: '90vw', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
    }}>
      {msg}
    </div>
  )
}

// Модальное окно
function Modal({ title, children, onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'flex-end', zIndex: 999
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: '20px 20px 0 0', padding: 24,
        width: '100%', maxHeight: '80vh', overflowY: 'auto'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function HomePage() {
  const { profile } = useAuth()
  const [tasks, setTasks] = useState([])
  const [pendingCompletions, setPendingCompletions] = useState([])
  const [balance, setBalance] = useState(0)
  const [children, setChildren] = useState([])
  const [recentLikes, setRecentLikes] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState({ msg: '', type: '' })
  const [modal, setModal] = useState(null) // 'like' | 'points' | 'penalty' | 'x2' | 'grade'
  const [x2WeekCount, setX2WeekCount] = useState(0)

  // Modal form state
  const [selectedChild, setSelectedChild] = useState('')
  const [likeType, setLikeType] = useState('normal')
  const [bonusAmount, setBonusAmount] = useState(5)
  const [bonusReason, setBonusReason] = useState('')
  const [penaltyAmount, setPenaltyAmount] = useState(5)
  const [penaltyReason, setPenaltyReason] = useState('')
  const [x2Category, setX2Category] = useState('all')
  const [gradeSubject, setGradeSubject] = useState('')
  const [gradeValue, setGradeValue] = useState(5)
  const [actionLoading, setActionLoading] = useState(false)

  const isAdult = profile && isAdultRole(profile.role)

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: '' }), 3000)
  }

  useEffect(() => {
    if (profile?.family_id) loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  async function loadData() {
    setLoading(true)
    try {
      const membersData = await getFamilyMembers(profile.family_id)
      const kids = membersData.filter(m => m.role === 'child')
      setChildren(kids)
      if (kids.length > 0) setSelectedChild(kids[0].id)

      if (isAdult) {
        const pending = await getPendingCompletions(profile.family_id)
        setPendingCompletions(pending)
        const x2Count = await getWeeklyX2Count(profile.family_id, null)
        setX2WeekCount(x2Count)
      } else {
        const [tasksData, bal, likes] = await Promise.all([
          getTasksWithStatus(profile.family_id, profile.id),
          getBalance(profile.id),
          getLikesReceived(profile.id, profile.family_id)
        ])
        setTasks(tasksData)
        setBalance(bal)
        setRecentLikes(likes.slice(0, 3))
      }
    } catch {
      showToast('Ошибка загрузки данных', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleCompleteTask(taskId) {
    try {
      await completeTask(taskId, profile.id, profile.family_id)
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'pending' } : t))
      showToast('Задание отправлено на проверку! ✅')
    } catch (err) {
      showToast(err.message || 'Ошибка', 'error')
    }
  }

  async function handleConfirmCompletion(completionId) {
    try {
      await confirmCompletion(completionId, profile.id, profile.family_id)
      setPendingCompletions(prev => prev.filter(c => c.id !== completionId))
      showToast('Задание подтверждено! Баллы начислены ⭐')
    } catch (err) {
      showToast(err.message || 'Ошибка', 'error')
    }
  }

  const [rejectCompletionId, setRejectCompletionId] = useState(null)
  const [rejectCompletionReason, setRejectCompletionReason] = useState('')

  async function handleRejectCompletion(completionId, reason) {
    try {
      await rejectCompletion(completionId, profile.id, reason || 'Не указана')
      setPendingCompletions(prev => prev.filter(c => c.id !== completionId))
      setRejectCompletionId(null)
      setRejectCompletionReason('')
      showToast('Задание отклонено')
    } catch (err) {
      showToast(err.message || 'Ошибка', 'error')
    }
  }

  async function handleLike(e) {
    e.preventDefault()
    if (!selectedChild) return
    setActionLoading(true)
    try {
      await sendLike({
        fromUserId: profile.id,
        toUserId: selectedChild,
        familyId: profile.family_id,
        isSuper: likeType === 'super'
      })
      setModal(null)
      showToast(likeType === 'super' ? 'Супер-лайк отправлен! 💫' : 'Лайк отправлен! 👍')
    } catch (err) {
      showToast(err.message || 'Ошибка', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleBonus(e) {
    e.preventDefault()
    if (!selectedChild || !bonusReason.trim()) return
    setActionLoading(true)
    try {
      await addPoints({
        familyId: profile.family_id,
        userId: selectedChild,
        amount: bonusAmount,
        source: 'bonus',
        description: bonusReason,
        createdBy: profile.id
      })
      setModal(null)
      setBonusReason('')
      showToast(`+${bonusAmount} баллов начислено! ⭐`)
    } catch (err) {
      showToast(err.message || 'Ошибка', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  async function handlePenalty(e) {
    e.preventDefault()
    if (!selectedChild || !penaltyReason.trim()) return
    setActionLoading(true)
    try {
      await addPenalty({
        familyId: profile.family_id,
        userId: selectedChild,
        amount: penaltyAmount,
        description: penaltyReason,
        createdBy: profile.id
      })
      setModal(null)
      setPenaltyReason('')
      showToast(`Штраф -${penaltyAmount} баллов применён`)
    } catch (err) {
      showToast(err.message || 'Ошибка', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleX2(e) {
    e.preventDefault()
    if (!selectedChild) return
    setActionLoading(true)
    try {
      await activateX2({
        familyId: profile.family_id,
        childId: selectedChild,
        activatedBy: profile.id,
        category: x2Category === 'all' ? null : x2Category
      })
      setX2WeekCount(prev => prev + 1)
      setModal(null)
      showToast('X2 активирован на сегодня! ⚡')
    } catch (err) {
      showToast(err.message || 'Ошибка', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleGrade(e) {
    e.preventDefault()
    if (!selectedChild || !gradeSubject.trim()) return
    setActionLoading(true)
    try {
      await addGrade({
        childId: selectedChild,
        familyId: profile.family_id,
        subject: gradeSubject,
        grade: gradeValue,
        enteredBy: profile.id
      })
      setModal(null)
      setGradeSubject('')
      showToast(`Оценка ${gradeValue} по ${gradeSubject} записана 📚`)
    } catch (err) {
      showToast(err.message || 'Ошибка', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const childOptions = children.map(c => (
    <option key={c.id} value={c.id}>{c.avatar || '👤'} {c.name}</option>
  ))

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 64 }}>
        <div style={{ fontSize: 48 }}>⭐</div>
      </div>
    )
  }

  return (
    <>
      <Toast msg={toast.msg} type={toast.type} />

      {/* CHILD VIEW */}
      {!isAdult && (
        <>
          <div className="card" style={{ marginBottom: 20, textAlign: 'center', background: 'var(--primary)', color: 'white' }}>
            <div style={{ fontSize: 40, marginBottom: 4 }}>{profile?.avatar || '👤'}</div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{profile?.name}</div>
            <div style={{ fontSize: 32, fontWeight: 900, margin: '8px 0' }}>⭐ {balance}</div>
            <div style={{ opacity: 0.85, fontSize: 14 }}>≈ {balance} ₽</div>
          </div>

          <div className="section-title">Задания сегодня</div>
          {tasks.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 32 }}>
              Нет заданий — попроси взрослого добавить! 😊
            </div>
          ) : (
            tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={() => handleCompleteTask(task.id)}
                isParent={false}
              />
            ))
          )}

          {recentLikes.length > 0 && (
            <>
              <div className="section-title">Последние лайки</div>
              {recentLikes.map(like => (
                <div key={like.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <div style={{ fontSize: 28 }}>{like.is_super ? '💫' : '👍'}</div>
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {like.profiles?.name || 'Взрослый'} поставил {like.is_super ? 'супер-лайк' : 'лайк'}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>+{like.points} ⭐</div>
                  </div>
                </div>
              ))}
            </>
          )}
        </>
      )}

      {/* ADULT VIEW */}
      {isAdult && (
        <>
          <div style={{ marginBottom: 20 }}>
            <h2>Привет, {profile?.name}! 👋</h2>
          </div>

          {/* Быстрые действия */}
          <div className="section-title">Быстрые действия</div>
          <div className="quick-actions" style={{ marginBottom: 20 }}>
            {[
              { key: 'like', emoji: '👍', label: 'Лайк' },
              { key: 'points', emoji: '➕', label: 'Баллы' },
              { key: 'penalty', emoji: '➖', label: 'Штраф' },
              { key: 'x2', emoji: '⚡', label: `X2 (${x2WeekCount}/2)`, disabled: x2WeekCount >= 2 },
              { key: 'grade', emoji: '📚', label: 'Оценка' }
            ].map(({ key, emoji, label, disabled }) => (
              <button
                key={key}
                className="quick-action-card"
                onClick={() => !disabled && setModal(key)}
                disabled={disabled || children.length === 0}
                style={(disabled || children.length === 0) ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
              >
                <span className="action-emoji">{emoji}</span>
                <span className="action-label">{label}</span>
              </button>
            ))}
          </div>

          {children.length === 0 && (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 24, marginBottom: 20 }}>
              В семье пока нет детей. Поделись кодом семьи! 👨‍👩‍👧
            </div>
          )}

          {/* Задания на подтверждение */}
          <div className="section-title">
            На подтверждение {pendingCompletions.length > 0 && (
              <span style={{ background: 'var(--primary)', color: 'white', borderRadius: 10, padding: '2px 8px', fontSize: 12, marginLeft: 8 }}>
                {pendingCompletions.length}
              </span>
            )}
          </div>
          {pendingCompletions.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 24 }}>
              Нет заданий на проверку 🎉
            </div>
          ) : (
            pendingCompletions.map(completion => (
              <div key={completion.id} className="task-card" style={{ marginBottom: 8 }}>
                <div className="task-icon">✅</div>
                <div className="task-info">
                  <div className="task-name">{completion.tasks?.title}</div>
                  <div className="task-meta">
                    {completion.profiles?.name} · +{completion.tasks?.points} ⭐
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button
                    className="btn-primary btn-sm"
                    style={{ width: 'auto', fontSize: 12, padding: '6px 10px' }}
                    onClick={() => handleConfirmCompletion(completion.id)}
                  >
                    ✅
                  </button>
                  <button
                    className="btn-ghost btn-sm"
                    style={{ width: 'auto', fontSize: 12, padding: '6px 10px', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                    onClick={() => { setRejectCompletionId(completion.id); setRejectCompletionReason('') }}
                  >
                    ❌
                  </button>
                </div>
              </div>
            ))
          )}
        </>
      )}

      {/* MODALS */}

      {modal === 'like' && (
        <Modal title="👍 Поставить лайк" onClose={() => setModal(null)}>
          <form onSubmit={handleLike}>
            <div style={{ marginBottom: 16 }}>
              <label className="label" style={{ display: 'block', marginBottom: 6 }}>Кому</label>
              <select className="input" value={selectedChild} onChange={e => setSelectedChild(e.target.value)} required>
                {childOptions}
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="label" style={{ display: 'block', marginBottom: 6 }}>Тип</label>
              <div style={{ display: 'flex', gap: 12 }}>
                {[
                  { val: 'normal', label: '👍 Обычный +2' },
                  { val: 'super', label: '💫 Супер +10' }
                ].map(({ val, label }) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setLikeType(val)}
                    style={{
                      flex: 1, padding: '12px 8px', borderRadius: 12,
                      border: `2px solid ${likeType === val ? 'var(--primary)' : 'var(--border)'}`,
                      background: likeType === val ? 'var(--primary)' : 'white',
                      color: likeType === val ? 'white' : 'var(--text-primary)',
                      fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={actionLoading}>
              {actionLoading ? 'Отправляем...' : 'Отправить'}
            </button>
          </form>
        </Modal>
      )}

      {modal === 'points' && (
        <Modal title="➕ Начислить баллы" onClose={() => setModal(null)}>
          <form onSubmit={handleBonus}>
            <div style={{ marginBottom: 16 }}>
              <label className="label" style={{ display: 'block', marginBottom: 6 }}>Кому</label>
              <select className="input" value={selectedChild} onChange={e => setSelectedChild(e.target.value)} required>
                {childOptions}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="label" style={{ display: 'block', marginBottom: 6 }}>Баллы: {bonusAmount}</label>
              <input type="range" min={1} max={50} value={bonusAmount}
                onChange={e => setBonusAmount(Number(e.target.value))} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="label" style={{ display: 'block', marginBottom: 6 }}>Причина</label>
              <input
                type="text" className="input" placeholder="За что начисляем?"
                value={bonusReason} onChange={e => setBonusReason(e.target.value)} required
              />
            </div>
            <button type="submit" className="btn-primary" disabled={actionLoading || !bonusReason.trim()}>
              {actionLoading ? 'Начисляем...' : `Начислить +${bonusAmount} ⭐`}
            </button>
          </form>
        </Modal>
      )}

      {modal === 'penalty' && (
        <Modal title="➖ Штраф" onClose={() => setModal(null)}>
          <form onSubmit={handlePenalty}>
            <div style={{ marginBottom: 16 }}>
              <label className="label" style={{ display: 'block', marginBottom: 6 }}>Кому</label>
              <select className="input" value={selectedChild} onChange={e => setSelectedChild(e.target.value)} required>
                {childOptions}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="label" style={{ display: 'block', marginBottom: 6 }}>Баллы: -{penaltyAmount}</label>
              <input type="range" min={1} max={50} value={penaltyAmount}
                onChange={e => setPenaltyAmount(Number(e.target.value))} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="label" style={{ display: 'block', marginBottom: 6 }}>
                Причина <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type="text" className="input" placeholder="Обязательно укажи причину"
                value={penaltyReason} onChange={e => setPenaltyReason(e.target.value)} required
              />
            </div>
            <button type="submit" className="btn-primary" disabled={actionLoading || !penaltyReason.trim()}
              style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}>
              {actionLoading ? 'Применяем...' : `Штраф -${penaltyAmount} ⭐`}
            </button>
          </form>
        </Modal>
      )}

      {modal === 'x2' && (
        <Modal title="⚡ Активировать X2" onClose={() => setModal(null)}>
          <form onSubmit={handleX2}>
            <div style={{ marginBottom: 16 }}>
              <label className="label" style={{ display: 'block', marginBottom: 6 }}>Кому</label>
              <select className="input" value={selectedChild} onChange={e => setSelectedChild(e.target.value)} required>
                {childOptions}
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="label" style={{ display: 'block', marginBottom: 6 }}>Категория</label>
              <select className="input" value={x2Category} onChange={e => setX2Category(e.target.value)}>
                <option value="all">🌟 Все задания</option>
                <option value="home">🏠 Дом</option>
                <option value="study">📚 Учёба</option>
                <option value="active">⚡ Активность</option>
                <option value="hobby">🎨 Хобби</option>
                <option value="looks">✨ Внешний вид</option>
              </select>
            </div>
            <div className="card" style={{ background: 'var(--bg-secondary)', marginBottom: 16, fontSize: 14, color: 'var(--text-secondary)' }}>
              Использовано на этой неделе: {x2WeekCount}/2
            </div>
            <button type="submit" className="btn-primary" disabled={actionLoading}>
              {actionLoading ? 'Активируем...' : 'Активировать X2 ⚡'}
            </button>
          </form>
        </Modal>
      )}

      {modal === 'grade' && (
        <Modal title="📚 Записать оценку" onClose={() => setModal(null)}>
          <form onSubmit={handleGrade}>
            <div style={{ marginBottom: 16 }}>
              <label className="label" style={{ display: 'block', marginBottom: 6 }}>Кому</label>
              <select className="input" value={selectedChild} onChange={e => setSelectedChild(e.target.value)} required>
                {childOptions}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="label" style={{ display: 'block', marginBottom: 6 }}>Предмет</label>
              <input
                type="text" className="input" placeholder="Математика"
                value={gradeSubject} onChange={e => setGradeSubject(e.target.value)} required
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="label" style={{ display: 'block', marginBottom: 6 }}>Оценка</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[5, 4, 3, 2].map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGradeValue(g)}
                    style={{
                      flex: 1, padding: '12px 4px', borderRadius: 12,
                      border: `2px solid ${gradeValue === g ? 'var(--primary)' : 'var(--border)'}`,
                      background: gradeValue === g ? 'var(--primary)' : 'white',
                      color: gradeValue === g ? 'white' : 'var(--text-primary)',
                      fontWeight: 800, fontSize: 20, cursor: 'pointer'
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13, marginTop: 8 }}>
                {gradeValue === 5 && '+8 ⭐'}
                {gradeValue === 4 && '+5 ⭐'}
                {gradeValue === 3 && '0 ⭐'}
                {gradeValue === 2 && '-5 ⭐'}
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={actionLoading || !gradeSubject.trim()}>
              {actionLoading ? 'Записываем...' : 'Записать оценку'}
            </button>
          </form>
        </Modal>
      )}

      {/* Reject completion modal */}
      {rejectCompletionId && (
        <Modal title="❌ Причина отклонения" onClose={() => { setRejectCompletionId(null); setRejectCompletionReason('') }}>
          <form onSubmit={e => { e.preventDefault(); handleRejectCompletion(rejectCompletionId, rejectCompletionReason) }}>
            <div style={{ marginBottom: 16 }}>
              <label className="label" style={{ display: 'block', marginBottom: 6 }}>Почему отклоняем?</label>
              <input
                type="text" className="input" placeholder="Задание выполнено не полностью"
                value={rejectCompletionReason} onChange={e => setRejectCompletionReason(e.target.value)}
                autoFocus
              />
            </div>
            <button type="submit" className="btn-primary"
              style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}>
              Отклонить
            </button>
          </form>
        </Modal>
      )}
    </>
  )
}
