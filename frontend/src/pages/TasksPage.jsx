import { useState } from 'react'
import TaskCard from '../components/TaskCard'
import { getCurrentUser } from '../utils/storage'

const DEMO_TASKS = [
  { id: 1, name: 'Убраться в комнате',       category: 'home',   points: 5,  status: 'pending',   type: 'daily' },
  { id: 2, name: 'Сделать домашнее задание', category: 'study',  points: 8,  status: 'done',      type: 'daily' },
  { id: 3, name: 'Зарядка 20 минут',         category: 'active', points: 6,  status: 'confirmed', type: 'daily' },
  { id: 4, name: 'Порисовать',               category: 'hobby',  points: 4,  status: 'pending',   type: 'once' },
  { id: 5, name: 'Причесаться',              category: 'looks',  points: 3,  status: 'pending',   type: 'required' },
]

export default function TasksPage() {
  const user = getCurrentUser()
  const isParent = user?.role === 'adult'
  const [tasks, setTasks] = useState(DEMO_TASKS)

  const handleComplete = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'done' } : t))
  }

  const handleConfirm = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'confirmed' } : t))
  }

  return (
    <>
      <h2 style={{ marginBottom: 16 }}>Все задания</h2>
      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          onComplete={handleComplete}
          onConfirm={handleConfirm}
          isParent={isParent}
        />
      ))}
    </>
  )
}
