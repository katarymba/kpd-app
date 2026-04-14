import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getTasks, getTasksWithStatus, createTask, deleteTask, completeTask, confirmCompletion, rejectCompletion, getPendingCompletions } from '../utils/tasks'
import TaskCard from '../components/TaskCard'
import { getFamilyMembers } from '../utils/auth'

const CATEGORY_ICONS = {
  home: '🏠',
  study: '📚',
  active: '⚡',
  hobby: '🎨',
  looks: '✨',
  other: '📌',
}

const isAdultRole = (role) => role === 'admin' || role === 'adult'

export default function TasksPage() {
  const { profile } = useAuth()
  const [tasks, setTasks] = useState([])
  const [pendingCompletions, setPendingCompletions] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('tasks') // 'tasks' | 'pending'
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', category: 'home', type: 'daily', points: 5, assigned_to: '' })
  const [saving, setSaving] = useState(false)

  const isAdult = profile && isAdultRole(profile.role)

  useEffect(() => {
    if (profile?.family_id) loadTasks()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  async function loadTasks() {
    setLoading(true)
    setError('')
    try {
      if (isAdult) {
        const [allTasks, pending, membersData] = await Promise.all([
          getTasks(profile.family_id),
          getPendingCompletions(profile.family_id),
          getFamilyMembers(profile.family_id)
        ])
        setTasks(allTasks)
        setPendingCompletions(pending)
        setMembers(membersData)
      } else {
        const data = await getTasksWithStatus(profile.family_id, profile.id)
        setTasks(data)
      }
    } catch {
      setError('Не удалось загрузить задания.')
    } finally {
      setLoading(false)
    }
  }

  async function handleComplete(taskId) {
    try {
      await completeTask(taskId, profile.id, profile.family_id)
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'pending' } : t))
    } catch (err) {
      setError(err.message || 'Ошибка обновления задания.')
    }
  }

  async function handleConfirm(completionId) {
    try {
      await confirmCompletion(completionId, profile.id, profile.family_id)
      setPendingCompletions(prev => prev.filter(c => c.id !== completionId))
    } catch (err) {
      setError(err.message || 'Ошибка подтверждения задания.')
    }
  }

  async function handleReject(completionId) {
    const reason = prompt('Причина отклонения:') || 'Не указана'
    try {
      await rejectCompletion(completionId, profile.id, reason)
      setPendingCompletions(prev => prev.filter(c => c.id !== completionId))
    } catch (err) {
      setError(err.message || 'Ошибка отклонения.')
    }
  }

  async function handleDelete(taskId) {
    if (!confirm('Удалить задание?')) return
    try {
      await deleteTask(taskId)
      setTasks(prev => prev.filter(t => t.id !== taskId))
    } catch (err) {
      setError(err.message || 'Ошибка удаления.')
    }
  }

  async function handleAddTask(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const taskData = {
        title: newTask.title,
        category: newTask.category,
        type: newTask.type,
        points: newTask.points,
        family_id: profile.family_id,
        created_by: profile.id,
        is_active: true
      }
      if (newTask.assigned_to) taskData.assigned_to = newTask.assigned_to
      const task = await createTask(taskData)
      setTasks(prev => [task, ...prev])
      setShowAddForm(false)
      setNewTask({ title: '', category: 'home', type: 'daily', points: 5, assigned_to: '' })
    } catch {
      setError('Не удалось создать задание.')
    } finally {
      setSaving(false)
    }
  }

  const children = members.filter(m => m.role === 'child')

  return (
    <>
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

      {/* Tabs for adults */}
      {isAdult && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'var(--bg-secondary)', borderRadius: 12, padding: 4 }}>
          {[
            { key: 'tasks', label: 'Все задания' },
            { key: 'pending', label: `На проверке ${pendingCompletions.length > 0 ? `(${pendingCompletions.length})` : ''}` }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, padding: '8px 12px', borderRadius: 10, border: 'none',
                background: activeTab === tab.key ? 'white' : 'transparent',
                fontWeight: activeTab === tab.key ? 700 : 400,
                cursor: 'pointer', fontSize: 13,
                boxShadow: activeTab === tab.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                color: 'var(--text-primary)'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Add Task Form */}
      {isAdult && showAddForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <form onSubmit={handleAddTask}>
            <div style={{ marginBottom: 12 }}>
              <label className="label" style={{ display: 'block', marginBottom: 4 }}>Название</label>
              <input
                type="text" className="input" placeholder="Убраться в комнате"
                value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label className="label" style={{ display: 'block', marginBottom: 4 }}>Категория</label>
                <select className="input" value={newTask.category}
                  onChange={e => setNewTask(p => ({ ...p, category: e.target.value }))}>
                  {Object.entries(CATEGORY_ICONS).map(([k, v]) => (
                    <option key={k} value={k}>{v} {k}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" style={{ display: 'block', marginBottom: 4 }}>Тип</label>
                <select className="input" value={newTask.type}
                  onChange={e => setNewTask(p => ({ ...p, type: e.target.value }))}>
                  <option value="daily">Ежедневное</option>
                  <option value="once">Разовое</option>
                  <option value="required">Обязательное</option>
                </select>
              </div>
            </div>

            {children.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <label className="label" style={{ display: 'block', marginBottom: 4 }}>Назначить</label>
                <select className="input" value={newTask.assigned_to}
                  onChange={e => setNewTask(p => ({ ...p, assigned_to: e.target.value }))}>
                  <option value="">Всем детям</option>
                  {children.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label className="label" style={{ display: 'block', marginBottom: 4 }}>Баллы: {newTask.points}</label>
              <input type="range" min={1} max={20} value={newTask.points}
                onChange={e => setNewTask(p => ({ ...p, points: Number(e.target.value) }))}
                style={{ width: '100%' }} />
            </div>

            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Сохраняем...' : 'Добавить задание'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 32, fontSize: 32 }}>⭐</div>
      ) : isAdult && activeTab === 'pending' ? (
        // Pending completions tab
        pendingCompletions.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 32 }}>
            Нет заданий на проверке 🎉
          </div>
        ) : (
          pendingCompletions.map(completion => (
            <div key={completion.id} className="task-card" style={{ marginBottom: 8 }}>
              <div className="task-icon">{CATEGORY_ICONS[completion.tasks?.category] || '✅'}</div>
              <div className="task-info">
                <div className="task-name">{completion.tasks?.title}</div>
                <div className="task-meta">
                  {completion.profiles?.name} · +{completion.tasks?.points} ⭐
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  className="btn-primary btn-sm"
                  style={{ width: 'auto', padding: '8px 12px' }}
                  onClick={() => handleConfirm(completion.id)}
                >
                  ✅
                </button>
                <button
                  className="btn-ghost btn-sm"
                  style={{ width: 'auto', padding: '8px 12px', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                  onClick={() => handleReject(completion.id)}
                >
                  ❌
                </button>
              </div>
            </div>
          ))
        )
      ) : tasks.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 32 }}>
          {isAdult
            ? 'Нет заданий. Добавь первое задание! ✅'
            : 'Нет заданий — попроси взрослого добавить! 😊'}
        </div>
      ) : (
        tasks.map(task => (
          <div key={task.id} style={{ position: 'relative', marginBottom: 8 }}>
            <TaskCard
              task={task}
              onComplete={!isAdult ? () => handleComplete(task.id) : undefined}
              isParent={isAdult}
            />
            {isAdult && (
              <button
                onClick={() => handleDelete(task.id)}
                style={{
                  position: 'absolute', top: 8, right: 8,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-secondary)', fontSize: 16, padding: 4
                }}
                title="Удалить задание"
              >
                🗑
              </button>
            )}
          </div>
        ))
      )}
    </>
  )
}

