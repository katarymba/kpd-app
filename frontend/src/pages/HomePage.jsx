import { useState } from 'react'
import { getCurrentUser } from '../utils/storage'
import PointsHero from '../components/PointsHero'
import StreakBar from '../components/StreakBar'
import TaskCard from '../components/TaskCard'
import WeeklyTable from '../components/WeeklyTable'
import QuickActions from '../components/QuickActions'

const DEMO_TASKS = [
  { id: 1, name: 'Убраться в комнате',       category: 'home',   points: 5,  status: 'pending',   type: 'daily' },
  { id: 2, name: 'Сделать домашнее задание', category: 'study',  points: 8,  status: 'done',      type: 'daily' },
  { id: 3, name: 'Зарядка 20 минут',         category: 'active', points: 6,  status: 'confirmed', type: 'daily' },
  { id: 4, name: 'Порисовать',               category: 'hobby',  points: 4,  status: 'pending',   type: 'once' },
  { id: 5, name: 'Причесаться',              category: 'looks',  points: 3,  status: 'pending',   type: 'required' },
]

const DEMO_WEEK = {
  Mon: { home: 5, study: 8, active: 6, hobby: 0, like: 2, looks: 3 },
  Tue: { home: 0, study: 5, active: 0, hobby: 4, like: 0, looks: 0 },
  Wed: { home: 5, study: 8, active: 6, hobby: 0, like: 2, looks: 3 },
  Thu: { home: 0, study: 0, active: 0, hobby: 0, like: 0, looks: 0 },
  Fri: { home: 0, study: 0, active: 0, hobby: 0, like: 0, looks: 0 },
  Sat: { home: 0, study: 0, active: 0, hobby: 0, like: 0, looks: 0 },
  Sun: { home: 0, study: 0, active: 0, hobby: 0, like: 0, looks: 0 },
}

export default function HomePage() {
  const user = getCurrentUser()
  const isParent = user?.role === 'adult'

  const [tasks, setTasks] = useState(DEMO_TASKS)
  const [points, setPoints] = useState(142)
  const [x2Used, setX2Used] = useState(1)

  const handleComplete = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'done' } : t))
  }

  const handleConfirm = (id) => {
    const task = tasks.find(t => t.id === id)
    if (task) {
      setPoints(p => p + task.points)
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'confirmed' } : t))
    }
  }

  if (!isParent) {
    return (
      <>
        <PointsHero points={points} rate={1} name={user?.name ?? 'Игрок'} />

        <StreakBar completedDays={['Mon', 'Tue', 'Wed']} today="Thu" />

        <div className="section-title">Задания сегодня</div>
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} onComplete={handleComplete} isParent={false} />
        ))}

        <div className="section-title">Таблица недели</div>
        <WeeklyTable data={DEMO_WEEK} today="Thu" />
      </>
    )
  }

  return (
    <>
      <h2 style={{ marginBottom: 16 }}>Привет, {user?.name ?? 'взрослый'} 👋</h2>

      <div className="card" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 36 }}>👦</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>Саша</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            ⭐ {points} баллов · ≈ {points} ₽
          </div>
        </div>
      </div>

      <div className="section-title">Быстрые действия</div>
      <QuickActions
        x2Used={x2Used}
        onLike={() => { setPoints(p => p + 2); alert('👍 Лайк поставлен! +2 ⭐') }}
        onPoints={() => { setPoints(p => p + 5); alert('➕ Начислено +5 ⭐') }}
        onConfirm={() => {
          const pending = tasks.find(t => t.status === 'done')
          if (pending) handleConfirm(pending.id)
          else alert('Нет заданий для подтверждения')
        }}
        onDouble={() => { setX2Used(n => n + 1); alert('⚡ Режим X2 включён на сегодня!') }}
      />

      <div className="section-title">Задания детей</div>
      {tasks.map(task => (
        <TaskCard key={task.id} task={task} onConfirm={handleConfirm} isParent={true} />
      ))}
    </>
  )
}
