import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getTasks, completeTask, confirmTask } from '../utils/tasks'
import { addPoints, getBalance, getWeeklyPoints } from '../utils/points'
import PointsHero from '../components/PointsHero'
import WeeklyTable from '../components/WeeklyTable'
import BottomNav from '../components/BottomNav'
import QuickActions from '../components/QuickActions'
import TaskCard from '../components/TaskCard'
import StreakBar from '../components/StreakBar'
import { getFamilyMembers } from '../utils/auth'
import { supabase } from '../utils/supabase'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const TODAY = DAYS[new Date().getDay()]

function buildWeeklyData(pointsData) {
  const empty = { home: 0, study: 0, active: 0, hobby: 0, like: 0, looks: 0 }
  const result = {}
  DAYS.forEach(d => { result[d] = { ...empty } })

  pointsData.forEach(p => {
    const day = DAYS[new Date(p.created_at).getDay()]
    const cat = p.category || 'home'
    if (result[day] && empty[cat] !== undefined) {
      result[day][cat] = (result[day][cat] || 0) + Math.max(0, p.amount)
    }
  })
  return result
}

export default function HomePage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [tasks, setTasks] = useState([])
  const [balance, setBalance] = useState(0)
  const [weeklyData, setWeeklyData] = useState(null)
  const [children, setChildren] = useState([])
  const [selectedChild, setSelectedChild] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const isAdult = profile?.role === 'adult'

  useEffect(() => {
    if (profile?.family_id) {
      loadData()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [tasksData, membersData] = await Promise.all([
        getTasks(profile.family_id),
        getFamilyMembers(profile.family_id)
      ])
      setTasks(tasksData)

      if (isAdult) {
        const kids = membersData.filter(m => m.role === 'child')
        setChildren(kids)
        if (kids.length > 0) {
          const child = kids[0]
          setSelectedChild(child)
          const [bal, weekly] = await Promise.all([
            getBalance(child.id),
            getWeeklyPoints(child.id)
          ])
          setBalance(bal)
          setWeeklyData(buildWeeklyData(weekly))
        }
      } else {
        const [bal, weekly] = await Promise.all([
          getBalance(profile.id),
          getWeeklyPoints(profile.id)
        ])
        setBalance(bal)
        setWeeklyData(buildWeeklyData(weekly))
      }
    } catch {
      setError('Не удалось загрузить данные.')
    } finally {
      setLoading(false)
    }
  }

  async function handleComplete(taskId) {
    try {
      await completeTask(taskId)
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'done' } : t))
    } catch {
      setError('Не удалось обновить задание.')
    }
  }

  async function handleConfirm(taskId) {
    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) return
      const childId = task.assigned_to || selectedChild?.id || profile.id
      await confirmTask(taskId, childId, profile.family_id, task.points, profile.id)
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'confirmed' } : t))
      setBalance(prev => prev + task.points)
    } catch {
      setError('Не удалось подтвердить задание.')
    }
  }

  async function handleLike() {
    if (!selectedChild && isAdult) return
    const childId = isAdult ? selectedChild?.id : profile.id
    if (!childId) return
    try {
      await addPoints({
        familyId: profile.family_id,
        childId,
        amount: 2,
        description: '👍 Лайк',
        createdBy: profile.id,
        category: 'like'
      })
      setBalance(prev => prev + 2)
    } catch {
      setError('Ошибка начисления баллов.')
    }
  }

  async function handleBonus() {
    const childId = isAdult ? selectedChild?.id : profile.id
    if (!childId) return
    try {
      await addPoints({
        familyId: profile.family_id,
        childId,
        amount: 5,
        description: '➕ Бонус',
        createdBy: profile.id,
        category: 'home'
      })
      setBalance(prev => prev + 5)
    } catch {
      setError('Ошибка начисления баллов.')
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  const todayTasks = tasks.filter(t => {
    if (isAdult) return true
    return t.assigned_to === profile.id || !t.assigned_to
  })

  if (loading) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ fontSize: 48 }}>⭐</div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <div className="page">
        {error && (
          <div style={{ color: 'var(--danger)', marginBottom: 12, fontSize: 14, textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Child view */}
        {!isAdult && (
          <>
            <PointsHero points={balance} rate={1} name={profile?.name} />
            <StreakBar completedDays={[]} today={TODAY} />

            <div className="section-title">Задания сегодня</div>
            {todayTasks.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 32 }}>
                Нет заданий — попроси взрослого добавить! 😊
              </div>
            ) : (
              todayTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={handleComplete}
                  isParent={false}
                />
              ))
            )}

            {weeklyData && (
              <>
                <div className="section-title">Таблица недели</div>
                <WeeklyTable data={weeklyData} today={TODAY} />
              </>
            )}
          </>
        )}

        {/* Adult view */}
        {isAdult && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2>Привет, {profile?.name}! 👋</h2>
              <button
                onClick={handleLogout}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13 }}
              >
                Выйти
              </button>
            </div>

            {children.length > 0 && selectedChild ? (
              <>
                {children.length > 1 && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto' }}>
                    {children.map(child => (
                      <button
                        key={child.id}
                        onClick={() => setSelectedChild(child)}
                        style={{
                          padding: '6px 16px',
                          borderRadius: 20,
                          border: '2px solid',
                          borderColor: selectedChild.id === child.id ? 'var(--primary)' : 'var(--border)',
                          background: selectedChild.id === child.id ? 'var(--primary)' : 'white',
                          color: selectedChild.id === child.id ? 'white' : 'var(--text-primary)',
                          fontWeight: 700,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {child.avatar || '👤'} {child.name}
                      </button>
                    ))}
                  </div>
                )}

                <div className="card" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 36 }}>{selectedChild.avatar || '👤'}</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{selectedChild.name}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                      ⭐ {balance} баллов · ≈ {balance} ₽
                    </div>
                  </div>
                </div>

                <div className="section-title">Быстрые действия</div>
                <QuickActions
                  x2Used={0}
                  onLike={handleLike}
                  onPoints={handleBonus}
                  onConfirm={() => {
                    const pending = tasks.find(t => t.status === 'done')
                    if (pending) handleConfirm(pending.id)
                  }}
                  onDouble={() => {}}
                />
              </>
            ) : (
              <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 32, marginBottom: 24 }}>
                В семье пока нет детей. Поделись кодом семьи! 👨‍👩‍👧
              </div>
            )}

            <div className="section-title">Задания детей</div>
            {tasks.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 32 }}>
                Нет заданий. Перейди во вкладку «Задания», чтобы добавить! ✅
              </div>
            ) : (
              tasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onConfirm={handleConfirm}
                  isParent={true}
                />
              ))
            )}
          </>
        )}
      </div>

      <BottomNav active="home" onChange={key => navigate(`/app/${key}`)} />
    </div>
  )
}
