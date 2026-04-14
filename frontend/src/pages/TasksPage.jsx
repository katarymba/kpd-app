import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getTasks, completeTask, confirmTask, createTask } from '../utils/tasks'
import TaskCard from '../components/TaskCard'
import BottomNav from '../components/BottomNav'

const CATEGORY_ICONS = {
  home: '🏠',
  study: '📚',
  active: '⚡',
  hobby: '🎨',
  looks: '✨',
  like: '👍',
}

export default function TasksPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', category: 'home', type: 'daily', points: 5 })
  const [saving, setSaving] = useState(false)

  const isAdult = profile?.role === 'adult'

  useEffect(() => {
    if (profile?.family_id) loadTasks()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  async function loadTasks() {
    setLoading(true)
    setError('')
    try {
      const data = await getTasks(profile.family_id)
      setTasks(isAdult ? data : data.filter(t => t.assigned_to === profile.id || !t.assigned_to))
    } catch {
      setError('Не удалось загрузить задания.')
    } finally {
      setLoading(false)
    }
  }

  async function handleComplete(taskId) {
    try {
      await completeTask(taskId)
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'done' } : t))
    } catch {
      setError('Ошибка обновления задания.')
    }
  }

  async function handleConfirm(taskId) {
    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) return
      await confirmTask(taskId, task.assigned_to || profile.id, profile.family_id, task.points, profile.id)
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'confirmed' } : t))
    } catch {
      setError('Ошибка подтверждения задания.')
    }
  }

  async function handleAddTask(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const task = await createTask({
        ...newTask,
        family_id: profile.family_id,
        created_by: profile.id,
        status: 'pending'
      })
      setTasks(prev => [task, ...prev])
      setShowAddForm(false)
      setNewTask({ title: '', category: 'home', type: 'daily', points: 5 })
    } catch {
      setError('Не удалось создать задание.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="app-container">
      <div className="page">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2>Задания</h2>
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
            <form onSubmit={handleAddTask}>
              <div style={{ marginBottom: 12 }}>
                <label className="label" style={{ display: 'block', marginBottom: 4 }}>Название</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Убраться в комнате"
                  value={newTask.title}
                  onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label className="label" style={{ display: 'block', marginBottom: 4 }}>Категория</label>
                  <select
                    className="input"
                    value={newTask.category}
                    onChange={e => setNewTask(p => ({ ...p, category: e.target.value }))}
                  >
                    {Object.entries(CATEGORY_ICONS).map(([k, v]) => (
                      <option key={k} value={k}>{v} {k}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" style={{ display: 'block', marginBottom: 4 }}>Тип</label>
                  <select
                    className="input"
                    value={newTask.type}
                    onChange={e => setNewTask(p => ({ ...p, type: e.target.value }))}
                  >
                    <option value="daily">Ежедневное</option>
                    <option value="once">Разовое</option>
                    <option value="required">Обязательное</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="label" style={{ display: 'block', marginBottom: 4 }}>Баллы: {newTask.points}</label>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={newTask.points}
                  onChange={e => setNewTask(p => ({ ...p, points: Number(e.target.value) }))}
                  style={{ width: '100%' }}
                />
              </div>

              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Сохраняем...' : 'Добавить задание'}
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 32, fontSize: 32 }}>⭐</div>
        ) : tasks.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 32 }}>
            {isAdult
              ? 'Нет заданий. Добавь первое задание! ✅'
              : 'Нет заданий — попроси взрослого добавить! 😊'}
          </div>
        ) : (
          tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={handleComplete}
              onConfirm={handleConfirm}
              isParent={isAdult}
            />
          ))
        )}
      </div>

      <BottomNav active="tasks" onChange={key => navigate(`/app/${key}`)} />
    </div>
  )
}
